import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header, { RoundButton } from "@/components/header";
import { STOCK_TONE } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Card, Chip, DetailRow, EmptyState, IconBadge, ProgressBar, QtyStepper, SectionHeader, Stamp } from "@/components/ui";
import { Colors, Fonts, PAD, Radius, Spacing } from "@/constants/theme";
import { ACTIVITY_META, categoryOf, STOCK_REASONS } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney, fullDate } from "@/lib/format";
import { go, goWith } from "@/lib/nav";
import { margin, STOCK_LABEL, stockStatus } from "@/lib/stock";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

export default function ProductDetail() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const inv = useInventory();
  const p = inv.getProduct(id);

  const [mode, setMode] = useState<"in" | "out" | null>(null);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState<string>(STOCK_REASONS.in[0]);
  const [busy, setBusy] = useState(false);

  if (!p) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Item" />
        <EmptyState icon="cube-outline" title="Item not found" body="It may have been deleted.">
          <Button title="Back to inventory" onPress={() => router.replace("/(tabs)/inventory" as never)} />
        </EmptyState>
      </Container>
    );
  }

  const status = stockStatus(p);
  const cat = categoryOf(p.category);
  const history = inv.activity.filter((a) => a.productId === p.id).slice(0, 8);
  const toneColor = status === "out" ? theme.danger : status === "low" ? theme.warning : theme.success;
  const target = Math.max(p.reorderLevel * 3, p.qty, 1);

  const open = (m: "in" | "out") => {
    setMode(mode === m ? null : m);
    setAmount(1);
    setReason(STOCK_REASONS[m][0]);
  };

  const confirm = async () => {
    if (!mode) return;
    setBusy(true);
    const res = await inv.changeStock(p.id, mode === "in" ? amount : -amount, reason);
    setBusy(false);
    if (!res.ok) return Alert.alert("Couldn't update stock", res.error);
    setMode(null);
  };

  const remove = () =>
    Alert.alert("Delete item?", `${p.name} will be removed from your inventory. Past orders keep their records.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await inv.removeProduct(p.id);
          if (!res.ok) return Alert.alert("Couldn't delete", res.error);
          router.replace("/(tabs)/inventory" as never);
        },
      },
    ]);

  return (
    <Container edges={["top", "bottom"]}>
      <Header
        title={p.name}
        subtitle={p.sku}
        right={
          <View style={{ flexDirection: "row", gap: Spacing.two }}>
            <RoundButton icon="create-outline" label="Edit item" onPress={() => goWith("/inventory/edit", { id: p.id })} />
            <RoundButton icon="trash-outline" label="Delete item" onPress={remove} />
          </View>
        }
      />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        {/* level card */}
        <View style={{ backgroundColor: Colors.hero, borderRadius: Radius.xl, padding: Spacing.four - 4, gap: Spacing.three }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two }}>
              <IconBadge icon={cat.icon} size={34} bg="rgba(255,248,236,0.12)" color={Colors.brass} />
              <ThemedText type="label" style={{ color: Colors.heroMuted }}>{cat.label}</ThemedText>
            </View>
            <Stamp label={STOCK_LABEL[status]} tone={STOCK_TONE[status]} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <ThemedText style={{ fontFamily: Fonts.serif, fontSize: 56, lineHeight: 60, fontWeight: "700", color: Colors.heroText, fontVariant: ["tabular-nums"] }}>{p.qty.toLocaleString("en-NG")}</ThemedText>
            <ThemedText style={{ color: Colors.heroMuted, fontSize: 17 }}>{p.unit} on hand</ThemedText>
          </View>
          <View style={{ gap: 6 }}>
            <ProgressBar value={p.qty / target} color={toneColor} height={8} />
            <ThemedText type="caption" style={{ color: Colors.heroMuted }}>Reorder at {p.reorderLevel} {p.unit}</ThemedText>
          </View>
        </View>

        {/* actions */}
        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          <Button title="Add stock" iconLeft="add-circle-outline" variant={mode === "in" ? "primary" : "soft"} onPress={() => open("in")} style={{ flex: 1 }} />
          <Button title="Remove" iconLeft="remove-circle-outline" variant={mode === "out" ? "primary" : "secondary"} onPress={() => open("out")} style={{ flex: 1 }} />
        </View>

        {mode && (
          <Card alt style={{ gap: Spacing.three }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <ThemedText type="bold">{mode === "in" ? "Receive stock" : "Remove stock"}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">New level: {Math.max(0, p.qty + (mode === "in" ? amount : -amount))} {p.unit}</ThemedText>
              </View>
              <QtyStepper value={amount} min={1} max={mode === "out" ? Math.max(1, p.qty) : 99999} onChange={setAmount} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
              {STOCK_REASONS[mode].map((r) => (
                <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
              ))}
            </ScrollView>
            <Button title={mode === "in" ? `Add ${amount} ${p.unit}` : `Remove ${amount} ${p.unit}`} onPress={confirm} loading={busy} disabled={mode === "out" && p.qty === 0} />
          </Card>
        )}

        {/* pricing */}
        <View>
          <SectionHeader title="Pricing" />
          <Card style={{ paddingVertical: Spacing.two }}>
            <DetailRow label="Selling price" value={formatMoney(p.price, { decimals: false })} bold />
            <DetailRow label="Cost price" value={formatMoney(p.cost, { decimals: false })} />
            <DetailRow label="Margin" value={`${Math.round(margin(p.price, p.cost))}%`} color={theme.success} />
            <DetailRow label="Stock value (cost)" value={formatMoney(p.cost * p.qty, { decimals: false })} />
            <DetailRow label="Stock value (retail)" value={formatMoney(p.price * p.qty, { decimals: false })} last />
          </Card>
        </View>

        {/* details */}
        <View>
          <SectionHeader title="Details" />
          <Card style={{ paddingVertical: Spacing.two }}>
            <DetailRow label="Category" value={cat.label} />
            <DetailRow label="Supplier" value={p.supplierName ?? "Not set"} />
            <DetailRow label="Location" value={p.location ?? "Not set"} last={!p.notes} />
            {p.notes ? <DetailRow label="Notes" value={p.notes} last /> : null}
          </Card>
          {p.supplierId && inv.getSupplier(p.supplierId) ? (
            <View style={{ marginTop: Spacing.three }}>
              <Button title="View supplier" variant="ghost" icon="arrow-forward" small onPress={() => go(`/suppliers/${p.supplierId}`)} />
            </View>
          ) : null}
        </View>

        {/* history */}
        <View>
          <SectionHeader title="Stock history" />
          {history.length === 0 ? (
            <Card dashed><ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>Movements will appear here as stock is added, sold or adjusted.</ThemedText></Card>
          ) : (
            <Card style={{ paddingVertical: 0 }}>
              {history.map((a, i) => (
                <View key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 2, borderBottomWidth: i === history.length - 1 ? 0 : 1, borderBottomColor: theme.line }}>
                  <IconBadge icon={ACTIVITY_META[a.kind].icon} size={36} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" numberOfLines={1}>{a.title}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">{a.detail} · {fullDate(a.ts)}</ThemedText>
                  </View>
                  {a.delta !== undefined && (
                    <ThemedText type="bold" style={{ color: a.delta > 0 ? theme.success : theme.danger, fontVariant: ["tabular-nums"] }}>
                      {a.delta > 0 ? "+" : ""}{a.delta}
                    </ThemedText>
                  )}
                </View>
              ))}
            </Card>
          )}
        </View>
      </View>
    </Container>
  );
}
