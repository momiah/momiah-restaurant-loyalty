import * as WebBrowser from "expo-web-browser";
import { checkoutProblem, startCheckout, waitForPayment, FUNCTIONS_URL } from "../lib/checkout";

jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn(() => Promise.resolve({ type: "dismiss" })) }));
const mockSetDoc = jest.fn(() => Promise.resolve());
jest.mock("firebase/firestore", () => ({
  doc: (_db, ...path) => path.join("/"),
  setDoc: (...a) => mockSetDoc(...a),
  getDoc: jest.fn(),
}));
jest.mock("../config/firebase", () => ({ db: {} }));

const restaurant = { id: "taco-monster", ordering: { orderTypes: ["Collection", "Delivery"], minOrder: 5 } };
const items = [{ name: "Soft Taco", price: 2.15, qty: 3 }];
const user = { uid: "u1", email: "ann@example.com", getIdToken: jest.fn(() => Promise.resolve("ID_TOKEN")) };

beforeEach(() => jest.clearAllMocks());

it("checks the order before paying", () => {
  const ok = { restaurant, items, name: "Ann", phone: "07700 900123" };
  expect(checkoutProblem(ok)).toBeNull();
  expect(checkoutProblem({ ...ok, items: [] })).toMatch(/empty/);
  expect(checkoutProblem({ ...ok, items: [{ name: "x", price: 2, qty: 1 }] })).toMatch(/minimum order is £5.00/);
  expect(checkoutProblem({ ...ok, name: " " })).toMatch(/name/);
  expect(checkoutProblem({ ...ok, phone: "123" })).toMatch(/phone/);
  expect(checkoutProblem({ ...ok, restaurant: { ordering: { orderTypes: ["Delivery"] } } })).toMatch(/only takes delivery/);
});

it("starts a Stripe checkout as the signed-in member and records a pending order", async () => {
  const fetchImpl = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "cs_1", url: "https://checkout.stripe.com/x" }) }));
  const id = await startCheckout({ restaurant, user, items, name: " Ann ", phone: "07700900123", fetchImpl });

  expect(id).toBe("cs_1");
  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe(`${FUNCTIONS_URL}/stripe-session`);
  expect(init.headers.Authorization).toBe("Bearer ID_TOKEN"); // links the order to them for points
  expect(JSON.parse(init.body)).toEqual({
    cartItems: [{ name: "Soft Taco", price: 2.15, quantity: 3, extras: [] }],
    total: 6.45,
    orderType: "Collection",
    restaurantId: "taco-monster",
  });
  const [path, order] = mockSetDoc.mock.calls[0];
  expect(path).toBe("orders/cs_1");
  expect(order).toMatchObject({ restaurantId: "taco-monster", payment_status: "pending", name: "Ann", contactNumber: "07700900123", total: 6.45 });
  expect(order).not.toHaveProperty("points"); // the app never awards points
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith("https://checkout.stripe.com/x");
});

it("shows the server's message when checkout can't start", async () => {
  const fetchImpl = () => Promise.resolve({ ok: false, json: () => Promise.resolve("This restaurant is not currently accepting orders") });
  await expect(startCheckout({ restaurant, user, items, name: "Ann", phone: "07700900123", fetchImpl })).rejects.toThrow("not currently accepting orders");
  expect(mockSetDoc).not.toHaveBeenCalled();
});

it("waits briefly for the webhook to confirm payment", async () => {
  const pending = { exists: () => true, data: () => ({ payment_status: "pending" }) };
  const paid = { exists: () => true, data: () => ({ payment_status: "paid", orderNumber: 1004 }) };
  const getDocImpl = jest.fn().mockResolvedValueOnce(pending).mockResolvedValueOnce(paid);
  expect(await waitForPayment("cs_1", { delayMs: 0, getDocImpl })).toMatchObject({ orderNumber: 1004 });

  const never = jest.fn().mockResolvedValue(pending);
  expect(await waitForPayment("cs_1", { tries: 3, delayMs: 0, getDocImpl: never })).toBeNull();
  expect(never).toHaveBeenCalledTimes(3);
});
