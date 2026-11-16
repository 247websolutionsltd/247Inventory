import Avatar from "@/components/avatar";
import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header, { RoundButton } from "@/components/header";
import { OrderRow } from "@/components/rows";
import { ThemedText } from "@/components/themed-text";
import { Card, DetailRow, EmptyState, SectionHeader, Stamp, Toggle } from "@/components/ui";
import { Colors, PAD, Radius, Spacing } from "@/constants/theme";
import { ROLE_ICON } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { compactMoney, shortDate } from "@/lib/format";
import { openExternalLink } from "@/lib/links";
import { go, goWith } from "@/lib/nav";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, View } from "react-native";

export default function StaffDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inv = useInventory();
  const s = inv.getStaff(id);

  if (!s) {
    return (
      <Container edges={["top", "bottom"]}>
        <Header title="Team member" />
        <EmptyState icon="people-outline" title="Team member not found">
          <Button title="Back to team" onPress={() => router.replace("/(tabs)/staff" as never)} />
        </EmptyState>
      </Container>
    );
  }

  const mine = inv.orders.filter((o) => o.assignedId === s.id);
  const sales = mine.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);

  const setActive = async (active: boolean) => {
    const result = await inv.toggleStaffActive(s.id, active);
    if (!result.ok) Alert.alert("Couldn't update team member", result.error);
  };

  const remove = () =>
    Alert.alert("Remove team member?", `${s.name} will be removed. Orders they handled keep their name.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const res = await inv.removeStaff(s.id);
          if (!res.ok) return Alert.alert("Couldn't remove", res.error);
          router.replace("/(tabs)/staff" as never);
        },
      },
    ]);

  return (
    <Container edges={["top", "bottom"]}>
      <Header
        title={s.name}
        subtitle={s.role}
        right={
          <View style={{ flexDirection: "row", gap: Spacing.two }}>
            <RoundButton icon="create-outline" label="Edit" onPress={() => goWith("/staff/edit", { id: s.id })} />
            <RoundButton icon="trash-outline" label="Remove" onPress={remove} />
          </View>
        }
      />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        <View style={{ backgroundColor: Colors.hero, borderRadius: Radius.xl, padding: Spacing.four - 4, flexDirection: "row", alignItems: "center", gap: Spacing.three }}>
          <Avatar name={s.name} size={64} onHero />
          <View style={{ flex: 1, gap: 6 }}>
            <ThemedText style={{ color: Colors.heroText, fontSize: 20, fontWeight: "700" }} numberOfLines={1}>{s.name}</ThemedText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={ROLE_ICON[s.role]} size={14} color={Colors.brass} />
              <ThemedText type="small" style={{ color: Colors.heroMuted }}>{s.role} · {s.shift}</ThemedText>
            </View>
            <Stamp label={s.active ? "Active" : "Off"} tone={s.active ? "success" : "neutral"} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          {s.phone ? <Button title="Call" iconLeft="call-outline" variant="soft" onPress={() => openExternalLink(`tel:${s.phone.replace(/\s/g, "")}`, "the phone app")} style={{ flex: 1 }} /> : null}
          {s.email ? <Button title="Email" iconLeft="mail-outline" variant="secondary" onPress={() => openExternalLink(`mailto:${s.email}`, "the email app")} style={{ flex: 1 }} /> : null}
        </View>

        <View style={{ flexDirection: "row", gap: Spacing.three }}>
          <Card style={{ flex: 1, gap: 4 }}>
            <ThemedText type="label" themeColor="textSecondary">Orders handled</ThemedText>
            <ThemedText type="large">{mine.length}</ThemedText>
          </Card>
          <Card style={{ flex: 1, gap: 4 }}>
            <ThemedText type="label" themeColor="textSecondary">Sales value</ThemedText>
            <ThemedText type="large">{compactMoney(sales)}</ThemedText>
          </Card>
        </View>

        <View>
          <SectionHeader title="Details" />
          <Card style={{ paddingVertical: Spacing.two }}>
            <DetailRow label="Role" value={s.role} />
            <DetailRow label="Shift" value={s.shift} />
            <DetailRow label="Phone" value={s.phone || "Not set"} />
            <DetailRow label="Email" value={s.email || "Not set"} />
            <DetailRow label="Joined" value={s.joined ? shortDate(s.joined) : "—"} last={!s.note} />
            {s.note ? <DetailRow label="Notes" value={s.note} last /> : null}
          </Card>
          <Card style={{ marginTop: Spacing.three, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">Currently active</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">Inactive staff can&apos;t be assigned new orders</ThemedText>
            </View>
            <Toggle value={s.active} label="Active" onValueChange={setActive} />
          </Card>
        </View>

        <View>
          <SectionHeader title="Recent orders" />
          {mine.length === 0 ? (
            <Card dashed><ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>No orders assigned yet.</ThemedText></Card>
          ) : (
            <Card style={{ paddingVertical: 0 }}>
              {mine.slice(0, 5).map((o, i, a) => (
                <OrderRow key={o.id} order={o} last={i === a.length - 1} onPress={() => go(`/orders/${o.id}`)} />
              ))}
            </Card>
          )}
        </View>
      </View>
    </Container>
  );
}
