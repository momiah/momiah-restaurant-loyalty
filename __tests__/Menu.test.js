import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import Menu from "../screens/Menu";
import { CartProvider } from "../context/CartContext";
import { buildTheme } from "../theme/defaultTheme";

const restaurant = { id: "taco-monster", name: "Taco Monster", loyalty: { pointsPerPound: 1 }, ordering: { orderTypes: ["Collection"] } };
const menu = [
  {
    id: "tacos",
    category: "Tacos",
    items: [
      { name: "Burrito", price: 6.5 },
      { name: "Soft Taco", price: 2.15, protein: [{ type: "Beef" }, { type: "Chicken" }], extras: [{ type: "Guac", price: 1 }] },
    ],
  },
];
jest.mock("../context/RestaurantContext", () => ({ useRestaurant: () => ({ restaurant, menu }) }));
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "u1", email: "ann@example.com", displayName: "Ann" }, profile: { name: "Ann", points: 40 }, emailVerified: true }),
}));
const mockStart = jest.fn();
const mockWait = jest.fn();
jest.mock("../lib/checkout", () => ({
  ...jest.requireActual("../lib/checkout"),
  startCheckout: (...a) => mockStart(...a),
  waitForPayment: (...a) => mockWait(...a),
}));
jest.mock("../config/firebase", () => ({ db: {} }));
jest.mock("expo-web-browser", () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock("expo-linking", () => ({ createURL: () => "menudock-loyalty://checkout", parse: () => ({}) }));

const onOpenOrder = jest.fn();
const renderMenu = () =>
  render(
    <ThemeProvider theme={buildTheme({})}>
      <CartProvider>
        <Menu onMenu={() => {}} onOpenOrder={onOpenOrder} />
      </CartProvider>
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

const checkoutWithPhone = async () => {
  await fireEvent.press(screen.getByText("Checkout"));
  await fireEvent.changeText(screen.getByPlaceholderText("Phone number"), "07700 900123");
};

it("pays, then opens the order's live tracking in the app", async () => {
  mockStart.mockResolvedValue({ orderId: "cs_1", result: "success" });
  await renderMenu();
  await fireEvent.press(screen.getByLabelText("Add Burrito"));
  await fireEvent.press(screen.getByLabelText("Add Burrito"));
  await checkoutWithPhone();
  expect(screen.getByText("+13 pts")).toBeTruthy();

  await fireEvent.press(screen.getByText("Pay £13.00"));
  await waitFor(() => expect(onOpenOrder).toHaveBeenCalledWith("cs_1"));
  expect(mockStart.mock.calls[0][0]).toMatchObject({ name: "Ann", phone: "07700 900123" });
  expect(screen.queryByText("Checkout")).toBeNull(); // basket cleared
});

it("asks for a protein before adding, and keeps options with the line", async () => {
  mockStart.mockResolvedValue({ orderId: "cs_2", result: "success" });
  await renderMenu();
  await fireEvent.press(screen.getByLabelText("Add Soft Taco"));
  expect(screen.getAllByText("Choose your protein").length).toBeGreaterThan(0); // heading + disabled Add button
  await fireEvent.press(screen.getByText("Chicken"));
  await fireEvent.press(screen.getByText("Guac"));
  await fireEvent.press(screen.getByText("Add · £3.15"));

  await fireEvent.press(screen.getByText("Checkout"));
  expect(screen.getByText("Chicken, + Guac")).toBeTruthy();
  await fireEvent.changeText(screen.getByPlaceholderText("Phone number"), "07700900123");
  await fireEvent.press(screen.getByText("Pay £3.15"));
  await waitFor(() => expect(mockStart).toHaveBeenCalled());
  expect(mockStart.mock.calls[0][0].items[0]).toMatchObject({ name: "Soft Taco", protein: "Chicken", extras: ["Guac"], qty: 1 });
});

it("keeps the basket when the payment is cancelled", async () => {
  mockStart.mockResolvedValue({ orderId: "cs_1", result: "cancel" });
  await renderMenu();
  await fireEvent.press(screen.getByLabelText("Add Burrito"));
  await checkoutWithPhone();
  await fireEvent.press(screen.getByText("Pay £6.50"));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Payment cancelled", expect.any(String)));
  expect(onOpenOrder).not.toHaveBeenCalled();
  expect(screen.getByText("1 items · £6.50")).toBeTruthy();
});

it("if the browser was closed, checks whether the payment went through", async () => {
  mockStart.mockResolvedValue({ orderId: "cs_3", result: "dismissed" });
  mockWait.mockResolvedValue({ payment_status: "paid" });
  await renderMenu();
  await fireEvent.press(screen.getByLabelText("Add Burrito"));
  await checkoutWithPhone();
  await fireEvent.press(screen.getByText("Pay £6.50"));
  await waitFor(() => expect(onOpenOrder).toHaveBeenCalledWith("cs_3"));
});
