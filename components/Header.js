import React from "react";
import styled from "styled-components/native";

// Top app bar with the burger button and a title (restaurant name or screen name).
export default function Header({ title, subtitle, onMenu }) {
  return (
    <Bar>
      <Burger onPress={onMenu} accessibilityLabel="Open menu">
        <Line /><Line /><Line />
      </Burger>
      <Titles>
        <Title numberOfLines={1}>{title}</Title>
        {subtitle ? <Sub>{subtitle}</Sub> : null}
      </Titles>
    </Bar>
  );
}

const Bar = styled.View({ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 });
const Burger = styled.TouchableOpacity(({ theme }) => ({ width: 38, height: 38, borderRadius: 11, backgroundColor: theme.colors.brandSoft, alignItems: "center", justifyContent: "center", gap: 3 }));
const Line = styled.View(({ theme }) => ({ width: 16, height: 2, borderRadius: 2, backgroundColor: theme.colors.brandDeep }));
const Titles = styled.View({ flex: 1 });
const Title = styled.Text(({ theme }) => ({ fontSize: 18, fontWeight: "800", color: theme.colors.text }));
const Sub = styled.Text(({ theme }) => ({ fontSize: 11, fontWeight: "600", color: theme.colors.faint, textTransform: "uppercase", letterSpacing: 0.6 }));
