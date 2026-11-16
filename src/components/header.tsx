import { PAD, Radius, Spacing } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "./themed-text";

export function RoundButton({
  icon,
  onPress,
  label,
  onHero = false,
  dot = false,
  badge,
}: {
  icon: IconName;
  onPress?: () => void;
  label?: string;
  onHero?: boolean;
  dot?: boolean;
  badge?: number;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      style={{
        width: 42,
        height: 42,
        borderRadius: Radius.sm,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: onHero ? "rgba(255,248,236,0.12)" : theme.card,
        borderWidth: 1,
        borderColor: onHero ? "rgba(255,248,236,0.2)" : theme.line,
      }}
    >
      <Ionicons name={icon} size={20} color={onHero ? "#FFF8EC" : theme.text} />
      {dot && (
        <View style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: theme.danger, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: onHero ? "#33200F" : theme.background }}>
          {badge ? <ThemedText style={{ color: "#FFF", fontSize: 9.5, lineHeight: 12, fontWeight: "800" }}>{badge > 9 ? "9+" : badge}</ThemedText> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Standard inner-screen header: back button, left-aligned serif title, optional right slot. */
export default function Header({ title, subtitle, right, back = true, onBack }: { title?: string; subtitle?: string; right?: ReactNode; back?: boolean; onBack?: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: PAD, paddingTop: Spacing.two, paddingBottom: Spacing.three, borderBottomWidth: 1, borderBottomColor: theme.line, marginBottom: Spacing.three }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three, minHeight: 44 }}>
        {back && <RoundButton icon="chevron-back" label="Go back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home" as never)))} />}
        <View style={{ flex: 1 }}>
          <ThemedText type="big" numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/** Large title block for the root of each tab. */
export function TabHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: PAD, paddingTop: Spacing.three, paddingBottom: Spacing.three }}>
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <ThemedText type="label" themeColor="accent" style={{ marginBottom: 2 }}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText type="title">{title}</ThemedText>
      </View>
      {right}
    </View>
  );
}
