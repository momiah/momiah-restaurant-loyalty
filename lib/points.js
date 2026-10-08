import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// PHASE 1 PLACEHOLDER earn rate: 1 point per £1 spent. The real earn/redeem/tier/expiry
// rules are a Phase 2 decision — keep this the single source of truth so it's easy to change.
export const POINTS_PER_POUND = 1;

export function pointsForAmount(amount) {
  return Math.floor((Number(amount) || 0) * POINTS_PER_POUND);
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

export async function ensureCustomer(restaurantId, user) {
  const ref = customerRef(restaurantId, user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
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
  return snap.data();
}

// Award points for a purchase (Phase 1). In production this is driven by a verified
// payment (reuse the website's Stripe webhook) rather than the client alone.
export async function awardPoints(restaurantId, uid, amount) {
  const pts = pointsForAmount(amount);
  await updateDoc(customerRef(restaurantId, uid), {
    points: increment(pts),
    lifetimePoints: increment(pts),
  });
  return pts;
}
