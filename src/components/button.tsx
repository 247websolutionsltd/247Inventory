import { Colors, Radius, Spacing } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";

type Variant = "primary" | "brass" | "soft" | "secondary" | "danger" | "ghost";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconLeft?: IconName;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Keycap-style buttons: a thicker bottom edge makes them feel pressed from a physical stock. */
export default function Button({ title, onPress, variant = "primary", loading = false, disabled = false, icon, iconLeft, small = false, style }: Props) {
  const theme = useTheme();

  const palette = {
    primary: { bg: theme.cta, fg: theme.ctaText, border: "transparent", edge: "rgba(0,0,0,0.28)" },
    brass: { bg: Colors.brass, fg: Colors.palette.roast950, border: "transparent", edge: "rgba(0,0,0,0.22)" },
    soft: { bg: theme.accentSurface, fg: theme.accentText, border: "transparent", edge: theme.line },
    secondary: { bg: theme.card, fg: theme.text, border: theme.line, edge: theme.line },
    danger: { bg: theme.dangerSurface, fg: theme.danger, border: "transparent", edge: theme.line },
    ghost: { bg: "transparent", fg: theme.accent, border: "transparent", edge: "transparent" },
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.base,
        small && styles.small,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderBottomColor: palette.edge,
          borderBottomWidth: variant === "ghost" ? 0 : small ? 2 : 3,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {iconLeft && <Ionicons name={iconLeft} size={small ? 16 : 19} color={palette.fg} style={{ marginRight: Spacing.two }} />}
          <ThemedText style={{ color: palette.fg, fontSize: small ? 13.5 : 15.5, fontWeight: "700", letterSpacing: 0.2 }}>{title}</ThemedText>
          {icon && <Ionicons name={icon} size={small ? 16 : 19} color={palette.fg} style={{ marginLeft: Spacing.two }} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
  },
  small: { height: 40, paddingHorizontal: Spacing.three, borderRadius: Radius.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});
