import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header, { RoundButton } from "@/components/header";
import { ProductRow } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Card, DetailRow, EmptyState, SectionHeader } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { useInventory } from "@/context/InventoryContext";
import { openExternalLink } from "@/lib/links";
import { go, goWith } from "@/lib/nav";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, View } from "react-native";

export default function SupplierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inv = useInventory();
  const s = inv.getSupplier(id);

  if (!s) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Supplier" />
        <EmptyState icon="business-outline" title="Supplier not found">
          <Button title="Back to suppliers" onPress={() => router.replace("/suppliers" as never)} />
        </EmptyState>
      </Container>
    );
  }

  const items = inv.products.filter((p) => p.supplierId === s.id);
  const remove = () =>
    Alert.alert("Delete supplier?", "Items keep their saved supplier details. The supplier will be removed from your directory.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { const r = await inv.removeSupplier(s.id); if (!r.ok) return Alert.alert("Couldn't delete", r.error); router.replace("/suppliers" as never); } },
    ]);

  return (
    <Container edges={["top", "bottom"]}>
      <Header title={s.name} subtitle="Supplier" right={<View style={{ flexDirection: "row", gap: Spacing.two }}><RoundButton icon="create-outline" label="Edit" onPress={() => goWith("/suppliers/edit", { id: s.id })} /><RoundButton icon="trash-outline" label="Delete" onPress={remove} /></View>} />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          {s.phone ? <Button title="Call" iconLeft="call-outline" variant="soft" onPress={() => openExternalLink(`tel:${s.phone.replace(/\s/g, "")}`, "the phone app")} style={{ flex: 1 }} /> : null}
          {s.email ? <Button title="Email" iconLeft="mail-outline" variant="secondary" onPress={() => openExternalLink(`mailto:${s.email}`, "the email app")} style={{ flex: 1 }} /> : null}
        </View>
        <Card style={{ paddingVertical: Spacing.two }}>
          <DetailRow label="Contact" value={s.contact || "Not set"} />
          <DetailRow label="Phone" value={s.phone || "Not set"} />
          <DetailRow label="Email" value={s.email || "Not set"} />
          <DetailRow label="Address" value={s.address || "Not set"} last={!s.notes} />
          {s.notes ? <DetailRow label="Notes" value={s.notes} last /> : null}
        </Card>
        <View>
          <SectionHeader title={`Items supplied (${items.length})`} />
          {items.length === 0 ? (
            <Card dashed><ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>No items linked to this supplier yet.</ThemedText></Card>
          ) : (
            <Card style={{ paddingVertical: 0 }}>
              {items.map((p, i) => <ProductRow key={p.id} product={p} last={i === items.length - 1} onPress={() => go(`/inventory/${p.id}`)} />)}
            </Card>
          )}
        </View>
      </View>
    </Container>
  );
}
