import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking } from "react-native";
import styled from "styled-components/native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import Header from "../components/Header";
import { useRestaurant } from "../context/RestaurantContext";
import { gbp } from "../lib/format";
import { describeOrder, orderReference, stepLabels } from "../lib/orderStatus";

// Live progress of one order, updated as the kitchen taps through it on the tablet.
export default function Order({ orderId, onBack }) {
  const { restaurant } = useRestaurant();
  const [order, setOrder] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    if (!orderId) return undefined;
    return onSnapshot(
      doc(db, "orders", orderId),
      (snap) => setOrder(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setOrder(null)
    );
  }, [orderId]);

  const phone = restaurant?.contact?.phone;
  const address = restaurant?.ordering?.collectionAddress || restaurant?.address?.formatted;

  if (order === undefined) {
    return (
      <Wrap>
        <Header title="Your order" onBack={onBack} />
        <Center><ActivityIndicator /></Center>
      </Wrap>
    );
  }
  if (order === null) {
    return (
      <Wrap>
        <Header title="Your order" onBack={onBack} />
        <Center><Muted>We couldn't find that order.</Muted></Center>
      </Wrap>
    );
  }

  const { index, title, detail } = describeOrder(order);
  const steps = stepLabels(order);

  return (
    <Wrap>
      <Header title={`Order ${orderReference(order, orderId)}`} onBack={onBack} />
      <Body contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Card>
          <Title testID="order-status">{title}</Title>
          <Muted>{detail}</Muted>
          <Steps>
            {steps.map(({ step, label }, i) => (
              <Step key={step}>
                <Dot done={i <= index}><DotTxt done={i <= index}>{i < index || index === steps.length - 1 ? "✓" : i + 1}</DotTxt></Dot>
                <StepLabel done={i <= index} current={i === index}>{label}</StepLabel>
              </Step>
            ))}
          </Steps>
        </Card>

        {order.loyalty?.points ? <Points>⭐ This order earns you {order.loyalty.points} points</Points> : null}

        {address && order.orderType !== "Delivery" ? (
          <Card>
            <Label>Collect from</Label>
            <Value>{address}</Value>
          </Card>
        ) : null}

        <Card>
          <Label>Your order</Label>
          {(order.orderItems || []).map((line, i) => (
            <Line key={i}>
              <LineName>{line.quantity} × {line.name}</LineName>
              <Value>{gbp(line.price * line.quantity)}</Value>
            </Line>
          ))}
          <Line>
            <Label>Total</Label>
            <Value>{gbp(order.total || 0)}</Value>
          </Line>
        </Card>

        {phone ? (
          <CallBtn onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)}>
            <CallTxt>Call {restaurant?.name || "the restaurant"} · {phone}</CallTxt>
          </CallBtn>
        ) : null}
      </Body>
    </Wrap>
  );
}

const Wrap = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.bg }));
const Body = styled.ScrollView({ flex: 1 });
const Center = styled.View({ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 });
const Card = styled.View(({ theme }) => ({ backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, padding: 16, marginBottom: 12 }));
const Title = styled.Text(({ theme }) => ({ fontSize: 22, fontWeight: "800", color: theme.colors.text }));
const Muted = styled.Text(({ theme }) => ({ color: theme.colors.muted, marginTop: 4 }));
const Steps = styled.View({ flexDirection: "row", justifyContent: "space-between", marginTop: 16 });
const Step = styled.View({ flex: 1, alignItems: "center", gap: 6 });
const Dot = styled.View(({ theme, done }) => ({ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: done ? theme.colors.primary : theme.colors.line }));
const DotTxt = styled.Text(({ theme, done }) => ({ color: done ? theme.colors.onBrand : theme.colors.muted, fontWeight: "800", fontSize: 12 }));
const StepLabel = styled.Text(({ theme, done, current }) => ({ fontSize: 11, textAlign: "center", color: done ? theme.colors.text : theme.colors.faint, fontWeight: current ? "800" : "500" }));
const Points = styled.Text(({ theme }) => ({ backgroundColor: theme.colors.brandSoft, color: theme.colors.brandDeep, fontWeight: "700", borderRadius: 12, padding: 12, marginBottom: 12, overflow: "hidden", textAlign: "center" }));
const Label = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.text, marginBottom: 6 }));
const Value = styled.Text(({ theme }) => ({ color: theme.colors.text }));
const Line = styled.View({ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 });
const LineName = styled.Text(({ theme }) => ({ color: theme.colors.text, flex: 1, marginRight: 10 }));
const CallBtn = styled.TouchableOpacity(({ theme }) => ({ borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 14, paddingVertical: 13, alignItems: "center" }));
const CallTxt = styled.Text(({ theme }) => ({ color: theme.colors.primary, fontWeight: "800" }));
