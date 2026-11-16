import { Colors, Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { initials } from "@/lib/format";
import { View } from "react-native";
import { ThemedText } from "./themed-text";

const TONES = ["#8A4B1E", "#5E6B3A", "#7A3E3E", "#3F5D6B", "#6B5B2A", "#5B3F6B"];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Square-ish monogram tile. Tone is derived from the name so people keep their colour. */
export default function Avatar({ name, size = 46, onHero = false, dim = false }: { name: string; size?: number; onHero?: boolean; dim?: boolean }) {
  const theme = useTheme();
  const bg = onHero ? Colors.heroChip : dim ? theme.cardAlt : TONES[hash(name || "?") % TONES.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.24 + 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <ThemedText style={{ color: dim ? theme.textSecondary : "#FFF8EC", fontFamily: Fonts.serif, fontWeight: "700", fontSize: size * 0.38 }}>{initials(name) || "?"}</ThemedText>
    </View>
  );
}
