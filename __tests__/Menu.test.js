import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import Menu from "../screens/Menu";
import { CartProvider } from "../context/CartContext";
import { buildTheme } from "../theme/defaultTheme";

const restaurant = { id: "taco-monster", name: "Taco Monster", loyalty: { pointsPerPound: 1 }, ordering: { orderTypes: ["Collection"] } };
jest.mock("../context/RestaurantContext", () => ({
  useRestaurant: () => ({ restaurant, menu: [{ id: "tacos", category: "Tacos", items: [{ name: "Burrito", price: 6.5 }] }] }),
}));
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
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));

const renderMenu = () =>
  render(
    <ThemeProvider theme={buildTheme({})}>
      <CartProvider>
        <Menu onMenu={() => {}} />
      </CartProvider>
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  mockStart.mockResolvedValue("cs_1");
});

const addTwoBurritosAndOpenCheckout = async () => {
  await renderMenu();
  await fireEvent.press(screen.getByText("+"));
  await fireEvent.press(screen.getByText("+"));
  await fireEvent.press(screen.getByText("Checkout"));
};

it("pays through Stripe and shows the order number once the payment is confirmed", async () => {
  mockWait.mockResolvedValue({ payment_status: "paid", orderNumber: 1004 });
  await addTwoBurritosAndOpenCheckout();
  expect(screen.getByText("+13 pts")).toBeTruthy();

  await fireEvent.press(screen.getByText("Pay £13.00"));
  expect(mockStart).not.toHaveBeenCalled(); // phone number still missing
  expect(screen.getByText(/phone number/)).toBeTruthy();

  await fireEvent.changeText(screen.getByPlaceholderText("Phone number"), "07700 900123");
  await fireEvent.press(screen.getByText("Pay £13.00"));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Order #1004 placed 🎉", expect.any(String)));
  expect(mockStart.mock.calls[0][0]).toMatchObject({ name: "Ann", phone: "07700 900123", items: [{ name: "Burrito", price: 6.5, qty: 2 }] });
  expect(screen.queryByText("Checkout")).toBeNull(); // basket cleared
});

it("keeps the basket if the payment wasn't finished", async () => {
  mockWait.mockResolvedValue(null);
  await addTwoBurritosAndOpenCheckout();
  await fireEvent.changeText(screen.getByPlaceholderText("Phone number"), "07700900123");
  await fireEvent.press(screen.getByText("Pay £13.00"));
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Payment not finished", expect.any(String)));
  expect(screen.getByText("2 items · £13.00")).toBeTruthy();
});
