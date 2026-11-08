import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

// One basket line per item + chosen options. Prices here are for display; the
// checkout function prices the order from the menu.
export function lineKey(name, options = {}) {
  return JSON.stringify([name, [...(options.extras || [])].sort(), options.protein || null, options.secondProtein || null, options.thirdProtein || null]);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { key, name, price, qty, extras, protein, secondProtein, thirdProtein }

  // `item` is the menu item; `options` the customer's choices for it.
  const add = (item, options = {}) =>
    setItems((prev) => {
      const key = lineKey(item.name, options);
      const i = prev.findIndex((x) => x.key === key);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      const extras = options.extras || [];
      const extrasPrice = (item.extras || [])
        .filter((e) => extras.includes(e.type))
        .reduce((a, e) => a + (Number(e.price) || 0), 0);
      return [
        ...prev,
        {
          key,
          name: item.name,
          price: (Number(item.price) || 0) + extrasPrice,
          qty: 1,
          extras,
          protein: options.protein || null,
          secondProtein: options.secondProtein || null,
          thirdProtein: options.thirdProtein || null,
        },
      ];
    });

  const remove = (key) =>
    setItems((prev) => prev.map((x) => (x.key === key ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0));

  const clear = () => setItems([]);

  const { count, total } = useMemo(() => {
    const count = items.reduce((a, x) => a + x.qty, 0);
    const total = items.reduce((a, x) => a + x.price * x.qty, 0);
    return { count, total };
  }, [items]);

  return <CartContext.Provider value={{ items, add, remove, clear, count, total }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

// Items that need the customer to choose something before adding.
export const needsOptions = (item) =>
  ["protein", "secondProtein", "thirdProtein", "extras"].some((k) => Array.isArray(item[k]) && item[k].length > 0);
