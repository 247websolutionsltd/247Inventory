import Button from "@/components/button";
import Container from "@/components/custom-container";
import Input, { ChipField } from "@/components/custom-input";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, IconBadge, QtyStepper, SearchBar, SectionHeader, Toggle } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { categoryOf, CHANNELS, Channel } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney } from "@/lib/format";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";

export default function NewOrder() {
  const theme = useTheme();
  const inv = useInventory();
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("walk-in");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paid, setPaid] = useState(true);
  const [staffId, setStaffId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lines = useMemo(() => inv.products.filter((p) => cart[p.id] > 0).map((p) => ({ p, qty: cart[p.id] })), [inv.products, cart]);
  const total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const units = lines.reduce((s, l) => s + l.qty, 0);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return inv.products
      .filter((p) => p.qty > 0 && !cart[p.id] && (!needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle)))
      .slice(0, needle ? 8 : 5);
  }, [inv.products, q, cart]);

  const setQty = (id: string, n: number) => setCart((c) => {
    const next = { ...c };
    if (n <= 0) delete next[id];
    else next[id] = n;
    return next;
  });

  const place = async () => {
    if (!lines.length) return setError("Add at least one item to this order.");
    setError(null);
    setSaving(true);
    const staff = inv.getStaff(staffId);
    const res = await inv.placeOrder({
      customer,
      phone,
      channel,
      paid,
      note,
      assignedId: staff?.id,
      assignedTo: staff?.name,
      lines: lines.map((l) => ({ productId: l.p.id, qty: l.qty })),
    });
    setSaving(false);
    if (!res.ok) return Alert.alert("Couldn't place order", res.error);
    router.replace(`/orders/${res.id}` as never);
  };

  const activeStaff = inv.staff.filter((s) => s.active);

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="New order" subtitle="Stock is deducted when you place it" />
      <View style={{ paddingHorizontal: PAD }}>
        <SectionHeader title="1 · Customer" />
        <Input label="Customer name" icon="person-outline" placeholder="Leave blank for walk-in" value={customer} onChangeText={setCustomer} autoCapitalize="words" />
        <Input label="Phone (optional)" icon="call-outline" placeholder="0803 000 0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <ChipField label="Channel" options={CHANNELS} value={channel} onChange={setChannel} />

        <SectionHeader title="2 · Items" style={{ marginTop: Spacing.four }} />
        <SearchBar value={q} onChangeText={setQ} placeholder="Find an item to add" />

        {results.length > 0 && (
          <Card style={{ paddingVertical: 0, marginTop: Spacing.three }}>
            {results.map((p, i) => (
              <TouchableOpacity key={p.id} onPress={() => setQty(p.id, 1)} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 4, borderBottomWidth: i === results.length - 1 ? 0 : 1, borderBottomColor: theme.line }}>
                <IconBadge icon={categoryOf(p.category).icon} size={36} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" numberOfLines={1}>{p.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">{formatMoney(p.price, { decimals: false })} · {p.qty} {p.unit} left</ThemedText>
                </View>
                <IconBadge icon="add" size={32} bg={theme.cta} color={theme.ctaText} />
              </TouchableOpacity>
            ))}
          </Card>
        )}
        {q && results.length === 0 && !inv.products.some((p) => cart[p.id] && p.name.toLowerCase().includes(q.trim().toLowerCase())) ? (
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>No available items match &quot;{q}&quot;.</ThemedText>
        ) : null}

        <View style={{ marginTop: Spacing.four }}>
          {lines.length === 0 ? (
            <Card dashed>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>Search above and tap an item to add it to the order.</ThemedText>
            </Card>
          ) : (
            <Card style={{ paddingVertical: 0 }}>
              {lines.map(({ p, qty }, i) => (
                <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.three - 4, borderBottomWidth: i === lines.length - 1 ? 0 : 1, borderBottomColor: theme.line }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold" numberOfLines={1}>{p.name}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">{formatMoney(p.price * qty, { decimals: false })} · max {p.qty}</ThemedText>
                  </View>
                  <QtyStepper small value={qty} min={0} max={p.qty} onChange={(n) => setQty(p.id, n)} />
                </View>
              ))}
            </Card>
          )}
        </View>

        <SectionHeader title="3 · Payment & handling" style={{ marginTop: Spacing.four }} />
        <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">Paid in full</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Turn off if the customer will pay later</ThemedText>
          </View>
          <Toggle value={paid} onValueChange={setPaid} label="Paid in full" />
        </Card>
        {activeStaff.length > 0 && (
          <ChipField label="Assign to" options={[{ id: "", label: "Unassigned" }, ...activeStaff.map((s) => ({ id: s.id, label: s.name.split(" ")[0] }))]} value={staffId} onChange={setStaffId} />
        )}
        <Input label="Note" desc placeholder="Delivery address, special requests…" value={note} onChangeText={setNote} />

        {error ? <ThemedText type="caption" style={{ color: theme.danger }}>{error}</ThemedText> : null}

        <Card alt style={{ marginTop: Spacing.three, gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <ThemedText type="label" themeColor="textSecondary">Order total · {units} {units === 1 ? "unit" : "units"}</ThemedText>
            <ThemedText type="large">{formatMoney(total, { decimals: false })}</ThemedText>
          </View>
        </Card>
        <Button title="Place order" icon="checkmark" onPress={place} loading={saving} disabled={!lines.length} style={{ marginTop: Spacing.three }} />
      </View>
    </Container>
  );
}
