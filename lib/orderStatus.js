// The order lifecycle the customer sees. Same wording as the website (restaurant-site
// src/orders/orderStatus.js) and the kitchen tablet; see restaurant-site
// docs/ORDER_STATUS.md.
//
//   placed -> preparing -> ready -> completed
//
// "ready" means "Ready to collect" for collection and "Out for delivery" for delivery.

export const ORDER_STEPS = ["placed", "preparing", "ready", "completed"];

const LABELS = {
  Collection: {
    placed: "Order received",
    preparing: "Being prepared",
    ready: "Ready to collect",
    completed: "Collected",
  },
  Delivery: {
    placed: "Order received",
    preparing: "Being prepared",
    ready: "Out for delivery",
    completed: "Delivered",
  },
};

const DETAILS = {
  Collection: {
    placed: "The restaurant has your order and will start on it shortly.",
    preparing: "The kitchen is making your order now.",
    ready: "Your order is ready — head over to collect it.",
    completed: "Enjoy your meal!",
  },
  Delivery: {
    placed: "The restaurant has your order and will start on it shortly.",
    preparing: "The kitchen is making your order now.",
    ready: "Your order is on its way to you.",
    completed: "Your order has been delivered. Enjoy your meal!",
  },
};

export const isDelivery = (order) => order?.orderType === "Delivery";

// The kitchen status of an order, or null while payment hasn't been confirmed.
// Orders paid before the workflow existed were marked "active"; treat them as placed.
export function orderStep(order) {
  if (!order || order.payment_status !== "paid") return null;
  return ORDER_STEPS.includes(order.status) ? order.status : "placed";
}

export function stepLabels(order) {
  const words = LABELS[isDelivery(order) ? "Delivery" : "Collection"];
  return ORDER_STEPS.map((step) => ({ step, label: words[step] }));
}

// Headline + one-line explanation for where the order is right now.
export function describeOrder(order) {
  const step = orderStep(order);
  if (!step) {
    return {
      step: null,
      index: -1,
      title: "Confirming your payment…",
      detail: "This usually takes a few seconds. Please keep this page open.",
    };
  }
  const type = isDelivery(order) ? "Delivery" : "Collection";
  return {
    step,
    index: ORDER_STEPS.indexOf(step),
    title: LABELS[type][step],
    detail: DETAILS[type][step],
  };
}

// What the customer quotes to the restaurant: the sequential number once paid,
// otherwise a short reference from the checkout id.
export function orderReference(order, orderId) {
  if (order?.orderNumber) return `#${order.orderNumber}`;
  const id = order?.id || orderId;
  return id ? id.slice(-6).toUpperCase() : "—";
}
