import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "styled-components/native";
import Order from "../screens/Order";
import { buildTheme } from "../theme/defaultTheme";

let mockEmit;
jest.mock("firebase/firestore", () => ({
  doc: (_db, ...path) => path.join("/"),
  onSnapshot: (_ref, next) => {
    mockEmit = next;
    return () => {};
  },
}));
jest.mock("../config/firebase", () => ({ db: {} }));
jest.mock("../context/RestaurantContext", () => ({
  useRestaurant: () => ({ restaurant: { name: "Taco Monster", contact: { phone: "020 7946 0000" }, ordering: { collectionAddress: "1 High St" } } }),
}));

const snap = (data) => ({ id: "cs_1", exists: () => !!data, data: () => data });
const order = { payment_status: "paid", orderType: "Collection", orderNumber: 1004, total: 13, orderItems: [{ name: "Burrito", price: 6.5, quantity: 2 }] };

it("follows the order live as the kitchen moves it on", async () => {
  await render(
    <ThemeProvider theme={buildTheme({})}>
      <Order orderId="cs_1" onBack={() => {}} />
    </ThemeProvider>
  );
  await act(() => mockEmit(snap({ payment_status: "pending", orderType: "Collection" })));
  expect(screen.getByTestId("order-status")).toHaveTextContent(/Confirming your payment/);

  await act(() => mockEmit(snap({ ...order, status: "placed", loyalty: { points: 13, status: "awarded" } })));
  expect(screen.getByText("Order #1004")).toBeTruthy();
  expect(screen.getByTestId("order-status")).toHaveTextContent(/Order received/);
  expect(screen.getByText("⭐ This order earns you 13 points")).toBeTruthy();
  expect(screen.getByText("1 High St")).toBeTruthy();

  await act(() => mockEmit(snap({ ...order, status: "ready" })));
  expect(screen.getByTestId("order-status")).toHaveTextContent(/Ready to collect/);
});
