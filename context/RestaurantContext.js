// Resolves which restaurant this app build is branded for (EXPO_PUBLIC_RESTAURANT_SLUG)
// and loads its record + menu from the shared platform project. Each client gets their
// own app build with their slug, so the app theme/menu is theirs.
import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

const RestaurantContext = createContext(null);

const SLUG = process.env.EXPO_PUBLIC_RESTAURANT_SLUG || "taco-monster";

export function RestaurantProvider({ children }) {
  const [state, setState] = useState({ restaurant: null, menu: [], loading: true, error: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rSnap = await getDocs(query(collection(db, "restaurants"), where("slug", "==", SLUG), limit(1)));
        if (rSnap.empty) throw new Error(`No restaurant found for slug "${SLUG}".`);
        const doc = rSnap.docs[0];
        const restaurant = { id: doc.id, ...doc.data() };

        let menu = [];
        try {
          const mSnap = await getDocs(query(collection(db, "restaurants", doc.id, "menu"), orderBy("order")));
          menu = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          const mSnap = await getDocs(collection(db, "restaurants", doc.id, "menu"));
          menu = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        if (alive) setState({ restaurant, menu, loading: false, error: null });
      } catch (e) {
        if (alive) setState({ restaurant: null, menu: [], loading: false, error: e.message });
      }
    })();
    return () => { alive = false; };
  }, []);

  return <RestaurantContext.Provider value={state}>{children}</RestaurantContext.Provider>;
}

export const useRestaurant = () => useContext(RestaurantContext);
