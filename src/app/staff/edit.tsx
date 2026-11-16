import Button from "@/components/button";
import Container from "@/components/custom-container";
import Input, { ChipField } from "@/components/custom-input";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { PAD, Spacing } from "@/constants/theme";
import { Shift, SHIFTS, StaffRole, STAFF_ROLES } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import type { StaffMember } from "@/services/inventory";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

export default function EditStaff() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const inv = useInventory();
  const existing = inv.getStaff(id);

  if (id && !inv.staffReady) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Edit team member" />
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>Loading team member…</ThemedText>
      </Container>
    );
  }
  if (id && !existing) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Edit team member" />
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", padding: Spacing.five }}>This team member no longer exists.</ThemedText>
        <View style={{ paddingHorizontal: PAD }}><Button title="Back to team" onPress={() => router.back()} /></View>
      </Container>
    );
  }

  return <StaffForm existing={existing} />;
}

function StaffForm({ existing }: { existing?: StaffMember }) {
  const inv = useInventory();
  const theme = useTheme();
  const [name, setName] = useState(existing?.name ?? "");
  const [role, setRole] = useState<StaffRole>(existing?.role ?? "Sales");
  const [shift, setShift] = useState<Shift>(existing?.shift ?? "Full day");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError("Enter the team member's name.");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look right.");
    setError(null);
    setSaving(true);
    const res = await inv.saveStaff(existing?.id ?? null, { name: name.trim(), role, shift, phone: phone.trim(), email: email.trim() || undefined, note: note.trim() || undefined, active: existing?.active ?? true });
    setSaving(false);
    if (!res.ok) return Alert.alert("Couldn't save", res.error);
    router.back();
  };

  return (
    <Container edges={["top", "bottom"]}>
      <Header title={existing ? "Edit team member" : "Add team member"} subtitle="Staff records help you assign orders and plan shifts" />
      <View style={{ paddingHorizontal: PAD }}>
        <Input label="Full name" icon="person-outline" placeholder="e.g. Tunde Bello" value={name} onChangeText={setName} autoCapitalize="words" />
        <ChipField label="Role" options={STAFF_ROLES.map((r) => ({ id: r, label: r }))} value={role} onChange={setRole} />
        <ChipField label="Shift" options={SHIFTS.map((r) => ({ id: r, label: r }))} value={shift} onChange={setShift} />
        <Input label="Phone" icon="call-outline" placeholder="0803 000 0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="Email (optional)" icon="mail-outline" placeholder="name@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Notes" desc placeholder="Certifications, availability…" value={note} onChangeText={setNote} />
        {error ? <ThemedText type="caption" style={{ color: theme.danger }}>{error}</ThemedText> : null}
        <Button title={existing ? "Save changes" : "Add to team"} onPress={save} loading={saving} style={{ marginTop: Spacing.four }} />
      </View>
    </Container>
  );
}
