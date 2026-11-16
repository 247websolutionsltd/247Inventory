import Avatar from "@/components/avatar";
import Container from "@/components/custom-container";
import { TabHeader } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, ListRow, SectionHeader, Toggle } from "@/components/ui";
import { Brand } from "@/constants/brand";
import { Colors, PAD, Radius, Spacing, TabBarSpace } from "@/constants/theme";
import { useInventory } from "@/context/InventoryContext";
import { useAppTheme, useAuth } from "@/context/PageContext";
import { go, goReplace } from "@/lib/nav";
import { logoutUser } from "@/services/auth";
import { Alert, View } from "react-native";

export default function More() {
  const { owner, user } = useAuth();
  const { themeMode, toggleThemeMode } = useAppTheme();
  const inv = useInventory();

  const signOut = () =>
    Alert.alert("Sign out?", "You'll need to sign in again to see your stockroom.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser();
            goReplace("/");
          } catch {
            Alert.alert("Couldn't sign out", "Please try again.");
          }
        },
      },
    ]);

  const sample = () =>
    Alert.alert("Load sample shop?", "This adds example items, orders, staff and suppliers to your account so you can explore the app.", [
      { text: "Cancel", style: "cancel" },
      { text: "Load", onPress: async () => { const r = await inv.loadSampleData(); if (!r.ok) Alert.alert("Couldn't load sample data", r.error); } },
    ]);

  return (
    <Container edges={["top"]} style={{ paddingBottom: TabBarSpace }}>
      <TabHeader eyebrow="Account & tools" title="More" />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.four }}>
        {/* business card */}
        <Card onPress={() => go("/account/edit-profile")} style={{ backgroundColor: Colors.hero, borderColor: Colors.hero, flexDirection: "row", alignItems: "center", gap: Spacing.three, borderRadius: Radius.xl }}>
          <Avatar name={owner.businessName || owner.name} size={56} onHero />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="label" style={{ color: Colors.brass }}>{owner.businessType || "Business"}</ThemedText>
            <ThemedText type="big" style={{ color: Colors.heroText }} numberOfLines={1}>{owner.businessName || "Name your business"}</ThemedText>
            <ThemedText type="caption" style={{ color: Colors.heroMuted }} numberOfLines={1}>{owner.name} · {owner.email}</ThemedText>
          </View>
          <ThemedText style={{ color: Colors.brass }}>›</ThemedText>
        </Card>

        <View>
          <SectionHeader title="Run the business" />
          <Card style={{ paddingVertical: 0 }}>
            <ListRow icon="bar-chart-outline" title="Reports" subtitle="Sales, profit and best sellers" onPress={() => go("/reports")} />
            <ListRow icon="notifications-outline" title="Alerts" subtitle={inv.alerts.length ? `${inv.alerts.length} need attention` : "All clear"} onPress={() => go("/alerts")} />
            <ListRow icon="business-outline" title="Suppliers" subtitle={`${inv.suppliers.length} on file`} onPress={() => go("/suppliers")} />
            <ListRow icon="time-outline" title="Activity log" subtitle="Every stock and order change" onPress={() => go("/activity")} last />
          </Card>
        </View>

        <View>
          <SectionHeader title="Preferences" />
          <Card style={{ paddingVertical: 0 }}>
            <ListRow icon={themeMode === "dark" ? "moon-outline" : "sunny-outline"} title="Dark roast mode" subtitle={themeMode === "dark" ? "Easy on the eyes after hours" : "Switch to the darker theme"} right={<Toggle value={themeMode === "dark"} onValueChange={toggleThemeMode} label="Dark mode" />} />
            <ListRow icon="alert-circle-outline" title="Low-stock alerts" subtitle="Highlight items below their reorder level" right={<Toggle value={user?.lowStockAlerts ?? true} onValueChange={inv.setLowStockAlerts} label="Low-stock alerts" />} last />
          </Card>
        </View>

        <View>
          <SectionHeader title="Support" />
          <Card style={{ paddingVertical: 0 }}>
            <ListRow icon="shield-checkmark-outline" title="Security" onPress={() => go("/account/security")} />
            <ListRow icon="help-buoy-outline" title="Help & support" onPress={() => go("/support")} />
            <ListRow icon="document-text-outline" title="Privacy policy" onPress={() => go("/account/privacy-policy")} />
            {inv.ready && inv.products.length === 0 && <ListRow icon="sparkles-outline" title="Load sample shop" subtitle="Explore with example data" onPress={sample} />}
            <ListRow icon="log-out-outline" title="Sign out" danger onPress={signOut} last />
          </Card>
        </View>

        <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: "center" }}>{Brand.name} · {Brand.tagline}</ThemedText>
      </View>
    </Container>
  );
}
