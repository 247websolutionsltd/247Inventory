import Avatar from "@/components/avatar";
import Button from "@/components/button";
import { TabHeader } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Chip, EmptyState, Fab, Stamp } from "@/components/ui";
import { PAD, Radius, Spacing, TabBarSpace } from "@/constants/theme";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { go } from "@/lib/nav";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = "all" | "active" | "off";

export default function Team() {
  const theme = useTheme();
  const { staff, orders, ready } = useInventory();
  const [filter, setFilter] = useState<Filter>("all");

  const active = staff.filter((s) => s.active).length;
  const handled = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach((o) => o.assignedId && m.set(o.assignedId, (m.get(o.assignedId) ?? 0) + 1));
    return m;
  }, [orders]);
  const rows = staff.filter((s) => (filter === "all" ? true : filter === "active" ? s.active : !s.active));

  const header = (
    <View>
      <TabHeader eyebrow={`${active} active · ${staff.length} total`} title="Team" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: PAD, paddingBottom: Spacing.three }}>
        <Chip label="Everyone" selected={filter === "all"} onPress={() => setFilter("all")} count={staff.length} />
        <Chip label="Active" selected={filter === "active"} onPress={() => setFilter("active")} count={active} />
        <Chip label="Off" selected={filter === "off"} onPress={() => setFilter("off")} count={staff.length - active} />
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <FlatList
        data={rows}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={header}
        numColumns={1}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: PAD, marginBottom: Spacing.two + 2 }}>
            <TouchableOpacity onPress={() => go(`/staff/${item.id}`)} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, padding: Spacing.three - 2, borderRadius: Radius.lg, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, opacity: item.active ? 1 : 0.65 }}>
              <Avatar name={item.name} size={48} dim={!item.active} />
              <View style={{ flex: 1, gap: 3 }}>
                <ThemedText type="bold" numberOfLines={1}>{item.name}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">{item.role} · {item.shift} shift</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">{handled.get(item.id) ?? 0} orders handled</ThemedText>
              </View>
              <Stamp label={item.active ? "Active" : "Off"} tone={item.active ? "success" : "neutral"} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          ready ? (
            <EmptyState icon="people-outline" title={staff.length ? "No one here" : "No team members yet"} body="Add your staff to assign orders and keep track of shifts.">
              {staff.length === 0 && <Button title="Add team member" iconLeft="person-add-outline" onPress={() => go("/staff/edit")} />}
            </EmptyState>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: TabBarSpace + 72 }}
        showsVerticalScrollIndicator={false}
      />
      <Fab label="Add staff" icon="person-add-outline" onPress={() => go("/staff/edit")} />
    </SafeAreaView>
  );
}
