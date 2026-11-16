import { PAD } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { useInventory } from "@/context/InventoryContext";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  home: { label: "Overview", icon: "grid-outline", iconActive: "grid" },
  inventory: { label: "Stock", icon: "cube-outline", iconActive: "cube" },
  orders: { label: "Orders", icon: "receipt-outline", iconActive: "receipt" },
  staff: { label: "Team", icon: "people-outline", iconActive: "people" },
  more: { label: "More", icon: "ellipsis-horizontal-circle-outline", iconActive: "ellipsis-horizontal-circle" },
};

const ORDER = ["home", "inventory", "orders", "staff", "more"];

/** Flat shelf-style bar: a hairline on top and a brass tab marker over the active item. */
function ShelfTabBar({ state, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { openOrders } = useInventory();
  const focusedName = state.routes[state.index]?.name;
  const routes = ORDER.map((name) => state.routes.find((r: any) => r.name === name)).filter(Boolean);

  return (
    <View style={[styles.bar, { backgroundColor: theme.card, borderTopColor: theme.line, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {routes.map((route: any) => {
        const meta = TAB_META[route.name];
        const focused = focusedName === route.name;
        const color = focused ? theme.text : theme.textSecondary;
        const badge = route.name === "orders" ? openOrders.length : 0;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: focused }}
          >
            <View style={[styles.marker, { backgroundColor: focused ? theme.accent : "transparent" }]} />
            <View>
              <Ionicons name={focused ? meta.iconActive : meta.icon} size={22} color={focused ? theme.accent : color} />
              {badge > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.accent, borderColor: theme.card }]}>
                  <Text style={[styles.badgeText, { color: theme.ctaText }]}>{badge > 9 ? "9+" : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color, fontWeight: focused ? "800" : "600" }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <ShelfTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Overview" }} />
      <Tabs.Screen name="inventory" options={{ title: "Stock" }} />
      <Tabs.Screen name="orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="staff" options={{ title: "Team" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", borderTopWidth: 1, paddingHorizontal: PAD / 2 },
  tab: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingTop: 0, paddingBottom: 2, gap: 3, minHeight: 58 },
  marker: { alignSelf: "center", width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, marginBottom: 7 },
  label: { fontSize: 10.5, letterSpacing: 0.3 },
  badge: { position: "absolute", top: -5, right: -9, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  badgeText: { fontSize: 9, fontWeight: "800" },
});
