// Checkout from the app. The app sends what the customer wants and their details to
// the same checkout function as the website (restaurant-site /stripe-session), which
// prices everything from the menu and records the order. The customer's Firebase ID
// token links the order to them for points. After paying, Stripe sends them straight
// back into the app, which tracks the order itself.
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const FUNCTIONS_URL =
  process.env.EXPO_PUBLIC_FUNCTIONS_URL || "https://us-central1-menudock-platform.cloudfunctions.net/payments";

// Collection only for now: delivery needs the address and area checks the website has.
// These mirror the server's checks so problems show before paying; the server decides.
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

// Where Stripe returns to: this app (menudock-loyalty://checkout in a build, an
// exp:// link in Expo Go).
export const returnUrl = () => Linking.createURL("checkout");

// Opens Stripe Checkout. Resolves { orderId, result } where result is "success",
// "cancel" (the customer backed out on Stripe) or "dismissed" (browser closed).
export async function startCheckout({ restaurant, user, items, name, phone, fetchImpl = fetch }) {
  const appReturnUrl = returnUrl();
  const idToken = await user.getIdToken();
  const res = await fetchImpl(`${FUNCTIONS_URL}/stripe-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      restaurantId: restaurant.id,
      orderType: "Collection",
      cartItems: items.map((x) => ({
        name: x.name,
        quantity: x.qty,
        extras: x.extras || [],
        protein: x.protein || null,
        secondProtein: x.secondProtein || null,
        thirdProtein: x.thirdProtein || null,
      })),
      customer: { name: name.trim(), contactNumber: phone.trim() },
      appReturnUrl,
    }),
  });
  const session = await res.json().catch(() => null);
  if (!res.ok || !session?.id || !session?.url) {
    throw new Error(typeof session === "string" ? session : "We couldn't start the payment. Please try again.");
  }

  const outcome = await WebBrowser.openAuthSessionAsync(session.url, appReturnUrl);
  if (outcome.type === "success" && outcome.url) {
    const { queryParams } = Linking.parse(outcome.url);
    return { orderId: queryParams?.orderId || session.id, result: queryParams?.result === "success" ? "success" : "cancel" };
  }
  return { orderId: session.id, result: "dismissed" };
}

// Was the order paid? Used when the browser was closed without coming back through
// the app link. The Stripe webhook usually lands within a second or two.
export async function waitForPayment(orderId, { tries = 6, delayMs = 1000, getDocImpl = getDoc } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const snap = await getDocImpl(doc(db, "orders", orderId));
    if (snap.exists() && snap.data().payment_status === "paid") return snap.data();
    if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}
