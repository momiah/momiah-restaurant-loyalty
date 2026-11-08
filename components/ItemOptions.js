import React, { useEffect, useState } from "react";
import { Modal, ScrollView } from "react-native";
import styled from "styled-components/native";
import { gbp } from "../lib/format";

const CHOICES = [
  ["protein", "Choose your protein"],
  ["secondProtein", "Choose your second protein"],
  ["thirdProtein", "Choose your third protein"],
];

// Pick an item's proteins (required) and extras (optional) before adding it.
export default function ItemOptions({ item, onAdd, onClose }) {
  const [picked, setPicked] = useState({});
  const [extras, setExtras] = useState([]);
  useEffect(() => {
    setPicked({});
    setExtras([]);
  }, [item]);
  if (!item) return null;

  const choices = CHOICES.filter(([k]) => Array.isArray(item[k]) && item[k].length > 0);
  const missing = choices.find(([k]) => !picked[k]);
  const extrasPrice = (item.extras || []).filter((e) => extras.includes(e.type)).reduce((a, e) => a + (Number(e.price) || 0), 0);
  const toggleExtra = (type) => setExtras((xs) => (xs.includes(type) ? xs.filter((x) => x !== type) : [...xs, type]));

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Scrim>
        <Sheet>
          <ScrollView style={{ maxHeight: 460 }}>
            <Title>{item.name}</Title>
            {item.description ? <Desc>{item.description}</Desc> : null}
            {choices.map(([k, label]) => (
              <Group key={k}>
                <GroupTitle>{label}</GroupTitle>
                {item[k].map((c) => (
                  <Option key={c.type} on={picked[k] === c.type} onPress={() => setPicked((p) => ({ ...p, [k]: c.type }))} accessibilityRole="radio" accessibilityState={{ checked: picked[k] === c.type }}>
                    <OptionTxt>{c.type}</OptionTxt>
                    <Mark on={picked[k] === c.type} />
                  </Option>
                ))}
              </Group>
            ))}
            {Array.isArray(item.extras) && item.extras.length > 0 && (
              <Group>
                <GroupTitle>Extras</GroupTitle>
                {item.extras.map((e) => (
                  <Option key={e.type} on={extras.includes(e.type)} onPress={() => toggleExtra(e.type)} accessibilityRole="checkbox" accessibilityState={{ checked: extras.includes(e.type) }}>
                    <OptionTxt>{e.type}</OptionTxt>
                    <OptionPrice>+{gbp(Number(e.price) || 0)}</OptionPrice>
                  </Option>
                ))}
              </Group>
            )}
          </ScrollView>
          <Row>
            <Ghost onPress={onClose}><GhostTxt>Cancel</GhostTxt></Ghost>
            <AddBtn disabled={!!missing} off={!!missing} onPress={() => onAdd(item, { ...picked, extras })}>
              <AddTxt>{missing ? missing[1] : `Add · ${gbp((Number(item.price) || 0) + extrasPrice)}`}</AddTxt>
            </AddBtn>
          </Row>
        </Sheet>
      </Scrim>
    </Modal>
  );
}

const Scrim = styled.View({ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" });
const Sheet = styled.View(({ theme }) => ({ backgroundColor: theme.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 }));
const Title = styled.Text(({ theme }) => ({ fontSize: 19, fontWeight: "800", color: theme.colors.text }));
const Desc = styled.Text(({ theme }) => ({ fontSize: 13, color: theme.colors.faint, marginTop: 3 }));
const Group = styled.View({ marginTop: 14 });
const GroupTitle = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.text, marginBottom: 6 }));
const Option = styled.TouchableOpacity(({ theme, on }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: on ? theme.colors.primary : theme.colors.line, marginBottom: 6 }));
const OptionTxt = styled.Text(({ theme }) => ({ color: theme.colors.text, fontSize: 15 }));
const OptionPrice = styled.Text(({ theme }) => ({ color: theme.colors.muted, fontWeight: "700" }));
const Mark = styled.View(({ theme, on }) => ({ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: on ? theme.colors.primary : "transparent" }));
const Row = styled.View({ flexDirection: "row", gap: 10, marginTop: 14 });
const Ghost = styled.TouchableOpacity(({ theme }) => ({ flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: theme.colors.bg }));
const GhostTxt = styled.Text(({ theme }) => ({ fontWeight: "700", color: theme.colors.text }));
const AddBtn = styled.TouchableOpacity(({ theme, off }) => ({ flex: 2, paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: theme.colors.primary, opacity: off ? 0.5 : 1 }));
const AddTxt = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.onBrand }));
