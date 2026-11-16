import { Radius, Spacing } from "@/constants/theme";
import { categoryOf, ORDER_STATUS_META, OrderStatus } from "@/data/catalog";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney, timeAgo } from "@/lib/format";
import { STOCK_LABEL, stockStatus } from "@/lib/stock";
import type { Order, Product } from "@/services/inventory";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";
import { IconBadge, ProgressBar, Stamp, Tone } from "./ui";

export const ORDER_TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  processing: "accent",
  ready: "accent",
  delivered: "success",
  cancelled: "danger",
};

export const STOCK_TONE = { in: "success", low: "warning", out: "danger" } as const;

/** Inventory list row: category tile, name + SKU, level bar, quantity and a status stamp. */
export function ProductRow({ product, onPress, last = false }: { product: Product; onPress?: () => void; last?: boolean }) {
  const theme = useTheme();
  const status = stockStatus(product);
  const cat = categoryOf(product.category);
  const tone = status === "out" ? theme.danger : status === "low" ? theme.warning : theme.accent;
  const target = Math.max(product.reorderLevel * 3, product.qty, 1);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 2, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line }}>
      <IconBadge icon={cat.icon} size={44} bg={status === "out" ? theme.dangerSurface : status === "low" ? theme.warningSurface : undefined} color={tone} />
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText type="smallBold" numberOfLines={1}>{product.name}</ThemedText>
        <ThemedText type="mono" themeColor="textSecondary">{product.sku}{product.location ? ` · ${product.location}` : ""}</ThemedText>
        <ProgressBar value={product.qty / target} color={tone} height={4} />
      </View>
      <View style={{ alignItems: "flex-end", gap: 4, minWidth: 84 }}>
        <ThemedText type="bold" style={{ fontVariant: ["tabular-nums"] }}>
          {product.qty.toLocaleString("en-NG")} <ThemedText type="caption" themeColor="textSecondary">{product.unit}</ThemedText>
        </ThemedText>
        {status === "in" ? <ThemedText type="caption" themeColor="textSecondary">{formatMoney(product.price, { decimals: false })}</ThemedText> : <Stamp label={STOCK_LABEL[status]} tone={STOCK_TONE[status]} />}
      </View>
    </TouchableOpacity>
  );
}

/** Order list row: number, customer, items summary, total, status stamp. */
export function OrderRow({ order, onPress, last = false }: { order: Order; onPress?: () => void; last?: boolean }) {
  const theme = useTheme();
  const meta = ORDER_STATUS_META[order.status];
  const units = order.items.reduce((s, i) => s + i.qty, 0);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 2, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line }}>
      <IconBadge icon={meta.icon} size={44} color={order.status === "cancelled" ? theme.danger : theme.accent} bg={order.status === "cancelled" ? theme.dangerSurface : undefined} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ThemedText type="mono" style={{ fontWeight: "800" }}>{order.number}</ThemedText>
          {!order.paid && order.status !== "cancelled" && <Ionicons name="alert-circle" size={13} color={theme.warning} />}
        </View>
        <ThemedText type="smallBold" numberOfLines={1}>{order.customer}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {units} {units === 1 ? "unit" : "units"} · {timeAgo(order.ts)}
        </ThemedText>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <ThemedText type="bold" style={{ fontVariant: ["tabular-nums"] }}>{formatMoney(order.total, { decimals: false })}</ThemedText>
        <Stamp label={meta.label} tone={ORDER_TONE[order.status]} />
      </View>
    </TouchableOpacity>
  );
}

/** Small bordered radius token reused where a row needs an inset panel. */
export const insetPanel = (bg: string, line: string) => ({ backgroundColor: bg, borderRadius: Radius.md, borderWidth: 1, borderColor: line, padding: Spacing.three });
