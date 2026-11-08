import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Points are awarded by the server when a payment is confirmed (see restaurant-site
// docs/LOYALTY.md); this app only shows them. The earn rate is per restaurant.
export const DEFAULT_POINTS_PER_POUND = 1;

export function pointsPerPound(restaurant) {
  const loyalty = restaurant?.loyalty || {};
  if (loyalty.enabled === false) return 0;
  const rate = Number(loyalty.pointsPerPound ?? DEFAULT_POINTS_PER_POUND);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

// An estimate for display ("+12 pts"); the server's figure is what counts.
export function pointsForAmount(amount, restaurant) {
  return Math.floor((Number(amount) || 0) * pointsPerPound(restaurant));
}

// Reward tiers used by the Account screen's progress + rewards list (placeholder).
export const REWARD_TIERS = [
  { points: 500, label: "£5 off your order" },
  { points: 1000, label: "Free regular item" },
];

export function nextReward(points) {
  return REWARD_TIERS.find((t) => t.points > points) || null;
}

// A customer's loyalty profile lives under their restaurant: scoped, never shared.
export function customerRef(restaurantId, uid) {
  return doc(db, "restaurants", restaurantId, "customers", uid);
}

// Creates the profile on first sign-in. It must start at zero points: the security
// rules only let the server add points.
export async function ensureCustomer(restaurantId, user) {
  const ref = customerRef(restaurantId, user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const data = {
    name: user.displayName || "",
    email: user.email || "",
    points: 0,
    lifetimePoints: 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return data;
}
