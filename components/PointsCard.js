import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { num } from "../lib/format";

// Themed loyalty points card. Colour comes entirely from the restaurant theme, and the
// text colour auto-adapts to the card background (onBrandDeep) so it's legible on any
// brand. The progress bar animates from empty to the current level on mount.
export default function PointsCard({ points = 0, next }) {
  const theme = useTheme();
  const pct = next ? Math.min(100, Math.round((points / next.points) * 100)) : 100;

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false, // width can't use the native driver
    }).start();
  }, [pct, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  const ink = theme.colors.onBrandDeep;

  return (
    <Card>
      <Glow />
      <Label style={{ color: ink }}>Your points</Label>
      <Value style={{ color: ink }}>
        {num(points)} <Unit style={{ color: ink }}>pts</Unit>
      </Value>
      <Bar>
        <Animated.View style={{ width, height: "100%", borderRadius: 999, backgroundColor: ink }} />
      </Bar>
      <Next style={{ color: ink }}>
        {next ? `${num(next.points - points)} pts to ${next.label} 🎉` : "Top reward reached 🎉"}
      </Next>
    </Card>
  );
}

const Card = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.brandDeep,
  borderRadius: theme.radii.lg,
  padding: 24,
  minHeight: 172,
  justifyContent: "center",
  overflow: "hidden",
}));
const Glow = styled.View({
  position: "absolute",
  right: -40,
  top: -40,
  width: 170,
  height: 170,
  borderRadius: 85,
  backgroundColor: "rgba(255,255,255,0.12)",
});
const Label = styled.Text({
  opacity: 0.9,
  fontSize: 13,
  fontWeight: "700",
  letterSpacing: 1,
  textTransform: "uppercase",
});
const Value = styled.Text({
  fontSize: 46,
  fontWeight: "800",
  marginTop: 8,
});
const Unit = styled.Text({ fontSize: 18, fontWeight: "600", opacity: 0.85 });
const Bar = styled.View({ height: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 20, overflow: "hidden" });
const Next = styled.Text({ opacity: 0.92, fontSize: 13, fontWeight: "600", marginTop: 10 });
