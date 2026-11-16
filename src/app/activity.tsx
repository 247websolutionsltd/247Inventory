import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, EmptyState, IconBadge, SectionHeader } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { ACTIVITY_META } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { dayLabel, timeLabel } from "@/lib/format";
import { go } from "@/lib/nav";
import { TouchableOpacity, View } from "react-native";

export default function ActivityLog() {
  const theme = useTheme();
  const { activity } = useInventory();

  const groups: { label: string; rows: typeof activity }[] = [];
  activity.forEach((a) => {
    const label = dayLabel(a.ts);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.rows.push(a);
    else groups.push({ label, rows: [a] });
  });

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Activity log" subtitle="Latest 150 changes" />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        {groups.length === 0 ? (
          <EmptyState icon="time-outline" title="No activity yet" body="Stock changes, orders and team updates are recorded here." />
        ) : (
          groups.map((g) => (
            <View key={g.label}>
              <SectionHeader title={g.label} />
              <Card style={{ paddingVertical: 0 }}>
                {g.rows.map((a, i) => (
                  <TouchableOpacity
                    key={a.id}
                    disabled={!a.orderId && !a.productId}
                    onPress={() => go(a.orderId ? `/orders/${a.orderId}` : `/inventory/${a.productId}`)}
                    activeOpacity={0.7}
                    style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 2, borderBottomWidth: i === g.rows.length - 1 ? 0 : 1, borderBottomColor: theme.line }}
                  >
                    <IconBadge icon={ACTIVITY_META[a.kind].icon} size={38} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" numberOfLines={2}>{a.title}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>{a.detail}{a.actor ? ` · ${a.actor}` : ""}</ThemedText>
                    </View>
                    <ThemedText type="mono" themeColor="textSecondary">{timeLabel(a.ts)}</ThemedText>
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          ))
        )}
      </View>
    </Container>
  );
}
