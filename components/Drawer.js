import React from "react";
import { Modal, Pressable } from "react-native";
import styled from "styled-components/native";

// Burger-menu drawer: the two Phase 1 destinations + a Phase 2 placeholder + sign out.
export default function Drawer({ open, onClose, current, onNavigate, restaurant, points, onSignOut }) {
  const name = restaurant?.name || "Restaurant";
  const initial = name[0] || "R";

  const go = (screen) => { onNavigate(screen); onClose(); };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Scrim onPress={onClose}>
        <Panel onStartShouldSetResponder={() => true}>
          <Logo>{restaurant?.theme?.logoUrl ? <LogoImg source={{ uri: restaurant.theme.logoUrl }} /> : <LogoTxt>{initial}</LogoTxt>}</Logo>
          <Name>{name}</Name>
          <Pts>{points} points</Pts>

          <Nav>
            <Item active={current === "menu"} onPress={() => go("menu")}><ItemTxt active={current === "menu"}>Menu</ItemTxt></Item>
            <Item active={current === "account"} onPress={() => go("account")}><ItemTxt active={current === "account"}>My Account</ItemTxt></Item>
            <Item disabled><ItemTxt soon>Offers &amp; Deals</ItemTxt><Pill>Phase 2</Pill></Item>
          </Nav>

          <SignOut onPress={onSignOut}><SignOutTxt>Sign out</SignOutTxt></SignOut>
        </Panel>
      </Scrim>
    </Modal>
  );
}

const Scrim = styled.Pressable({ flex: 1, backgroundColor: "rgba(10,15,20,0.45)", flexDirection: "row" });
const Panel = styled.View(({ theme }) => ({
  width: "78%",
  maxWidth: 320,
  height: "100%",
  backgroundColor: theme.colors.brandDeep,
  paddingTop: 60,
  paddingHorizontal: 22,
  paddingBottom: 28,
}));
const Logo = styled.View(({ theme }) => ({ width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" }));
const LogoImg = styled.Image({ width: "100%", height: "100%" });
const LogoTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrandDeep, fontSize: 24, fontWeight: "800" }));
const Name = styled.Text(({ theme }) => ({ color: theme.colors.onBrandDeep, fontSize: 22, fontWeight: "800", marginTop: 12 }));
const Pts = styled.Text(({ theme }) => ({ color: theme.colors.onBrandDeep, opacity: 0.9, marginTop: 2 }));
const Nav = styled.View({ marginTop: 28 });
const Item = styled.TouchableOpacity(({ active, disabled }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 14,
  paddingHorizontal: 12,
  borderRadius: 12,
  backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
  opacity: disabled ? 0.6 : 1,
}));
const ItemTxt = styled.Text(({ theme, soon }) => ({ color: theme.colors.onBrandDeep, fontSize: 16, fontWeight: soon ? "600" : "700" }));
const Pill = styled.Text(({ theme }) => ({ color: theme.colors.onBrandDeep, marginLeft: "auto", fontSize: 10, backgroundColor: "rgba(255,255,255,0.25)", paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6, overflow: "hidden" }));
const SignOut = styled.TouchableOpacity({ marginTop: "auto", paddingVertical: 12, paddingHorizontal: 12 });
const SignOutTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrandDeep, opacity: 0.9, fontWeight: "700", fontSize: 15 }));
