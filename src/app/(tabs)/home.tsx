import Avatar from "@/components/avatar";
import Button from "@/components/button";
import Container from "@/components/custom-container";
import { RoundButton } from "@/components/header";
import BigAmount from "@/components/money";
import { OrderRow, ProductRow } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Card, EmptyState, HeroDecor, IconBadge, SectionHeader, StatTile } from "@/components/ui";
import { Colors, Fonts, PAD, Radius, Spacing, TabBarSpace } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useAuth } from "@/context/PageContext";
import { useTheme } from "@/hooks/use-theme";
import { compactMoney, formatMoney, greeting, num, shortDate } from "@/lib/format";
import { go } from "@/lib/nav";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

const QUICK: { label: string; icon: IconName; route: string }[] = [
  { label: "New order", icon: "receipt-outline", route: "/orders/new" },
  { label: "Add item", icon: "add-circle-outline", route: "/inventory/edit" },
  { label: "Add staff", icon: "person-add-outline", route: "/staff/edit" },
  { label: "Reports", icon: "bar-chart-outline", route: "/reports" },
];

export default function Overview() {
  const theme = useTheme();
  const { owner } = useAuth();
  const inv = useInventory();
  const [seeding, setSeeding] = useState(false);

  const first = owner.name.split(" ")[0] || "there";
  const today = inv.last7[inv.last7.length - 1]?.ts ?? 0;
  const empty = inv.ready && inv.products.length === 0 && inv.orders.length === 0;
  const maxDay = Math.max(1, ...inv.last7.map((d) => d.total));
  const delta = inv.yesterdaySales > 0 ? ((inv.todaySales - inv.yesterdaySales) / inv.yesterdaySales) * 100 : null;
  const onDuty = inv.staff.filter((s) => s.active);
  const attention = [...inv.outOfStock, ...inv.lowStock].slice(0, 4);

  const seed = async () => {
    setSeeding(true);
    const res = await inv.loadSampleData();
    setSeeding(false);
    if (!res.ok) Alert.alert("Couldn't load sample data", res.error);
  };

  return (
    <Container edges={["top"]} style={{ paddingBottom: TabBarSpace }}>
      {/* top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: PAD, paddingTop: Spacing.three, gap: Spacing.three }}>
        <Avatar name={owner.businessName || owner.name} size={46} />
        <View style={{ flex: 1 }}>
          <ThemedText type="label" themeColor="accent" numberOfLines={1}>{owner.businessName || "Your business"}</ThemedText>
          <ThemedText type="big" numberOfLines={1}>{greeting()}, {first}</ThemedText>
        </View>
        <RoundButton icon="notifications-outline" label="Alerts" dot={inv.alerts.length > 0} badge={inv.alerts.length} onPress={() => go("/alerts")} />
      </View>

      {empty ? (
        <View style={{ paddingHorizontal: PAD, marginTop: Spacing.four }}>
          <Card dashed style={{ paddingVertical: Spacing.four }}>
            <EmptyState icon="file-tray-stacked-outline" title="Your stockroom is empty" body="Add your first item to start tracking stock, or load a sample shop to explore every screen with real-looking data.">
              <Button title="Add first item" icon="arrow-forward" onPress={() => go("/inventory/edit")} />
              <Button title="Load sample shop" variant="secondary" iconLeft="sparkles-outline" onPress={seed} loading={seeding} />
            </EmptyState>
          </Card>
        </View>
      ) : (
        <>
          {/* ledger hero */}
          <View style={{ marginHorizontal: PAD, marginTop: Spacing.four, backgroundColor: Colors.hero, borderRadius: Radius.xl, padding: Spacing.four - 4, overflow: "hidden" }}>
            <HeroDecor lines={7} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <ThemedText type="label" style={{ color: Colors.brass }}>Today&apos;s sales</ThemedText>
              <ThemedText type="mono" style={{ color: Colors.heroMuted }}>{today ? shortDate(today) : ""}</ThemedText>
            </View>
            <View style={{ marginTop: Spacing.two }}>
              <BigAmount value={inv.todaySales} size={40} color={Colors.heroText} mutedColor={Colors.brass} decimals={false} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two, marginTop: Spacing.two, flexWrap: "wrap" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.heroChip, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 }}>
                <Ionicons name="receipt-outline" size={12} color={Colors.heroText} />
                <ThemedText type="caption" style={{ color: Colors.heroText, fontWeight: "700" }}>{inv.ordersToday} {inv.ordersToday === 1 ? "order" : "orders"}</ThemedText>
              </View>
              {delta !== null && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.heroChip, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 }}>
                  <Ionicons name={delta >= 0 ? "trending-up" : "trending-down"} size={13} color={delta >= 0 ? "#B6DB94" : "#F0A08E"} />
                  <ThemedText type="caption" style={{ color: Colors.heroText, fontWeight: "700" }}>{Math.abs(Math.round(delta))}% vs yesterday</ThemedText>
                </View>
              )}
            </View>

            {/* 7-day bars */}
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 78, marginTop: Spacing.four - 4 }}>
              {inv.last7.map((d, i) => {
                const today = i === inv.last7.length - 1;
                return (
                  <View key={d.ts} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 5 }}>
                    <View style={{ width: "100%", height: Math.max(4, (d.total / maxDay) * 54), borderRadius: 3, backgroundColor: today ? Colors.brass : "rgba(255,248,236,0.28)" }} />
                    <ThemedText type="caption" style={{ color: today ? Colors.brass : Colors.heroMuted, fontWeight: "800", fontSize: 10.5 }}>{d.label}</ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* quick actions */}
          <View style={{ flexDirection: "row", gap: Spacing.two + 2, paddingHorizontal: PAD, marginTop: Spacing.three }}>
            {QUICK.map((q) => (
              <TouchableOpacity key={q.label} onPress={() => go(q.route)} activeOpacity={0.8} style={{ flex: 1, alignItems: "center", gap: 7, paddingVertical: Spacing.three - 2, borderRadius: Radius.lg, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line }}>
                <IconBadge icon={q.icon} size={38} />
                <ThemedText type="caption" style={{ fontWeight: "700", textAlign: "center" }}>{q.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* stat grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two + 2, paddingHorizontal: PAD, marginTop: Spacing.three }}>
            <StatTile label="Items" value={num(inv.products.length)} sub={`${num(inv.unitsInStock)} units on hand`} icon="cube-outline" onPress={() => go("/(tabs)/inventory")} />
            <StatTile label="Stock value" value={compactMoney(inv.stockValue)} sub={`Retail ${compactMoney(inv.retailValue)}`} icon="wallet-outline" />
            <StatTile label="Low / out" value={num(inv.lowStock.length + inv.outOfStock.length)} sub={inv.outOfStock.length ? `${inv.outOfStock.length} out of stock` : "Needs restocking"} icon="warning-outline" tone={inv.lowStock.length + inv.outOfStock.length ? "danger" : "neutral"} onPress={() => go("/alerts")} />
            <StatTile label="Open orders" value={num(inv.openOrders.length)} sub="Pending to ready" icon="time-outline" tone={inv.openOrders.length ? "warning" : "neutral"} onPress={() => go("/(tabs)/orders")} />
          </View>

          {/* needs attention */}
          {attention.length > 0 && (
            <View style={{ paddingHorizontal: PAD, marginTop: Spacing.five }}>
              <SectionHeader title="Needs restocking" action="See all" onAction={() => go("/alerts")} />
              <Card style={{ paddingVertical: 0 }}>
                {attention.map((p, i) => (
                  <ProductRow key={p.id} product={p} last={i === attention.length - 1} onPress={() => go(`/inventory/${p.id}`)} />
                ))}
              </Card>
            </View>
          )}

          {/* recent orders */}
          <View style={{ paddingHorizontal: PAD, marginTop: Spacing.five }}>
            <SectionHeader title="Recent orders" action="See all" onAction={() => go("/(tabs)/orders")} />
            {inv.orders.length === 0 ? (
              <Card dashed><EmptyState icon="receipt-outline" title="No orders yet" body="Create your first order and stock will update automatically."><Button title="New order" small onPress={() => go("/orders/new")} /></EmptyState></Card>
            ) : (
              <Card style={{ paddingVertical: 0 }}>
                {inv.orders.slice(0, 4).map((o, i, a) => (
                  <OrderRow key={o.id} order={o} last={i === a.length - 1} onPress={() => go(`/orders/${o.id}`)} />
                ))}
              </Card>
            )}
          </View>

          {/* best sellers */}
          {inv.topSellers.length > 0 && (
            <View style={{ paddingHorizontal: PAD, marginTop: Spacing.five }}>
              <SectionHeader title="Best sellers · 7 days" action="Reports" onAction={() => go("/reports")} />
              <Card>
                {inv.topSellers.slice(0, 3).map((t, i) => (
                  <View key={t.productId} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.two }}>
                    <ThemedText style={{ fontFamily: Fonts.serif, fontSize: 24, fontWeight: "700", width: 26, color: theme.inkSoft }}>{i + 1}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" numberOfLines={1}>{t.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">{num(t.units)} sold</ThemedText>
                    </View>
                    <ThemedText type="bold">{formatMoney(t.revenue, { decimals: false })}</ThemedText>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* team */}
          {onDuty.length > 0 && (
            <View style={{ marginTop: Spacing.five }}>
              <View style={{ paddingHorizontal: PAD }}>
                <SectionHeader title="Team on the floor" action="Manage" onAction={() => go("/(tabs)/staff")} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: Spacing.two + 2 }}>
                {onDuty.map((s) => (
                  <TouchableOpacity key={s.id} onPress={() => go(`/staff/${s.id}`)} activeOpacity={0.8} style={{ width: 128, padding: Spacing.three - 2, borderRadius: Radius.lg, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, gap: 8 }}>
                    <Avatar name={s.name} size={40} />
                    <View>
                      <ThemedText type="smallBold" numberOfLines={1}>{s.name.split(" ")[0]}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>{s.role} · {s.shift}</ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </Container>
  );
}
