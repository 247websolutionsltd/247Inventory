import { Colors, Fonts, PAD, Radius, Spacing } from "@/constants/theme";
import { Slide } from "@/data/onboardData";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions, View } from "react-native";
import { ThemedText } from "./themed-text";

const { width } = Dimensions.get("window");
const P = Colors.palette;

const paper = { backgroundColor: "#FFFBF4", borderRadius: Radius.lg } as const;

function Illustration({ kind }: { kind: Slide["kind"] }) {
  return (
    <View style={{ height: 290, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 270, height: 270, borderRadius: Radius.xl, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(227,178,92,0.35)", transform: [{ rotate: "6deg" }] }} />

      {kind === "stock" && (
        <>
          {/* shelving unit */}
          <View style={{ width: 270, padding: 14, ...paper }}>
            {[
              [["#A5622B", 56], ["#6B4423", 40], ["#D9A066", 64], ["#8A4B1E", 34]],
              [["#6B4423", 44], ["#E3B25C", 60], ["#A5622B", 38]],
            ].map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 78, borderBottomWidth: 4, borderBottomColor: P.mocha, paddingHorizontal: 4, marginBottom: ri === 0 ? 8 : 0 }}>
                {row.map(([c, h], i) => (
                  <View key={i} style={{ width: 44, height: h as number, backgroundColor: c as string, borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 22, height: 2, backgroundColor: "rgba(255,255,255,0.5)" }} />
                  </View>
                ))}
              </View>
            ))}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <ThemedText type="label" style={{ color: P.mocha }}>Shelf B · 86 units</ThemedText>
              <Ionicons name="checkmark-circle" size={18} color="#4B7A33" />
            </View>
          </View>
          <View style={{ position: "absolute", right: 14, bottom: 14, backgroundColor: P.danger, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, transform: [{ rotate: "-6deg" }] }}>
            <ThemedText type="label" style={{ color: "#FFF", letterSpacing: 1.2 }}>Low · 5 left</ThemedText>
          </View>
        </>
      )}

      {kind === "orders" && (
        <>
          <View style={{ width: 250, padding: 16, ...paper, transform: [{ rotate: "-3deg" }] }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <ThemedText style={{ fontFamily: Fonts.serif, fontWeight: "700", fontSize: 18, color: P.espresso }}>ORD-1042</ThemedText>
              <View style={{ borderWidth: 1.25, borderColor: P.copper, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <ThemedText type="label" style={{ color: P.copper, fontSize: 9.5 }}>Ready</ThemedText>
              </View>
            </View>
            {[["Basmati Rice 5kg", "×2"], ["Vegetable Oil 3L", "×1"], ["Tissue 10-pack", "×3"]].map(([n, q]) => (
              <View key={n} style={{ flexDirection: "row", marginTop: 9 }}>
                <ThemedText type="small" style={{ color: P.espresso }}>{n}</ThemedText>
                <View style={{ flex: 1, borderBottomWidth: 1, borderStyle: "dashed", borderBottomColor: "#CDB79A", marginHorizontal: 6, marginBottom: 5 }} />
                <ThemedText type="smallBold" style={{ color: P.espresso }}>{q}</ThemedText>
              </View>
            ))}
            <View style={{ height: 1.5, backgroundColor: P.espresso, marginTop: 12, opacity: 0.8 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <ThemedText type="label" style={{ color: P.mocha }}>Total</ThemedText>
              <ThemedText style={{ fontFamily: Fonts.serif, fontWeight: "700", fontSize: 18, color: P.espresso }}>₦36,200</ThemedText>
            </View>
          </View>
          <View style={{ position: "absolute", left: 12, bottom: 16, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: P.brass, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, transform: [{ rotate: "4deg" }] }}>
            <Ionicons name="cube" size={14} color={P.espresso} />
            <ThemedText type="smallBold" style={{ color: P.espresso }}>Stock updated</ThemedText>
          </View>
        </>
      )}

      {kind === "team" && (
        <>
          <View style={{ width: 270, padding: 14, gap: 10, ...paper }}>
            {[["Amaka Obi", "Manager", "#8A4B1E", "Full day"], ["Tunde Bello", "Cashier", "#5E6B3A", "Morning"], ["Ngozi Eze", "Storekeeper", "#3F5D6B", "Afternoon"]].map(([n, r, c, s]) => (
              <View key={n} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                  <ThemedText style={{ color: "#FFF8EC", fontFamily: Fonts.serif, fontWeight: "700" }}>{n.split(" ").map((x) => x[0]).join("")}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold" style={{ color: P.espresso }}>{n}</ThemedText>
                  <ThemedText type="caption" style={{ color: P.mocha }}>{r}</ThemedText>
                </View>
                <View style={{ borderWidth: 1.25, borderColor: "#4B7A33", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <ThemedText type="label" style={{ color: "#4B7A33", fontSize: 9 }}>{s}</ThemedText>
                </View>
              </View>
            ))}
          </View>
          <View style={{ position: "absolute", right: 12, bottom: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: P.brass, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, transform: [{ rotate: "-5deg" }] }}>
            <Ionicons name="people" size={14} color={P.espresso} />
            <ThemedText type="smallBold" style={{ color: P.espresso }}>3 on duty</ThemedText>
          </View>
        </>
      )}
    </View>
  );
}

export default function OnboardingItem({ item }: { item: Slide }) {
  return (
    <View style={{ width, paddingHorizontal: PAD, paddingTop: Spacing.five }}>
      <Illustration kind={item.kind} />
      <View style={{ marginTop: Spacing.four }}>
        <ThemedText type="label" style={{ color: Colors.brass }}>{item.eyebrow}</ThemedText>
        <ThemedText type="title" style={{ color: Colors.heroText, marginTop: Spacing.two }}>{item.title}</ThemedText>
        <ThemedText style={{ color: Colors.heroMuted, marginTop: Spacing.three, lineHeight: 24 }}>{item.description}</ThemedText>
      </View>
    </View>
  );
}
