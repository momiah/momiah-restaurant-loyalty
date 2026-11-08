import * as WebBrowser from "expo-web-browser";
import { checkoutProblem, startCheckout, waitForPayment, FUNCTIONS_URL } from "../lib/checkout";

jest.mock("expo-web-browser", () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock("expo-linking", () => ({
  createURL: (path) => `menudock-loyalty://${path}`,
  parse: (url) => ({ queryParams: Object.fromEntries(new URL(url.replace("menudock-loyalty://", "https://x/")).searchParams) }),
}));
jest.mock("firebase/firestore", () => ({ doc: (_db, ...path) => path.join("/"), getDoc: jest.fn() }));
jest.mock("../config/firebase", () => ({ db: {} }));

const restaurant = { id: "taco-monster", ordering: { orderTypes: ["Collection", "Delivery"], minOrder: 5 } };
const items = [{ key: "k", name: "Soft Taco", price: 2.55, qty: 3, extras: ["Sour Cream"], protein: "Beef", secondProtein: null, thirdProtein: null }];
const user = { uid: "u1", email: "ann@example.com", getIdToken: jest.fn(() => Promise.resolve("ID_TOKEN")) };
const okFetch = () => jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "cs_1", url: "https://checkout.stripe.com/x" }) }));

beforeEach(() => jest.clearAllMocks());

it("checks the order before paying", () => {
  const ok = { restaurant, items, name: "Ann", phone: "07700 900123" };
  expect(checkoutProblem(ok)).toBeNull();
  expect(checkoutProblem({ ...ok, items: [] })).toMatch(/empty/);
  expect(checkoutProblem({ ...ok, items: [{ ...items[0], price: 2, qty: 1 }] })).toMatch(/minimum order is £5.00/);
  expect(checkoutProblem({ ...ok, name: " " })).toMatch(/name/);
  expect(checkoutProblem({ ...ok, phone: "123" })).toMatch(/phone/);
  expect(checkoutProblem({ ...ok, restaurant: { ordering: { orderTypes: ["Delivery"] } } })).toMatch(/only takes delivery/);
});

it("sends what the customer wants (no prices) as the signed-in member, and returns to the app", async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: "success", url: "menudock-loyalty://checkout?orderId=cs_1&result=success" });
  const fetchImpl = okFetch();
  const res = await startCheckout({ restaurant, user, items, name: " Ann ", phone: "07700900123", fetchImpl });

  expect(res).toEqual({ orderId: "cs_1", result: "success" });
  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe(`${FUNCTIONS_URL}/stripe-session`);
  expect(init.headers.Authorization).toBe("Bearer ID_TOKEN"); // links the order to them for points
  expect(JSON.parse(init.body)).toEqual({
    restaurantId: "taco-monster",
    orderType: "Collection",
    cartItems: [{ name: "Soft Taco", quantity: 3, extras: ["Sour Cream"], protein: "Beef", secondProtein: null, thirdProtein: null }],
    customer: { name: "Ann", contactNumber: "07700900123" },
    appReturnUrl: "menudock-loyalty://checkout",
  });
  expect(init.body).not.toContain("2.55"); // prices come from the server's menu
  expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith("https://checkout.stripe.com/x", "menudock-loyalty://checkout");
});

it("reports a cancelled or closed payment", async () => {
  WebBrowser.openAuthSessionAsync.mockResolvedValueOnce({ type: "success", url: "menudock-loyalty://checkout?orderId=cs_1&result=cancel" });
  expect(await startCheckout({ restaurant, user, items, name: "Ann", phone: "07700900123", fetchImpl: okFetch() })).toEqual({ orderId: "cs_1", result: "cancel" });
  WebBrowser.openAuthSessionAsync.mockResolvedValueOnce({ type: "dismiss" });
  expect(await startCheckout({ restaurant, user, items, name: "Ann", phone: "07700900123", fetchImpl: okFetch() })).toEqual({ orderId: "cs_1", result: "dismissed" });
});

it("shows the server's message when checkout can't start", async () => {
  const fetchImpl = () => Promise.resolve({ ok: false, json: () => Promise.resolve("Soft Taco is no longer available. Please remove it from your basket.") });
  await expect(startCheckout({ restaurant, user, items, name: "Ann", phone: "07700900123", fetchImpl })).rejects.toThrow("no longer available");
  expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
});

it("waits briefly for the webhook to confirm payment", async () => {
  const pending = { exists: () => true, data: () => ({ payment_status: "pending" }) };
  const paid = { exists: () => true, data: () => ({ payment_status: "paid", orderNumber: 1004 }) };
  const getDocImpl = jest.fn().mockResolvedValueOnce(pending).mockResolvedValueOnce(paid);
  expect(await waitForPayment("cs_1", { delayMs: 0, getDocImpl })).toMatchObject({ orderNumber: 1004 });
  const never = jest.fn().mockResolvedValue(pending);
  expect(await waitForPayment("cs_1", { tries: 3, delayMs: 0, getDocImpl: never })).toBeNull();
});
