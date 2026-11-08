import React, { useEffect, useState } from "react";
import styled from "styled-components/native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import { gbp } from "../lib/format";
import { describeOrder, orderReference } from "../lib/orderStatus";

// The customer's app orders at this restaurant, newest first. Tap one to track it.
export default function Orders({ onMenu, onOpenOrder }) {
  const { user } = useAuth();
  const { restaurant } = useRestaurant();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user || !restaurant) return undefined;
    // Equality filters only (no composite index needed); sorted here.
    const q = query(collection(db, "orders"), where("customerUid", "==", user.uid), where("restaurantId", "==", restaurant.id));
    return onSnapshot(
      q,
      (snap) => {
        const time = (o) => (o.createdAtTs?.toMillis ? o.createdAtTs.toMillis() : 0);
        setOrders(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((o) => o.payment_status === "paid")
            .sort((a, b) => time(b) - time(a))
        );
      },
      () => setOrders([])
    );
  }, [user, restaurant]);

  return (
    <Wrap>
      <Header title="My orders" onMenu={onMenu} />
      <Body contentContainerStyle={{ padding: 16 }}>
        {orders && orders.length === 0 ? <Empty>No orders yet. Orders you place in the app show up here.</Empty> : null}
        {(orders || []).map((o) => (
          <Row key={o.id} onPress={() => onOpenOrder(o.id)} accessibilityRole="button">
            <Main>
              <Ref>Order {orderReference(o, o.id)}</Ref>
              <Status>{describeOrder(o).title}</Status>
            </Main>
            <Total>{gbp(o.total || 0)}</Total>
          </Row>
        ))}
      </Body>
    </Wrap>
  );
}

const Wrap = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.bg }));
const Body = styled.ScrollView({ flex: 1 });
const Empty = styled.Text(({ theme }) => ({ color: theme.colors.faint, textAlign: "center", marginTop: 30 }));
const Row = styled.TouchableOpacity(({ theme }) => ({ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line }));
const Main = styled.View({ flex: 1 });
const Ref = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.text, fontSize: 15 }));
const Status = styled.Text(({ theme }) => ({ color: theme.colors.muted, fontSize: 13, marginTop: 2 }));
const Total = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.text }));
