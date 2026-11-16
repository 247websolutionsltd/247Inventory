import Button from "@/components/button";
import Container from "@/components/custom-container";
import Input, { ChipField } from "@/components/custom-input";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { SectionHeader } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { CATEGORIES, CategoryId, UNITS } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import type { Product } from "@/services/inventory";
import { generateSku } from "@/services/inventory";
import { parseAmount } from "@/lib/format";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

const toText = (n: number | undefined) => (n === undefined || n === 0 ? "" : String(n));

/** Create (no `id`) or edit (`?id=`) an inventory item. */
export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inv = useInventory();
  const existing = inv.getProduct(id);

  if (id && !inv.productsReady) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Edit item" />
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>Loading item…</ThemedText>
      </Container>
    );
  }
  if (id && !existing) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Edit item" />
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>This item no longer exists.</ThemedText>
        <View style={{ paddingHorizontal: PAD }}><Button title="Back to inventory" onPress={() => router.back()} /></View>
      </Container>
    );
  }

  return <ProductForm existing={existing} />;
}

function ProductForm({ existing }: { existing?: Product }) {
  const inv = useInventory();
  const theme = useTheme();
  const editing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? "groceries");
  const [sku, setSku] = useState(existing?.sku ?? "");
  const [unit, setUnit] = useState<string>(existing?.unit ?? "pcs");
  const [price, setPrice] = useState(toText(existing?.price));
  const [cost, setCost] = useState(toText(existing?.cost));
  const [qty, setQty] = useState("");
  const [reorder, setReorder] = useState(toText(existing?.reorderLevel) || "10");
  const [supplierId, setSupplierId] = useState<string>(existing?.supplierId ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError("Give the item a name.");
    if (parseAmount(price) <= 0) return setError("Enter a selling price above zero.");
    if (parseAmount(cost) < 0) return setError("Cost price can't be negative.");
    const openingQty = parseAmount(qty);
    const reorderLevel = parseAmount(reorder);
    if (!editing && (!Number.isInteger(openingQty) || openingQty < 0)) return setError("Opening stock must be a whole number of zero or more.");
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) return setError("Reorder level must be a whole number of zero or more.");
    setError(null);
    setSaving(true);
    const supplier = inv.getSupplier(supplierId);
    const base = {
      name: name.trim(),
      sku: sku.trim().toUpperCase() || generateSku(category),
      category,
      unit,
      price: parseAmount(price),
      cost: parseAmount(cost),
      reorderLevel,
      supplierId: supplier?.id ?? (editing ? "" : undefined),
      supplierName: supplier?.name ?? (editing ? "" : undefined),
      location: location.trim() || (editing ? "" : undefined),
      notes: notes.trim() || (editing ? "" : undefined),
    };
    const res = editing ? await inv.editProduct(existing!.id, base) : await inv.addProduct({ ...base, qty: openingQty });
    setSaving(false);
    if (!res.ok) return Alert.alert("Couldn't save item", res.error);
    router.back();
  };

  return (
    <Container edges={["top", "bottom"]}>
      <Header title={editing ? "Edit item" : "Add item"} subtitle={editing ? existing!.sku : "New product in your inventory"} />
      <View style={{ paddingHorizontal: PAD }}>
        <Input label="Item name" icon="pricetag-outline" placeholder="e.g. Basmati Rice 5kg" value={name} onChangeText={setName} autoCapitalize="words" />
        <ChipField label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
        <Input label="SKU" icon="barcode-outline" placeholder="Leave blank to auto-generate" value={sku} onChangeText={setSku} autoCapitalize="characters" hint="A unique code you use to find this item quickly." />
        <ChipField label="Unit" options={UNITS.map((u) => ({ id: u, label: u }))} value={unit} onChange={setUnit} />

        <SectionHeader title="Pricing & stock" style={{ marginTop: Spacing.three }} />
        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          <View style={{ flex: 1 }}><Input label="Selling price" prefix="₦" number placeholder="0" value={price} onChangeText={setPrice} /></View>
          <View style={{ flex: 1 }}><Input label="Cost price" prefix="₦" number placeholder="0" value={cost} onChangeText={setCost} /></View>
        </View>
        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          {!editing && <View style={{ flex: 1 }}><Input label="Opening stock" number placeholder="0" value={qty} onChangeText={setQty} suffix={unit} /></View>}
          <View style={{ flex: 1 }}><Input label="Reorder level" number placeholder="10" value={reorder} onChangeText={setReorder} suffix={unit} /></View>
        </View>
        {editing && (
          <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
            To change the quantity on hand, use Add stock or Remove on the item page so the change is recorded.
          </ThemedText>
        )}

        <SectionHeader title="Where it comes from" style={{ marginTop: Spacing.four }} />
        {inv.suppliers.length > 0 ? (
          <ChipField label="Supplier" options={[{ id: "", label: "None" }, ...inv.suppliers.map((s) => ({ id: s.id, label: s.name }))]} value={supplierId} onChange={setSupplierId} />
        ) : (
          <ThemedText type="caption" themeColor="textSecondary">No suppliers yet. Add some from More › Suppliers.</ThemedText>
        )}
        <Input label="Shelf / location" icon="location-outline" placeholder="e.g. Aisle 2, Shelf B" value={location} onChangeText={setLocation} />
        <Input label="Notes" desc placeholder="Anything your team should know" value={notes} onChangeText={setNotes} />

        {error ? <ThemedText type="caption" style={{ color: theme.danger }}>{error}</ThemedText> : null}
        <Button title={editing ? "Save changes" : "Add to inventory"} onPress={save} loading={saving} style={{ marginTop: Spacing.four }} />
      </View>
    </Container>
  );
}
