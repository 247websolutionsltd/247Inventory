import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, ListRow, SectionHeader } from "@/components/ui";
import { Brand } from "@/constants/brand";
import { PAD, Spacing } from "@/constants/theme";
import { openExternalLink } from "@/lib/links";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";

const faqs = [
  { q: "How does stock update when I place an order?", a: "Placing an order deducts the items from your inventory straight away. If you cancel the order, the items go back on the shelf." },
  { q: "What does 'Low stock' mean?", a: "An item is low when its quantity is at or below its reorder level. Set the level when you add or edit an item." },
  { q: "How do I receive a delivery from a supplier?", a: "Open the item, tap Add stock, enter the quantity and choose 'Restock'. The change is saved to the item's history and the activity log." },
  { q: "Can my staff sign in?", a: "Team members are records for scheduling and assigning orders. Sign-ins are for the account owner for now." },
  { q: "My count is wrong. How do I correct it?", a: "Use Add stock or Remove on the item and pick 'Count correction' as the reason, so the fix is recorded." },
];

export default function Support() {
  const theme = useTheme();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Help & support" />
      <View style={{ paddingHorizontal: PAD }}>
        <Card style={{ paddingVertical: 0 }}>
          <ListRow icon="mail-outline" title="Email us" subtitle={Brand.supportEmail} onPress={() => openExternalLink(`mailto:${Brand.supportEmail}`, "the email app")} />
          <ListRow icon="call-outline" title="Call us" subtitle={Brand.supportPhone} onPress={() => openExternalLink(`tel:${Brand.supportPhone.replace(/\s/g, "")}`, "the phone app")} last />
        </Card>

        <SectionHeader title="Common questions" style={{ marginTop: Spacing.five }} />
        <View style={{ gap: Spacing.two + 2 }}>
          {faqs.map((f, i) => (
            <Card key={f.q} onPress={() => setOpen(open === i ? null : i)}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ThemedText type="smallBold" style={{ flex: 1 }}>{f.q}</ThemedText>
                <Ionicons name={open === i ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
              </View>
              {open === i && <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two, lineHeight: 21 }}>{f.a}</ThemedText>}
            </Card>
          ))}
        </View>
      </View>
    </Container>
  );
}
