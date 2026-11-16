import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, Chip, EmptyState, ProgressBar, SectionHeader } from "@/components/ui";
import { Colors, Fonts, PAD, Radius, Spacing } from "@/constants/theme";
import { CATEGORIES } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { compactMoney, formatMoney, num } from "@/lib/format";
import { useMemo, useState } from "react";
import { View } from "react-native";

const DAY = 86_400_000;
type Range = 7 | 30;

export default function Reports() {
  const theme = useTheme();
  const { orders, products, last7 } = useInventory();
  const [range, setRange] = useState<Range>(7);

  const data = useMemo(() => {
    const today = last7[last7.length - 1]?.ts ?? 0;
    const from = today - (range - 1) * DAY;
    const live = orders.filter((o) => o.status !== "cancelled" && o.ts >= from);
    const revenue = live.reduce((s, o) => s + o.total, 0);
    const cost = live.reduce((s, o) => s + o.items.reduce((c, i) => c + i.cost * i.qty, 0), 0);
    const unpaid = live.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);

    // 7 daily bars, or 5 bins of ~6 days for the 30-day view
    const bins = range === 7 ? 7 : 5;
    const span = range / bins;
    const series = Array.from({ length: bins }, (_, i) => {
      const start = from + Math.round(i * span) * DAY;
      const end = from + Math.round((i + 1) * span) * DAY;
      const total = live.filter((o) => o.ts >= start && o.ts < end).reduce((s, o) => s + o.total, 0);
      const d = new Date(start);
      return { key: start, total, label: range === 7 ? ["S", "M", "T", "W", "T", "F", "S"][d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}` };
    });

    const sold = new Map<string, { name: string; units: number; revenue: number }>();
    live.forEach((o) => o.items.forEach((i) => {
      const c = sold.get(i.productId) ?? { name: i.name, units: 0, revenue: 0 };
      c.units += i.qty;
      c.revenue += i.qty * i.price;
      sold.set(i.productId, c);
    }));
    const top = [...sold.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const byCat = CATEGORIES.map((c) => ({ ...c, value: products.filter((p) => p.category === c.id).reduce((s, p) => s + p.cost * p.qty, 0) })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
    const catTotal = byCat.reduce((s, c) => s + c.value, 0);

    return { count: live.length, revenue, profit: revenue - cost, unpaid, avg: live.length ? revenue / live.length : 0, series, top, byCat, catTotal };
  }, [orders, products, last7, range]);

  const max = Math.max(1, ...data.series.map((s) => s.total));
  const shades = [theme.accent, theme.warning, theme.success, theme.inkSoft, theme.danger, theme.textSecondary];

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Reports" subtitle="Cancelled orders are excluded" />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        <View style={{ flexDirection: "row", gap: Spacing.two }}>
          <Chip label="Last 7 days" selected={range === 7} onPress={() => setRange(7)} />
          <Chip label="Last 30 days" selected={range === 30} onPress={() => setRange(30)} />
        </View>

        {data.count === 0 ? (
          <EmptyState icon="bar-chart-outline" title="No sales in this period" body="Place some orders and your reports will fill in." />
        ) : (
          <>
            <View style={{ backgroundColor: Colors.hero, borderRadius: Radius.xl, padding: Spacing.four - 4, gap: Spacing.three }}>
              <View>
                <ThemedText type="label" style={{ color: Colors.brass }}>Revenue</ThemedText>
                <ThemedText style={{ fontFamily: Fonts.serif, fontSize: 40, lineHeight: 46, fontWeight: "700", color: Colors.heroText }}>{formatMoney(data.revenue, { decimals: false })}</ThemedText>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 110 }}>
                {data.series.map((s) => (
                  <View key={s.key} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 5 }}>
                    <View style={{ width: "100%", height: Math.max(4, (s.total / max) * 84), borderRadius: 3, backgroundColor: s.total === max ? Colors.brass : "rgba(255,248,236,0.3)" }} />
                    <ThemedText type="caption" style={{ color: Colors.heroMuted, fontSize: 10, fontWeight: "700" }}>{s.label}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.three }}>
              {[
                { l: "Gross profit", v: compactMoney(data.profit), s: `${data.revenue ? Math.round((data.profit / data.revenue) * 100) : 0}% margin`, c: theme.success },
                { l: "Orders", v: num(data.count), s: `Avg ${compactMoney(data.avg)}`, c: theme.accent },
                { l: "Unpaid", v: compactMoney(data.unpaid), s: "Still to collect", c: theme.warning },
                { l: "Stock at cost", v: compactMoney(products.reduce((s, p) => s + p.cost * p.qty, 0)), s: `${products.length} items`, c: theme.accent },
              ].map((k) => (
                <Card key={k.l} style={{ flex: 1, minWidth: "46%", gap: 4 }}>
                  <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: k.c, marginBottom: 4 }} />
                  <ThemedText type="label" themeColor="textSecondary">{k.l}</ThemedText>
                  <ThemedText type="large">{k.v}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">{k.s}</ThemedText>
                </Card>
              ))}
            </View>

            <View>
              <SectionHeader title="Top sellers" />
              <Card style={{ gap: Spacing.three }}>
                {data.top.map((t, i) => (
                  <View key={t.name} style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: Spacing.two }}>
                      <ThemedText type="smallBold" numberOfLines={1} style={{ flex: 1 }}>{i + 1}. {t.name}</ThemedText>
                      <ThemedText type="smallBold">{formatMoney(t.revenue, { decimals: false })}</ThemedText>
                    </View>
                    <ProgressBar value={t.revenue / data.top[0].revenue} height={6} />
                    <ThemedText type="caption" themeColor="textSecondary">{num(t.units)} units sold</ThemedText>
                  </View>
                ))}
              </Card>
            </View>
          </>
        )}

        {data.byCat.length > 0 && (
          <View>
            <SectionHeader title="Stock value by category" />
            <Card style={{ gap: Spacing.three }}>
              <View style={{ flexDirection: "row", height: 14, borderRadius: 3, overflow: "hidden" }}>
                {data.byCat.map((c, i) => <View key={c.id} style={{ flex: c.value, backgroundColor: shades[i % shades.length] }} />)}
              </View>
              {data.byCat.map((c, i) => (
                <View key={c.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: shades[i % shades.length] }} />
                  <ThemedText type="small" style={{ flex: 1 }}>{c.label}</ThemedText>
                  <ThemedText type="smallBold">{compactMoney(c.value)}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" style={{ width: 38, textAlign: "right" }}>{Math.round((c.value / data.catTotal) * 100)}%</ThemedText>
                </View>
              ))}
            </Card>
          </View>
        )}
      </View>
    </Container>
  );
}
