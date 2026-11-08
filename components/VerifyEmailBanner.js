import React, { useState } from "react";
import { Alert } from "react-native";
import styled from "styled-components/native";
import { useAuth } from "../context/AuthContext";

// Points from website orders are matched by email, so the email must be verified
// before they can be collected. Shown until it is.
export default function VerifyEmailBanner() {
  const { user, emailVerified, checkVerified, resendVerification } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user || emailVerified) return null;

  const check = async () => {
    setBusy(true);
    try {
      const ok = await checkVerified();
      if (!ok) Alert.alert("Not verified yet", `Tap the link we emailed to ${user.email}, then try again.`);
    } catch (e) {
      Alert.alert("Something went wrong", e.message);
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    try {
      await resendVerification();
      Alert.alert("Email sent", `Check ${user.email} for the verification link.`);
    } catch (e) {
      Alert.alert("Couldn't send the email", e.message);
    }
  };

  return (
    <Box>
      <Title>Verify your email to collect points</Title>
      <Body>We sent a link to {user.email}. Points from your orders are added once it's verified.</Body>
      <Row>
        <Btn onPress={check} disabled={busy}><BtnTxt>{busy ? "Checking…" : "I've verified"}</BtnTxt></Btn>
        <Link onPress={resend}><LinkTxt>Resend email</LinkTxt></Link>
      </Row>
    </Box>
  );
}

const Box = styled.View({ backgroundColor: "#FFF7E0", borderRadius: 14, borderWidth: 1, borderColor: "#F0C04A", padding: 14, marginBottom: 14 });
const Title = styled.Text({ fontWeight: "800", color: "#5C4300", fontSize: 14 });
const Body = styled.Text({ color: "#5C4300", fontSize: 13, marginTop: 4 });
const Row = styled.View({ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 });
const Btn = styled.TouchableOpacity(({ theme }) => ({ backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 }));
const BtnTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontWeight: "800" }));
const Link = styled.TouchableOpacity({ paddingVertical: 9 });
const LinkTxt = styled.Text({ color: "#5C4300", fontWeight: "700", textDecorationLine: "underline" });
