import React, { useMemo, useState } from "react";
import { Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import styled from "styled-components/native";
import Header from "../components/Header";
import PointsCard from "../components/PointsCard";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { gbp } from "../lib/format";
import { nextReward, pointsForAmount } from "../lib/points";
import { checkoutProblem, startCheckout, waitForPayment } from "../lib/checkout";
import VerifyEmailBanner from "../components/VerifyEmailBanner";

export default function Menu({ onMenu }) {
  const { restaurant, menu } = useRestaurant();
  const { user, profile } = useAuth();
  const { items: cart, add, remove, total, count, clear } = useCart();
  const [cat, setCat] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const points = profile?.points || 0;
  const next = useMemo(() => nextReward(points), [points]);
  const active = menu[cat] || menu[0];

  const openCheckout = () => {
    setName((n) => n || profile?.name || user?.displayName || "");
    setSheetOpen(true);
  };
  const problem = checkoutProblem({ restaurant, items: cart, name, phone });

  // Pays through Stripe in the browser. Points are added by the server once the
  // payment is confirmed; the balance above updates by itself.
  const pay = async () => {
    if (problem || paying) return;
    setPaying(true);
    try {
      const orderId = await startCheckout({ restaurant, user, items: cart, name, phone });
      const paid = await waitForPayment(orderId);
      if (paid) {
        clear();
        setSheetOpen(false);
        Alert.alert(
          paid.orderNumber ? `Order #${paid.orderNumber} placed 🎉` : "Order placed 🎉",
          "We'll have it ready for you. Your points are added to your balance automatically."
        );
      } else {
        Alert.alert(
          "Payment not finished",
          "Your basket is still here. If you did pay, your order will show up in a moment — no need to pay again."
        );
      }
    } catch (e) {
      Alert.alert("Couldn't start the payment", e.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <Wrap>
      <Header title={restaurant?.name || "Menu"} subtitle="Loyalty" onMenu={onMenu} />
      <Body contentContainerStyle={{ padding: 16, paddingBottom: count > 0 ? 90 : 24 }}>
        <VerifyEmailBanner />
        <PointsCard points={points} next={next} />

        <SecTitle>Menu</SecTitle>
        <Chips horizontal showsHorizontalScrollIndicator={false}>
          {menu.map((c, i) => (
            <Chip key={c.id || i} on={i === cat} onPress={() => setCat(i)}>
              <ChipTxt on={i === cat}>{c.category}</ChipTxt>
            </Chip>
          ))}
        </Chips>

        {(active?.items || []).map((it, i) => (
          <Item key={i}>
            <Thumb>{it.imageUrl ? <ThumbImg source={{ uri: it.imageUrl }} /> : <ThumbTxt>🍽️</ThumbTxt>}</Thumb>
            <ItMain>
              <ItName numberOfLines={1}>{it.name}</ItName>
              {it.description ? <ItDesc numberOfLines={1}>{it.description}</ItDesc> : null}
              <ItPrice>{gbp(it.price)} <ItPts>· +{pointsForAmount(it.price, restaurant)} pts</ItPts></ItPrice>
            </ItMain>
            <Add onPress={() => add(it)}><AddTxt>+</AddTxt></Add>
          </Item>
        ))}
        {menu.length === 0 && <Empty>No menu items yet.</Empty>}
      </Body>

      {count > 0 && (
        <OrderBar onPress={openCheckout}>
          <OrderTxt>Checkout</OrderTxt>
          <OrderBadge>{count} items · {gbp(total)}</OrderBadge>
        </OrderBar>
      )}

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Scrim behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Sheet>
            <SheetTitle>Your order · collection</SheetTitle>
            {cart.map((x) => (
              <Line key={x.name}>
                <LineName numberOfLines={1}>{x.qty} × {x.name}</LineName>
                <LinePrice>{gbp(x.price * x.qty)}</LinePrice>
                <LineBtn onPress={() => remove(x.name)} accessibilityLabel={`Remove one ${x.name}`}><LineBtnTxt>−</LineBtnTxt></LineBtn>
              </Line>
            ))}
            <TotalRow>
              <TotalTxt>Total {gbp(total)}</TotalTxt>
              <ItPts>+{pointsForAmount(total, restaurant)} pts</ItPts>
            </TotalRow>
            <Field value={name} onChangeText={setName} placeholder="Name for the order" autoComplete="name" />
            <Field value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" autoComplete="tel" />
            {problem && count > 0 ? <Problem>{problem}</Problem> : null}
            <SheetRow>
              <Ghost onPress={() => setSheetOpen(false)}><GhostTxt>Back</GhostTxt></Ghost>
              <PayBtn onPress={pay} disabled={!!problem || paying} off={!!problem || paying}>
                <PayTxt>{paying ? "Opening payment…" : `Pay ${gbp(total)}`}</PayTxt>
              </PayBtn>
            </SheetRow>
            <Fine>You'll pay securely with Stripe, then see your order's progress.</Fine>
          </Sheet>
        </Scrim>
      </Modal>
    </Wrap>
  );
}

const Wrap = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.bg }));
const Body = styled.ScrollView({ flex: 1 });
const SecTitle = styled.Text(({ theme }) => ({ fontSize: 16, fontWeight: "800", color: theme.colors.text, marginTop: 18, marginBottom: 10 }));
const Chips = styled.ScrollView({ flexGrow: 0, marginBottom: 6 });
const Chip = styled.TouchableOpacity(({ theme, on }) => ({ backgroundColor: on ? theme.colors.primary : theme.colors.surface, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, borderWidth: 1, borderColor: on ? theme.colors.primary : theme.colors.line }));
const ChipTxt = styled.Text(({ theme, on }) => ({ color: on ? theme.colors.onBrand : theme.colors.muted, fontWeight: "700", fontSize: 13 }));
const Item = styled.View(({ theme }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.line }));
const Thumb = styled.View(({ theme }) => ({ width: 60, height: 60, borderRadius: 14, backgroundColor: theme.colors.brandSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }));
const ThumbImg = styled.Image({ width: "100%", height: "100%" });
const ThumbTxt = styled.Text({ fontSize: 24 });
const ItMain = styled.View({ flex: 1 });
const ItName = styled.Text(({ theme }) => ({ fontWeight: "700", fontSize: 15, color: theme.colors.text }));
const ItDesc = styled.Text(({ theme }) => ({ fontSize: 12, color: theme.colors.faint }));
const ItPrice = styled.Text(({ theme }) => ({ fontWeight: "800", fontSize: 14, color: theme.colors.text, marginTop: 3 }));
const ItPts = styled.Text(({ theme }) => ({ color: theme.colors.accent, fontWeight: "700", fontSize: 12 }));
const Add = styled.TouchableOpacity(({ theme }) => ({ width: 34, height: 34, borderRadius: 11, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }));
const AddTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontSize: 20, fontWeight: "700", lineHeight: 24 }));
const Empty = styled.Text(({ theme }) => ({ color: theme.colors.faint, textAlign: "center", marginTop: 30 }));
const OrderBar = styled.TouchableOpacity(({ theme }) => ({ position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }));
const OrderTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontWeight: "800", fontSize: 16 }));
const OrderBadge = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9, overflow: "hidden" }));
const Scrim = styled(KeyboardAvoidingView)({ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" });
const Sheet = styled.View(({ theme }) => ({ backgroundColor: theme.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 }));
const SheetTitle = styled.Text(({ theme }) => ({ fontSize: 18, fontWeight: "800", color: theme.colors.text, marginBottom: 10 }));
const Line = styled.View({ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 });
const LineName = styled.Text(({ theme }) => ({ flex: 1, color: theme.colors.text, fontSize: 14 }));
const LinePrice = styled.Text(({ theme }) => ({ color: theme.colors.text, fontWeight: "700" }));
const LineBtn = styled.TouchableOpacity(({ theme }) => ({ width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: theme.colors.line, alignItems: "center", justifyContent: "center" }));
const LineBtnTxt = styled.Text(({ theme }) => ({ color: theme.colors.text, fontSize: 18, lineHeight: 20 }));
const TotalRow = styled.View(({ theme }) => ({ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 10, marginTop: 6, marginBottom: 10 }));
const TotalTxt = styled.Text(({ theme }) => ({ fontWeight: "800", fontSize: 16, color: theme.colors.text }));
const Field = styled.TextInput(({ theme }) => ({ borderWidth: 1, borderColor: theme.colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: theme.colors.text, marginTop: 8 }));
const Problem = styled.Text({ color: "#C0392B", fontWeight: "700", marginTop: 10 });
const SheetRow = styled.View({ flexDirection: "row", gap: 10, marginTop: 14 });
const Ghost = styled.TouchableOpacity(({ theme }) => ({ flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: theme.colors.bg }));
const GhostTxt = styled.Text(({ theme }) => ({ fontWeight: "700", color: theme.colors.text }));
const PayBtn = styled.TouchableOpacity(({ theme, off }) => ({ flex: 2, paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: theme.colors.primary, opacity: off ? 0.5 : 1 }));
const PayTxt = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.onBrand, fontSize: 16 }));
const Fine = styled.Text(({ theme }) => ({ color: theme.colors.faint, fontSize: 12, textAlign: "center", marginTop: 10 }));
