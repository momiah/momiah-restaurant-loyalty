import React, { useState } from "react";
import { ActivityIndicator, View, Text, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "styled-components/native";
import { RestaurantProvider, useRestaurant } from "./context/RestaurantContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { buildTheme } from "./theme/defaultTheme";
import Login from "./screens/Login";
import Menu from "./screens/Menu";
import Account from "./screens/Account";
import Drawer from "./components/Drawer";

function Root() {
  const { restaurant, loading: rLoading, error } = useRestaurant();
  const { user, profile, loading: aLoading, signOutUser } = useAuth();
  const theme = buildTheme(restaurant?.theme);

  const [screen, setScreen] = useState("menu");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
            {screen === "menu" ? (
              <Menu onMenu={() => setDrawerOpen(true)} />
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
