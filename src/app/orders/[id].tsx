import Avatar from "@/components/avatar";
import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ORDER_TONE } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Card, DetailRow, EmptyState, SectionHeader, Stamp } from "@/components/ui";
import { PAD, Radius, Spacing } from "@/constants/theme";
import { CHANNELS, ORDER_FLOW, ORDER_STATUS_META } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney, fullDate } from "@/lib/format";
import { openExternalLink } from "@/lib/links";
import { go } from "@/lib/nav";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

export default function OrderDetail() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const inv = useInventory();
  const order = inv.getOrder(id);
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Order" />
        <EmptyState icon="receipt-outline" title="Order not found">
          <Button title="Back to orders" onPress={() => router.replace("/(tabs)/orders" as never)} />
        </EmptyState>
      </Container>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const cancelled = order.status === "cancelled";
  const final = cancelled || order.status === "delivered";
  const stepIndex = ORDER_FLOW.indexOf(order.status);
  const channel = CHANNELS.find((c) => c.id === order.channel);
  const staff = inv.getStaff(order.assignedId);
  const cost = order.items.reduce((s, i) => s + i.cost * i.qty, 0);

  const advance = async () => {
    if (!meta.next || busy) return;
    setBusy(true);
    try {
      const res = await inv.updateOrderStatus(order.id, meta.next);
      if (!res.ok) Alert.alert("Couldn't update order", res.error);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () =>
    Alert.alert("Cancel this order?", "The items will go back into stock. This can't be undone.", [
      { text: "Keep order", style: "cancel" },
      {
        text: "Cancel order",
        style: "destructive",
        onPress: async () => {
          if (busy) return;
          setBusy(true);
          try {
            const res = await inv.updateOrderStatus(order.id, "cancelled");
            if (!res.ok) Alert.alert("Couldn't cancel", res.error);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  const togglePaid = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await inv.markPaid(order.id, !order.paid);
      if (!res.ok) Alert.alert("Couldn't update payment", res.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container edges={["top", "bottom"]}>
      <Header title={order.number} subtitle={fullDate(order.ts)} right={<Stamp label={meta.label} tone={ORDER_TONE[order.status]} />} />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        {/* progress */}
        {cancelled ? (
          <Card alt style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, backgroundColor: theme.dangerSurface }}>
            <Ionicons name="close-circle" size={26} color={theme.danger} />
            <ThemedText type="small" style={{ flex: 1, color: theme.danger }}>This order was cancelled and its items were returned to stock.</ThemedText>
          </Card>
        ) : (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {ORDER_FLOW.map((s, i) => {
                const done = i <= stepIndex;
                const m = ORDER_STATUS_META[s];
                return (
                  <View key={s} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
                      <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? "transparent" : i <= stepIndex ? theme.accent : theme.line }} />
                      <View style={{ width: 28, height: 28, borderRadius: Radius.sm - 2, backgroundColor: done ? theme.accent : theme.cardAlt, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={done ? "checkmark" : m.icon} size={15} color={done ? theme.ctaText : theme.inkSoft} />
                      </View>
                      <View style={{ flex: 1, height: 2, backgroundColor: i === ORDER_FLOW.length - 1 ? "transparent" : i < stepIndex ? theme.accent : theme.line }} />
                    </View>
                    <ThemedText type="caption" style={{ fontWeight: i === stepIndex ? "800" : "500", color: done ? theme.text : theme.textSecondary }}>{m.label}</ThemedText>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {!final && meta.action && <Button title={meta.action} icon="arrow-forward" onPress={advance} loading={busy} disabled={busy} />}

        {/* customer */}
        <View>
          <SectionHeader title="Customer" />
          <Card style={{ paddingVertical: Spacing.two }}>
            <DetailRow label="Name" value={order.customer} bold />
            {order.phone ? <DetailRow label="Phone" value={order.phone} /> : null}
            <DetailRow label="Channel" value={channel?.label ?? order.channel} last={!order.note} />
            {order.note ? <DetailRow label="Note" value={order.note} last /> : null}
          </Card>
          {order.phone ? (
            <View style={{ marginTop: Spacing.three }}>
              <Button title={`Call ${order.customer.split(" ")[0]}`} variant="secondary" small iconLeft="call-outline" onPress={() => openExternalLink(`tel:${order.phone!.replace(/\s/g, "")}`, "the phone app")} />
            </View>
          ) : null}
        </View>

        {/* items */}
        <View>
          <SectionHeader title={`Items (${order.items.length})`} />
          <Card dashed style={{ paddingVertical: Spacing.two }}>
            {order.items.map((i) => (
              <View key={i.productId + i.name} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: 9 }}>
                <ThemedText type="mono" style={{ width: 34, fontWeight: "800" }}>{i.qty}×</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" numberOfLines={1} onPress={() => inv.getProduct(i.productId) && go(`/inventory/${i.productId}`)}>{i.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">{formatMoney(i.price, { decimals: false })} each</ThemedText>
                </View>
                <ThemedText type="bold">{formatMoney(i.price * i.qty, { decimals: false })}</ThemedText>
              </View>
            ))}
            <View style={{ height: 1.5, backgroundColor: theme.text, opacity: 0.8, marginVertical: Spacing.two }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingBottom: Spacing.one }}>
              <ThemedText type="label" themeColor="textSecondary">Total</ThemedText>
              <ThemedText type="large">{formatMoney(order.total, { decimals: false })}</ThemedText>
            </View>
            {!cancelled && <ThemedText type="caption" themeColor="success" style={{ textAlign: "right" }}>Gross profit {formatMoney(order.total - cost, { decimals: false })}</ThemedText>}
          </Card>
        </View>

        {/* payment & staff */}
        <View>
          <SectionHeader title="Payment & handling" />
          <Card style={{ gap: Spacing.three }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.two }}>
                <Stamp label={order.paid ? "Paid" : "Unpaid"} tone={order.paid ? "success" : "warning"} icon={order.paid ? "checkmark" : "time-outline"} />
              </View>
              {!cancelled && <Button small variant="soft" title={order.paid ? "Mark unpaid" : "Mark as paid"} onPress={togglePaid} loading={busy} disabled={busy} />}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three }}>
              {staff ? <Avatar name={staff.name} size={38} /> : <Avatar name="?" size={38} dim />}
              <View style={{ flex: 1 }}>
                <ThemedText type="caption" themeColor="textSecondary">Handled by</ThemedText>
                <ThemedText type="smallBold">{staff?.name ?? order.assignedTo ?? "Unassigned"}</ThemedText>
              </View>
              {staff ? <Button small variant="ghost" title="View" onPress={() => go(`/staff/${staff.id}`)} /> : null}
            </View>
          </Card>
        </View>

        {!final && <Button title="Cancel order" variant="danger" iconLeft="close-circle-outline" onPress={cancel} disabled={busy} />}
      </View>
    </Container>
  );
}
