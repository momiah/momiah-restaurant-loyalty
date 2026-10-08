import React from "react";
import styled from "styled-components/native";
import { num } from "../lib/format";

// Themed loyalty points card. Colour comes entirely from the restaurant theme.
export default function PointsCard({ points = 0, next }) {
  const pct = next ? Math.min(100, Math.round((points / next.points) * 100)) : 100;
  return (
    <Card>
      <Glow />
      <Label>Your points</Label>
      <Value>
        {num(points)} <Unit>pts</Unit>
      </Value>
      <Bar>
        <Fill style={{ width: `${pct}%` }} />
      </Bar>
      <Next>
        {next ? `${num(next.points - points)} pts to ${next.label} 🎉` : "Top reward reached 🎉"}
      </Next>
    </Card>
  );
}

const Card = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.brandDeep,
  borderRadius: theme.radii.lg,
  padding: 18,
  overflow: "hidden",
}));
const Glow = styled.View({
  position: "absolute",
  right: -30,
  top: -30,
  width: 130,
  height: 130,
  borderRadius: 65,
  backgroundColor: "rgba(255,255,255,0.12)",
});
const Label = styled.Text(({ theme }) => ({
  color: theme.colors.onBrand,
  opacity: 0.9,
  fontSize: 12,
  fontWeight: "700",
  letterSpacing: 1,
  textTransform: "uppercase",
}));
const Value = styled.Text(({ theme }) => ({
  color: theme.colors.onBrand,
  fontSize: 34,
  fontWeight: "800",
  marginTop: 4,
}));
const Unit = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontSize: 15, fontWeight: "600", opacity: 0.85 }));
const Bar = styled.View({ height: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 14, overflow: "hidden" });
const Fill = styled.View(({ theme }) => ({ height: "100%", borderRadius: 999, backgroundColor: theme.colors.onBrand }));
const Next = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, opacity: 0.92, fontSize: 12, fontWeight: "600", marginTop: 7 }));
