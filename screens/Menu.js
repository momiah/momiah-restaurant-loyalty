import React, { useMemo, useState } from "react";
import { ScrollView, Alert } from "react-native";
import styled from "styled-components/native";
import Header from "../components/Header";
import PointsCard from "../components/PointsCard";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { gbp } from "../lib/format";
import { nextReward, pointsForAmount, awardPoints } from "../lib/points";

export default function Menu({ onMenu }) {
  const { restaurant, menu } = useRestaurant();
  const { user, profile, refreshProfile } = useAuth();
  const { items: cart, add, total, count, clear } = useCart();
  const [cat, setCat] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);

  const points = profile?.points || 0;
  const next = useMemo(() => nextReward(points), [points]);
  const active = menu[cat] || menu[0];

  // Phase 1 checkout placeholder: awards loyalty points for the order. Real payment
  // reuses the website's Stripe Cloud Function; points should be awarded on the
  // verified payment webhook in production, not from the client.
  const checkout = async () => {
    if (count === 0) return;
    setCheckingOut(true);
    try {
      const earned = user && restaurant ? await awardPoints(restaurant.id, user.uid, total) : pointsForAmount(total);
      await refreshProfile();
      clear();
      Alert.alert("Order placed 🎉", `You earned ${earned} points on this order.`);
    } catch (e) {
      Alert.alert("Something went wrong", e.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <Wrap>
      <Header title={restaurant?.name || "Menu"} subtitle="Loyalty" onMenu={onMenu} />
      <Body contentContainerStyle={{ padding: 16, paddingBottom: count > 0 ? 90 : 24 }}>
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
              <ItPrice>{gbp(it.price)} <ItPts>· +{pointsForAmount(it.price)} pts</ItPts></ItPrice>
            </ItMain>
            <Add onPress={() => add(it)}><AddTxt>+</AddTxt></Add>
          </Item>
        ))}
        {menu.length === 0 && <Empty>No menu items yet.</Empty>}
      </Body>

      {count > 0 && (
        <OrderBar onPress={checkout} disabled={checkingOut}>
          <OrderTxt>{checkingOut ? "Placing…" : "Place order"}</OrderTxt>
          <OrderBadge>{count} items · {gbp(total)}</OrderBadge>
        </OrderBar>
      )}
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
