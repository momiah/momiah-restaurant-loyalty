import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, View, Text, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "styled-components/native";
import { RestaurantProvider, useRestaurant } from "./context/RestaurantContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { buildTheme } from "./theme/defaultTheme";
import Login from "./screens/Login";
import Menu from "./screens/Menu";
import Account from "./screens/Account";
import Orders from "./screens/Orders";
import Order from "./screens/Order";
import Drawer from "./components/Drawer";

function Root() {
  const { restaurant, loading: rLoading, error } = useRestaurant();
  const { user, profile, loading: aLoading, signOutUser } = useAuth();
  const theme = buildTheme(restaurant?.theme);

  const [screen, setScreen] = useState("menu");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // An order being tracked, and the screen to go back to from it.
  const [tracking, setTracking] = useState(null); // { orderId, from }

  const openOrder = (orderId) => setTracking({ orderId, from: screen });
  const closeOrder = () => {
    if (tracking) setScreen(tracking.from);
    setTracking(null);
  };

  // Android back button leaves the order screen instead of the app.
  useEffect(() => {
    if (!tracking) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeOrder();
      return true;
    });
    return () => sub.remove();
  });

  const center = (child) => (
    <ThemeProvider theme={theme}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg, padding: 24 }}>
        {child}
      </View>
    </ThemeProvider>
  );

  if (rLoading || aLoading) return center(<ActivityIndicator size="large" color={theme.colors.primary} />);
  if (error) return center(<Text style={{ color: theme.colors.text, textAlign: "center" }}>{error}</Text>);

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar style="auto" />
        {!user ? (
          <Login />
        ) : (
          <>
            {tracking ? (
              <Order orderId={tracking.orderId} onBack={closeOrder} />
            ) : screen === "menu" ? (
              <Menu onMenu={() => setDrawerOpen(true)} onOpenOrder={openOrder} />
            ) : screen === "orders" ? (
              <Orders onMenu={() => setDrawerOpen(true)} onOpenOrder={openOrder} />
            ) : (
              <Account onMenu={() => setDrawerOpen(true)} />
            )}
            <Drawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              current={screen}
              onNavigate={setScreen}
              restaurant={restaurant}
              points={profile?.points || 0}
              onSignOut={signOutUser}
            />
          </>
        )}
      </SafeAreaView>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <AuthProvider>
        <CartProvider>
          <Root />
        </CartProvider>
      </AuthProvider>
    </RestaurantProvider>
  );
}
