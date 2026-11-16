import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, EmptyState, IconBadge, SectionHeader } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { AlertItem, useInventory } from "@/context/InventoryContext";
import { useAuth } from "@/context/PageContext";
import { useTheme } from "@/hooks/use-theme";
import { go } from "@/lib/nav";
import { View } from "react-native";

const META: Record<AlertItem["kind"], { title: string; icon: IconName }> = {
  out: { title: "Out of stock", icon: "close-circle-outline" },
  low: { title: "Running low", icon: "alert-circle-outline" },
  pending: { title: "Orders waiting", icon: "time-outline" },
  unpaid: { title: "Unpaid deliveries", icon: "cash-outline" },
};

export default function Alerts() {
  const theme = useTheme();
  const { alerts } = useInventory();
  const { user } = useAuth();
  const stockOn = user?.lowStockAlerts !== false;
  const visible = alerts.filter((a) => stockOn || (a.kind !== "out" && a.kind !== "low"));

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Alerts" subtitle={visible.length ? `${visible.length} need attention` : "Nothing needs attention"} />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        {visible.length === 0 ? (
          <EmptyState icon="checkmark-done-outline" title="All clear" body="No low stock, stuck orders or unpaid deliveries right now." />
        ) : (
          (Object.keys(META) as AlertItem["kind"][]).map((k) => {
            const group = visible.filter((a) => a.kind === k);
            if (!group.length) return null;
            const color = k === "out" ? theme.danger : k === "low" || k === "unpaid" ? theme.warning : theme.accent;
            const bg = k === "out" ? theme.dangerSurface : k === "low" || k === "unpaid" ? theme.warningSurface : undefined;
            return (
              <View key={k}>
                <SectionHeader title={`${META[k].title} (${group.length})`} />
                <Card style={{ paddingVertical: 0 }}>
                  {group.map((a, i) => (
                    <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 2, borderBottomWidth: i === group.length - 1 ? 0 : 1, borderBottomColor: theme.line }}>
                      <IconBadge icon={META[k].icon} size={40} color={color} bg={bg} />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{a.title}</ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">{a.detail}</ThemedText>
                      </View>
                      <Button small variant="soft" title={k === "out" || k === "low" ? "Restock" : "Open"} onPress={() => go(a.route)} />
                    </View>
                  ))}
                </Card>
              </View>
            );
          })
        )}
      </View>
    </Container>
  );
}
