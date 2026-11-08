// Real checkout from the app: the same Stripe flow as the website. The server
// (restaurant-site functions /stripe-session) builds the Stripe session and, because
// we send the customer's Firebase ID token, links the order to them for points.
// After paying, Stripe lands them on the restaurant's website order page, which
// tracks the order live.
import * as WebBrowser from "expo-web-browser";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const FUNCTIONS_URL =
  process.env.EXPO_PUBLIC_FUNCTIONS_URL || "https://us-central1-menudock-platform.cloudfunctions.net/payments";

// Collection only for now: delivery needs the address and area checks the website has.
export function checkoutProblem({ restaurant, items, name, phone }) {
  const ordering = restaurant?.ordering || {};
  const total = items.reduce((a, x) => a + x.price * x.qty, 0);
  if (items.length === 0) return "Your basket is empty.";
  if (Array.isArray(ordering.orderTypes) && !ordering.orderTypes.includes("Collection")) {
    return "This restaurant only takes delivery orders, which you can place on its website.";
  }
  if (ordering.minOrder && total < ordering.minOrder) {
    return `The minimum order is £${Number(ordering.minOrder).toFixed(2)}.`;
  }
  if (!name.trim()) return "Please add your name.";
  if (phone.replace(/\D/g, "").length < 11) return "Please add a phone number the restaurant can call.";
  return null;
}

export async function startCheckout({ restaurant, user, items, name, phone, fetchImpl = fetch }) {
  const total = Math.round(items.reduce((a, x) => a + x.price * x.qty, 0) * 100) / 100;
  const cartItems = items.map((x) => ({ name: x.name, price: x.price, quantity: x.qty, extras: [] }));
  const idToken = await user.getIdToken();

  const res = await fetchImpl(`${FUNCTIONS_URL}/stripe-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ cartItems, total, orderType: "Collection", restaurantId: restaurant.id }),
  });
  const session = await res.json().catch(() => null);
  if (!res.ok || !session?.id || !session?.url) {
    throw new Error(typeof session === "string" ? session : "We couldn't start the payment. Please try again.");
  }

  // Same pending order the website writes; the Stripe webhook marks it paid.
  await setDoc(doc(db, "orders", session.id), {
    id: session.id,
    restaurantId: restaurant.id,
    payment_status: "pending",
    orderType: "Collection",
    name: name.trim(),
    contactNumber: phone.trim(),
    address: "",
    notes: "",
    email: user.email || "",
    orderItems: cartItems,
    total,
    source: "loyalty-app",
    createdAt: new Date().toLocaleString("en-GB"),
  });

  await WebBrowser.openBrowserAsync(session.url);
  return session.id;
}

// After the payment browser closes: was the order paid? The Stripe webhook usually
// lands within a second or two, so check a few times before giving up.
export async function waitForPayment(orderId, { tries = 6, delayMs = 1000, getDocImpl = getDoc } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const snap = await getDocImpl(doc(db, "orders", orderId));
    if (snap.exists() && snap.data().payment_status === "paid") return snap.data();
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}
