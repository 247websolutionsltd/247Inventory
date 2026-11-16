import { TabHeader } from "@/components/header";
import { ProductRow } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Chip, EmptyState, Fab, SearchBar } from "@/components/ui";
import Button from "@/components/button";
import { PAD, Spacing, TabBarSpace } from "@/constants/theme";
import { CATEGORIES } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { compactMoney, num } from "@/lib/format";
import { go } from "@/lib/nav";
import { stockStatus } from "@/lib/stock";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Level = "all" | "low" | "out";

export default function Inventory() {
  const theme = useTheme();
  const { products, stockValue, lowStock, outOfStock, ready } = useInventory();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<Level>("all");
  const level: Level = params.filter === "low" || params.filter === "out" ? params.filter : selectedLevel;
  const selectLevel = (next: Level) => {
    setSelectedLevel(next);
    if (params.filter !== undefined) router.setParams({ filter: undefined });
  };

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      const s = stockStatus(p);
      if (level === "low" && s !== "low") return false;
      if (level === "out" && s !== "out") return false;
      if (needle && !(p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [products, q, cat, level]);

  const header = (
    <View>
      <TabHeader eyebrow={`${num(products.length)} items · ${compactMoney(stockValue)} at cost`} title="Inventory" />
      <View style={{ paddingHorizontal: PAD }}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search by name or SKU" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: PAD, paddingTop: Spacing.three }}>
        <Chip label="All" selected={level === "all"} onPress={() => selectLevel("all")} count={products.length} />
        <Chip label="Low" icon="alert-circle-outline" selected={level === "low"} onPress={() => selectLevel("low")} count={lowStock.length} />
        <Chip label="Out" icon="close-circle-outline" selected={level === "out"} onPress={() => selectLevel("out")} count={outOfStock.length} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: PAD, paddingVertical: Spacing.three }}>
        <Chip label="All categories" selected={cat === "all"} onPress={() => setCat("all")} />
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} icon={c.icon} selected={cat === c.id} onPress={() => setCat(c.id)} />
        ))}
      </ScrollView>
      <View style={{ height: 1, backgroundColor: theme.line, marginHorizontal: PAD }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <FlatList
        data={rows}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: PAD }}>
            <ProductRow product={item} last={index === rows.length - 1} onPress={() => go(`/inventory/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          ready ? (
            products.length === 0 ? (
              <EmptyState icon="cube-outline" title="No items yet" body="Add your products to track quantities, prices and reorder levels.">
                <Button title="Add your first item" iconLeft="add" onPress={() => go("/inventory/edit")} />
              </EmptyState>
            ) : (
              <EmptyState icon="search-outline" title="Nothing matches" body="Try a different search, category or stock filter." />
            )
          ) : (
            <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>Loading…</ThemedText>
          )
        }
        contentContainerStyle={{ paddingBottom: TabBarSpace + 72 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <Fab label="Add item" onPress={() => go("/inventory/edit")} />
    </SafeAreaView>
  );
}
