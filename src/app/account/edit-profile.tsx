import Avatar from "@/components/avatar";
import Button from "@/components/button";
import Container from "@/components/custom-container";
import Input, { ChipField } from "@/components/custom-input";
import Header from "@/components/header";
import { PAD, Spacing } from "@/constants/theme";
import { BUSINESS_TYPES } from "@/data/catalog";
import { useAuth } from "@/context/PageContext";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function EditProfile() {
  const { owner, updateOwner } = useAuth();
  const [business, setBusiness] = useState(owner.businessName);
  const [type, setType] = useState(owner.businessType || "Retail shop");
  const [address, setAddress] = useState(owner.address);
  const [name, setName] = useState(owner.name);
  const [phone, setPhone] = useState(owner.phone);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError("Your name can't be empty.");
    if (!business.trim()) return setError("Your business needs a name.");
    setError(null);
    setSaving(true);
    try {
      await updateOwner({ name: name.trim(), phone: phone.trim(), businessName: business.trim(), businessType: type, address: address.trim() });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Business profile" />
      <View style={{ paddingHorizontal: PAD }}>
        <View style={{ alignItems: "center", marginVertical: Spacing.three }}>
          <Avatar name={business || name} size={88} />
        </View>
        <Input label="Business name" icon="storefront-outline" value={business} onChangeText={setBusiness} autoCapitalize="words" />
        <ChipField label="Business type" options={BUSINESS_TYPES.map((t) => ({ id: t, label: t }))} value={type} onChange={setType} />
        <Input label="Address" icon="location-outline" placeholder="Shop or warehouse address" value={address} onChangeText={setAddress} />
        <Input label="Your name" icon="person-outline" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input label="Email" icon="mail-outline" value={owner.email} editable={false} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={error} />
        <Button title="Save changes" onPress={save} loading={saving} style={{ marginTop: Spacing.four }} />
      </View>
    </Container>
  );
}
