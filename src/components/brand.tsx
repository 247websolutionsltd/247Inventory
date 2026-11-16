import { Brand } from "@/constants/brand";
import { Colors, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { ThemedText } from "./themed-text";

/** Brass crate mark with a notched corner, plus a serif wordmark. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: "absolute", left: 0, top: 0, width: size, height: size, borderRadius: size * 0.22, backgroundColor: Colors.brass, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="cube" size={size * 0.56} color={Colors.palette.espresso} />
      </View>
    </View>
  );
}

export function Logo({ size = 40, showName = true, light = false }: { size?: number; showName?: boolean; light?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <LogoMark size={size} />
      {showName && (
        <ThemedText
          style={{
            marginLeft: size * 0.3,
            fontFamily: Fonts.serif,
            fontSize: size * 0.62,
            lineHeight: size * 0.8,
            fontWeight: "700",
            letterSpacing: -0.4,
            color: light ? "#FFF8EC" : undefined,
          }}
        >
          {Brand.name}
        </ThemedText>
      )}
    </View>
  );
}
