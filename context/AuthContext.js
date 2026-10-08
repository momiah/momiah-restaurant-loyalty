// Customer authentication + loyalty profile. Each customer's profile (points, etc.)
// lives under their restaurant: restaurants/{restaurantId}/customers/{uid}.
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { auth } from "../config/firebase";
import { useRestaurant } from "./RestaurantContext";
import { customerRef, ensureCustomer } from "../lib/points";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { restaurant } = useRestaurant();
  const restaurantId = restaurant?.id || null;

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track the signed-in user.
  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  // Load (and create if needed) the loyalty profile once both user + restaurant are known.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user || !restaurantId) { setProfile(null); return; }
      try {
        const data = await ensureCustomer(restaurantId, user);
        if (alive) setProfile(data);
      } catch {
        if (alive) setProfile(null);
      }
    })();
    return () => { alive = false; };
  }, [user, restaurantId]);

  async function refreshProfile() {
    if (!user || !restaurantId) return;
    const snap = await getDoc(customerRef(restaurantId, user.uid));
    if (snap.exists()) setProfile(snap.data());
  }

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signUp = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    if (restaurantId) await ensureCustomer(restaurantId, cred.user);
    return cred;
  };
  const signOutUser = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOutUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
