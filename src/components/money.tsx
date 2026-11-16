import { Fonts } from "@/constants/theme";
import { Brand } from "@/constants/brand";
import { splitMoney } from "@/lib/format";
import { Text } from "react-native";

/** Large figure: currency small, whole number large, decimals small. */
export default function BigAmount({
  value,
  hidden = false,
  size = 38,
  color,
  mutedColor,
  decimals = true,
  serif = true,
}: {
  value: number;
  hidden?: boolean;
  size?: number;
  color: string;
  mutedColor?: string;
  decimals?: boolean;
  serif?: boolean;
}) {
  const { whole, cents } = splitMoney(value);
  const muted = mutedColor ?? color;
  const fam = serif ? { fontFamily: Fonts.serif } : null;
  const small = { ...fam, fontSize: size * 0.5, fontWeight: "700" as const, color: muted };
  if (hidden) {
    return <Text style={{ ...fam, fontSize: size, fontWeight: "700", color, letterSpacing: 2 }}>{Brand.currency}••••••</Text>;
  }
  return (
    <Text style={{ color, fontVariant: ["tabular-nums"] }} numberOfLines={1} adjustsFontSizeToFit>
      <Text style={small}>{Brand.currency}</Text>
      <Text style={{ ...fam, fontSize: size, fontWeight: "700", letterSpacing: -0.5 }}>{whole}</Text>
      {decimals && <Text style={small}>.{cents}</Text>}
    </Text>
  );
}
