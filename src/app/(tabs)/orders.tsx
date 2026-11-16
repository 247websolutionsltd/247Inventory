import Button from "@/components/button";
import { TabHeader } from "@/components/header";
import { OrderRow } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Chip, EmptyState, Fab, SearchBar } from "@/components/ui";
import { PAD, Spacing, TabBarSpace } from "@/constants/theme";
import { ORDER_STATUS_META, OrderStatus } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { go } from "@/lib/nav";
import { plural } from "@/lib/format";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = "all" | "open" | OrderStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "ready", label: "Ready" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const matchesOrder = (status: OrderStatus, filter: Filter) =>
  filter === "all" ? true : filter === "open" ? ["pending", "processing", "ready"].includes(status) : status === filter;

export default function Orders() {
  const theme = useTheme();
  const { orders, openOrders, ready } = useInventory();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
  const filter = params.filter && FILTERS.some((f) => f.id === params.filter) ? params.filter as Filter : selectedFilter;
  const [q, setQ] = useState("");

  const selectFilter = (next: Filter) => {
    setSelectedFilter(next);
    if (params.filter !== undefined) router.setParams({ filter: undefined });
  };

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => matchesOrder(o.status, filter) && (!needle || o.customer.toLowerCase().includes(needle) || o.number.toLowerCase().includes(needle)));
  }, [orders, filter, q]);

  const header = (
    <View>
      <TabHeader eyebrow={`${plural(openOrders.length, "open order")}`} title="Orders" />
      <View style={{ paddingHorizontal: PAD }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search customer or order number" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: PAD, paddingVertical: Spacing.three }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => selectFilter(f.id)} count={f.id === "all" ? orders.length : orders.filter((o) => matchesOrder(o.status, f.id)).length} icon={f.id in ORDER_STATUS_META ? ORDER_STATUS_META[f.id as OrderStatus].icon : undefined} />
        ))}
      </ScrollView>
      <View style={{ height: 1, backgroundColor: theme.line, marginHorizontal: PAD }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <FlatList
        data={rows}
        keyExtractor={(o) => o.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: PAD }}>
            <OrderRow order={item} last={index === rows.length - 1} onPress={() => go(`/orders/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          ready ? (
            orders.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No orders yet" body="Orders you create appear here, and stock is deducted automatically.">
                <Button title="Create an order" iconLeft="add" onPress={() => go("/orders/new")} />
              </EmptyState>
            ) : (
              <EmptyState icon="search-outline" title="No matching orders" body="Try another status or search term." />
            )
          ) : (
            <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>Loading…</ThemedText>
          )
        }
        contentContainerStyle={{ paddingBottom: TabBarSpace + 72 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <Fab label="New order" icon="receipt-outline" onPress={() => go("/orders/new")} />
    </SafeAreaView>
  );
}
