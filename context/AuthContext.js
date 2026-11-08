// Customer authentication + loyalty profile. Each customer's profile (points, etc.)
// lives under their restaurant: restaurants/{restaurantId}/customers/{uid}.
// Points are added by the server; the profile is watched live so a balance updates
// as soon as a payment is confirmed.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../config/firebase";
import { useRestaurant } from "./RestaurantContext";
import { customerRef, ensureCustomer } from "../lib/points";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { restaurant } = useRestaurant();
  const restaurantId = restaurant?.id || null;

  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track the signed-in user.
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setEmailVerified(!!u?.emailVerified);
        setLoading(false);
      }),
    []
  );

  // Create the profile if needed, then watch it.
  useEffect(() => {
    if (!user || !restaurantId) {
      setProfile(null);
      return undefined;
    }
    let unsubscribe = () => {};
    let alive = true;
    ensureCustomer(restaurantId, user)
      .then(() => {
        if (!alive) return;
        unsubscribe = onSnapshot(
          customerRef(restaurantId, user.uid),
          (snap) => setProfile(snap.exists() ? snap.data() : null),
          () => setProfile(null)
        );
      })
      .catch(() => alive && setProfile(null));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [user, restaurantId]);

  // Collect points from orders paid with this email before joining or verifying.
  const claimPoints = useCallback(async () => {
    if (!user || !restaurantId || !user.emailVerified) return { claimed: 0, orders: 0 };
    const { data } = await httpsCallable(functions, "claimLoyaltyPoints")({ restaurantId });
    return data || { claimed: 0, orders: 0 };
  }, [user, restaurantId]);

  // Once per sign-in (and on verifying), after the profile exists.
  const profileReady = !!profile;
  useEffect(() => {
    if (profileReady && emailVerified) claimPoints().catch(() => {});
  }, [profileReady, emailVerified, claimPoints]);

  // After the customer taps the link in their email: refresh the account (and its ID
  // token, which the server checks) and collect any points waiting for them.
  const checkVerified = async () => {
    if (!user) return false;
    await reload(user);
    if (!user.emailVerified) return false;
    await user.getIdToken(true);
    setEmailVerified(true);
    return true;
  };
  const resendVerification = () => (user ? sendEmailVerification(user) : Promise.resolve());

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signUp = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    if (restaurantId) await ensureCustomer(restaurantId, cred.user);
    await sendEmailVerification(cred.user).catch(() => {});
    return cred;
  };
  const signOutUser = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        emailVerified,
        signIn,
        signUp,
        signOutUser,
        checkVerified,
        resendVerification,
        claimPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
