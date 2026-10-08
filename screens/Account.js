import React, { useMemo } from "react";
import styled from "styled-components/native";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useRestaurant } from "../context/RestaurantContext";
import { num } from "../lib/format";
import { REWARD_TIERS, nextReward } from "../lib/points";

export default function Account({ onMenu }) {
  const { user, profile, signOutUser } = useAuth();
  const { restaurant } = useRestaurant();

  const points = profile?.points || 0;
  const lifetime = profile?.lifetimePoints || 0;
  const next = useMemo(() => nextReward(points), [points]);
  const name = profile?.name || user?.displayName || "Member";

  return (
    <Wrap>
      <Header title="My Account" onMenu={onMenu} />
      <Body contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Head>
          <Avatar><AvatarTxt>{(name[0] || "M").toUpperCase()}</AvatarTxt></Avatar>
          <AName>{name}</AName>
          <AMail>{user?.email}</AMail>
          <Tier><TierTxt>{restaurant?.name || "Member"}</TierTxt></Tier>
        </Head>

        <Balance>
          <BalVal>{num(points)} pts</BalVal>
          <BalSub>Lifetime: {num(lifetime)} pts</BalSub>
          {next ? <BalNext>{num(next.points - points)} pts to {next.label}</BalNext> : <BalNext>Top reward reached 🎉</BalNext>}
        </Balance>

        <SecTitle>Your rewards</SecTitle>
        {REWARD_TIERS.map((t, i) => {
          const unlocked = points >= t.points;
          return (
            <Reward key={i}>
              <RIcon unlocked={unlocked}><RIconTxt unlocked={unlocked}>{unlocked ? "🎁" : "🔒"}</RIconTxt></RIcon>
              <RMain>
                <RName>{t.label}</RName>
                <RDesc>{unlocked ? "Ready to redeem" : `Unlocks at ${num(t.points)} pts`}</RDesc>
              </RMain>
              <RCta unlocked={unlocked}>{unlocked ? "Redeem" : "Locked"}</RCta>
            </Reward>
          );
        })}

        <Note>Redeeming &amp; the full points system arrive in Phase 2. Points earn at 1 per £1 for now.</Note>

        <SignOut onPress={signOutUser}><SignOutTxt>Sign out</SignOutTxt></SignOut>
      </Body>
    </Wrap>
  );
}

const Wrap = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.bg }));
const Body = styled.ScrollView({ flex: 1 });
const Head = styled.View({ alignItems: "center", paddingVertical: 10 });
const Avatar = styled.View(({ theme }) => ({ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.brandDeep, alignItems: "center", justifyContent: "center" }));
const AvatarTxt = styled.Text(({ theme }) => ({ color: theme.colors.onBrand, fontSize: 26, fontWeight: "800" }));
const AName = styled.Text(({ theme }) => ({ fontSize: 19, fontWeight: "800", color: theme.colors.text, marginTop: 8 }));
const AMail = styled.Text(({ theme }) => ({ fontSize: 13, color: theme.colors.faint }));
const Tier = styled.View(({ theme }) => ({ backgroundColor: theme.colors.brandSoft, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 12, marginTop: 8 }));
const TierTxt = styled.Text(({ theme }) => ({ color: theme.colors.brandDeep, fontWeight: "800", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }));
const Balance = styled.View(({ theme }) => ({ backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.line, padding: 18, marginTop: 10, alignItems: "center" }));
const BalVal = styled.Text(({ theme }) => ({ fontSize: 30, fontWeight: "800", color: theme.colors.primary }));
const BalSub = styled.Text(({ theme }) => ({ fontSize: 13, color: theme.colors.muted, marginTop: 2 }));
const BalNext = styled.Text(({ theme }) => ({ fontSize: 13, color: theme.colors.accent, fontWeight: "700", marginTop: 6 }));
const SecTitle = styled.Text(({ theme }) => ({ fontSize: 16, fontWeight: "800", color: theme.colors.text, marginTop: 20, marginBottom: 8 }));
const Reward = styled.View(({ theme }) => ({ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.line }));
const RIcon = styled.View(({ theme, unlocked }) => ({ width: 40, height: 40, borderRadius: 12, backgroundColor: unlocked ? theme.colors.brandSoft : theme.colors.bg, alignItems: "center", justifyContent: "center" }));
const RIconTxt = styled.Text({ fontSize: 18 });
const RMain = styled.View({ flex: 1 });
const RName = styled.Text(({ theme }) => ({ fontWeight: "700", fontSize: 14, color: theme.colors.text }));
const RDesc = styled.Text(({ theme }) => ({ fontSize: 12, color: theme.colors.faint }));
const RCta = styled.Text(({ theme, unlocked }) => ({ fontWeight: "800", fontSize: 12, color: unlocked ? theme.colors.primary : theme.colors.faint }));
const Note = styled.Text(({ theme }) => ({ fontSize: 12, color: theme.colors.faint, fontStyle: "italic", marginTop: 16 }));
const SignOut = styled.TouchableOpacity({ marginTop: 20, alignItems: "center", paddingVertical: 12 });
const SignOutTxt = styled.Text({ color: "#C0392B", fontWeight: "700" });
