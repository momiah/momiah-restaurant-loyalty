import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import styled from "styled-components/native";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const { restaurant } = useRestaurant();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (e) {
      setErr(mode === "signup" ? "Couldn't create your account. Try a different email." : "Incorrect email or password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Brand>
        <Logo>{restaurant?.theme?.logoUrl ? <LogoImg source={{ uri: restaurant.theme.logoUrl }} /> : <LogoTxt>{(restaurant?.name || "R")[0]}</LogoTxt>}</Logo>
        <BrandName>{restaurant?.name || "Loyalty"}</BrandName>
        <Tagline>{mode === "signup" ? "Join the rewards club" : "Welcome back"}</Tagline>
      </Brand>

      <Card>
        {mode === "signup" && (
          <Field><Label>Name</Label><Input value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" /></Field>
        )}
        <Field><Label>Email</Label><Input value={email} onChangeText={setEmail} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" /></Field>
        <Field><Label>Password</Label><Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry /></Field>

        {err ? <ErrTxt>{err}</ErrTxt> : null}

        <Primary onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <PrimaryTxt>{mode === "signup" ? "Create account" : "Sign in"}</PrimaryTxt>}
        </Primary>

        <Toggle onPress={() => { setErr(null); setMode(mode === "signup" ? "signin" : "signup"); }}>
          <ToggleTxt>{mode === "signup" ? "Already a member? Sign in" : "New here? Create an account"}</ToggleTxt>
        </Toggle>
      </Card>
    </Screen>
  );
}

const Screen = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.brandDeep, alignItems: "center", justifyContent: "center", padding: 22 }));
const Brand = styled.View({ alignItems: "center", marginBottom: 22 });
const Logo = styled.View({ width: 66, height: 66, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" });
const LogoImg = styled.Image({ width: "100%", height: "100%" });
const LogoTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontSize: 28, fontWeight: "800" }));
const BrandName = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontSize: 24, fontWeight: "800", marginTop: 12 }));
const Tagline = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, opacity: 0.85, marginTop: 2 }));
const Card = styled.View(({ theme }) => ({ width: "100%", maxWidth: 400, backgroundColor: theme.colors.surface, borderRadius: 18, padding: 20 }));
const Field = styled.View({ marginBottom: 12 });
const Label = styled.Text(({ theme }) => ({ fontSize: 13, fontWeight: "600", color: theme.colors.muted, marginBottom: 5 }));
const Input = styled.TextInput(({ theme }) => ({ borderWidth: 1, borderColor: theme.colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: theme.colors.text }));
const ErrTxt = styled.Text({ color: "#C0392B", marginBottom: 10 });
const Primary = styled.TouchableOpacity(({ theme }) => ({ backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 }));
const PrimaryTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontWeight: "800", fontSize: 16 }));
const Toggle = styled.TouchableOpacity({ alignItems: "center", marginTop: 14 });
const ToggleTxt = styled.Text(({ theme }) => ({ color: theme.colors.primary, fontWeight: "700" }));
