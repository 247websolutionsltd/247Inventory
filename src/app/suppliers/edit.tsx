import Button from "@/components/button";
import Container from "@/components/custom-container";
import Input from "@/components/custom-input";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { PAD, Spacing } from "@/constants/theme";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import type { Supplier } from "@/services/inventory";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

export default function EditSupplier() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inv = useInventory();
  const s = inv.getSupplier(id);

  if (id && !inv.suppliersReady) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Edit supplier" />
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>Loading supplier…</ThemedText>
      </Container>
    );
  }
  if (id && !s) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Edit supplier" />
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>This supplier no longer exists.</ThemedText>
        <View style={{ paddingHorizontal: PAD }}><Button title="Back to suppliers" onPress={() => router.back()} /></View>
      </Container>
    );
  }

  return <SupplierForm existing={s} />;
}

function SupplierForm({ existing: s }: { existing?: Supplier }) {
  const inv = useInventory();
  const theme = useTheme();
  const [name, setName] = useState(s?.name ?? "");
  const [contact, setContact] = useState(s?.contact ?? "");
  const [phone, setPhone] = useState(s?.phone ?? "");
  const [email, setEmail] = useState(s?.email ?? "");
  const [address, setAddress] = useState(s?.address ?? "");
  const [notes, setNotes] = useState(s?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError("Enter the supplier's name.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look right.");
    setError(null);
    setSaving(true);
    const res = await inv.saveSupplier(s?.id ?? null, { name: name.trim(), contact: contact.trim(), phone: phone.trim(), email: email.trim() || undefined, address: address.trim() || undefined, notes: notes.trim() || undefined });
    setSaving(false);
    if (!res.ok) return Alert.alert("Couldn't save", res.error);
    router.back();
  };

  return (
    <Container edges={["top", "bottom"]}>
      <Header title={s ? "Edit supplier" : "Add supplier"} />
      <View style={{ paddingHorizontal: PAD }}>
        <Input label="Company name" icon="business-outline" placeholder="e.g. Lagos Fresh Distributors" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input label="Contact person" icon="person-outline" value={contact} onChangeText={setContact} autoCapitalize="words" />
        <Input label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Address" icon="location-outline" value={address} onChangeText={setAddress} />
        <Input label="Notes" desc placeholder="Delivery days, payment terms…" value={notes} onChangeText={setNotes} />
        {error ? <ThemedText type="caption" style={{ color: theme.danger }}>{error}</ThemedText> : null}
        <Button title={s ? "Save changes" : "Add supplier"} onPress={save} loading={saving} style={{ marginTop: Spacing.four }} />
      </View>
    </Container>
  );
}
