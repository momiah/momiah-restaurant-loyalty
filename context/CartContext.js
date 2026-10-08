import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { name, price, qty }

  const add = (item) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => x.name === item.name);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      return [...prev, { name: item.name, price: Number(item.price) || 0, qty: 1 }];
    });

  const remove = (name) =>
    setItems((prev) =>
      prev
        .map((x) => (x.name === name ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );

  const clear = () => setItems([]);

  const { count, total } = useMemo(() => {
    const count = items.reduce((a, x) => a + x.qty, 0);
    const total = items.reduce((a, x) => a + x.price * x.qty, 0);
    return { count, total };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
