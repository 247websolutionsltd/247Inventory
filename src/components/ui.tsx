import { Colors, Fonts, PAD, Radius, Spacing } from "@/constants/theme";
import { IconName } from "@/data/catalog";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleProp, TextInput, TouchableOpacity, View, ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";

/* ------------------------------ Card ------------------------------------ */
/** Flat "paper" panel with a hairline border. `alt` tints it; `dashed` gives a receipt-style edge. */
export function Card({
  children,
  style,
  alt = false,
  dashed = false,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  alt?: boolean;
  dashed?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: alt ? theme.accentSurface : theme.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: dashed ? "dashed" : "solid",
    borderColor: theme.line,
    padding: Spacing.three,
  };
  if (onPress)
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[base, style]}>
        {children}
      </TouchableOpacity>
    );
  return <View style={[base, style]}>{children}</View>;
}

/* --------------------------- Hero decoration ---------------------------- */
/** Ledger rules and a ghosted crate on espresso surfaces: depth without gradients. */
export function HeroDecor({ lines = 9 }: { lines?: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ position: "absolute", left: 0, right: 0, top: 28 + i * 34, height: 1, backgroundColor: Colors.heroLine }} />
      ))}
      <View style={{ position: "absolute", right: 24, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(229,115,91,0.28)" }} />
      <Ionicons name="cube-outline" size={220} color={Colors.brass} style={{ position: "absolute", right: -50, bottom: -64, opacity: 0.08, transform: [{ rotate: "-12deg" }] }} />
    </View>
  );
}

/* ------------------------------ IconBadge ------------------------------- */
export function IconBadge({
  icon,
  size = 44,
  color,
  bg,
  round = false,
}: {
  icon: IconName;
  size?: number;
  color?: string;
  bg?: string;
  round?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : Radius.sm,
        backgroundColor: bg ?? theme.accentSurface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={size * 0.48} color={color ?? theme.accent} />
    </View>
  );
}

/* -------------------------------- Stamp --------------------------------- */
export type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

/** Outlined, uppercase status tag, like a rubber stamp on a delivery note. */
export function Stamp({ label, tone = "neutral", icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const c = {
    neutral: { fg: theme.textSecondary, bg: "transparent" },
    accent: { fg: theme.accent, bg: theme.accentSurface },
    success: { fg: theme.success, bg: theme.successSurface },
    warning: { fg: theme.warning, bg: theme.warningSurface },
    danger: { fg: theme.danger, bg: theme.dangerSurface },
  }[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Radius.xs,
        borderWidth: 1.25,
        borderColor: c.fg,
        backgroundColor: c.bg,
        gap: 4,
      }}
    >
      {icon && <Ionicons name={icon} size={11} color={c.fg} />}
      <ThemedText type="label" style={{ color: c.fg, fontSize: 9.5, lineHeight: 12, letterSpacing: 1 }}>
        {label}
      </ThemedText>
    </View>
  );
}

/* -------------------------------- Chip ---------------------------------- */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        height: 38,
        borderRadius: Radius.sm,
        backgroundColor: selected ? theme.cta : theme.card,
        borderWidth: 1,
        borderColor: selected ? theme.cta : theme.line,
      }}
    >
      {icon && <Ionicons name={icon} size={15} color={selected ? theme.ctaText : theme.textSecondary} style={{ marginRight: 6 }} />}
      <ThemedText type="smallBold" style={{ color: selected ? theme.ctaText : theme.text }}>
        {label}
      </ThemedText>
      {count !== undefined && (
        <ThemedText type="caption" style={{ marginLeft: 6, fontWeight: "800", color: selected ? theme.ctaText : theme.textSecondary, opacity: selected ? 0.8 : 1 }}>
          {count}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

/** Horizontally scrolling row of chips needs a ScrollView; this is the shared gap/padding helper. */
export const chipRowStyle = { gap: Spacing.two, paddingHorizontal: PAD } as const;

/* ---------------------------- ProgressBar ------------------------------- */
export function ProgressBar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: 2, backgroundColor: theme.line, overflow: "hidden" }}>
      <View style={{ width: `${pct * 100}%`, height, backgroundColor: color ?? theme.accent }} />
    </View>
  );
}

/* ------------------------------- Toggle --------------------------------- */
export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label?: string }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.9}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={{
        width: 50,
        height: 28,
        borderRadius: 8,
        backgroundColor: value ? theme.accent : theme.controlOff,
        paddingHorizontal: 3,
        justifyContent: "center",
        alignItems: value ? "flex-end" : "flex-start",
      }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: value ? theme.ctaText : theme.controlThumb }} />
    </TouchableOpacity>
  );
}

/* --------------------------- SectionHeader ------------------------------ */
export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.three, gap: Spacing.three }, style]}>
      <ThemedText type="big">{title}</ThemedText>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.line }} />
      {action && (
        <TouchableOpacity onPress={onAction} hitSlop={10}>
          <ThemedText type="label" style={{ color: theme.accent }}>
            {action}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ------------------------------- ListRow -------------------------------- */
export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  last = false,
  danger = false,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
  danger?: boolean;
}) {
  const theme = useTheme();
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.three - 2,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.line,
      }}
    >
      <IconBadge icon={icon} size={40} color={danger ? theme.danger : undefined} bg={danger ? theme.dangerSurface : undefined} />
      <View style={{ flex: 1, marginLeft: Spacing.three }}>
        <ThemedText type="smallBold" style={danger ? { color: theme.danger } : undefined}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={17} color={theme.inkSoft} /> : null)}
    </Wrap>
  );
}

/* ------------------------------- DetailRow ------------------------------ */
/** Label ........ value, like a line on a receipt. */
export function DetailRow({ label, value, last = false, bold = false, color }: { label: string; value: string; last?: boolean; bold?: boolean; color?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", paddingVertical: 9 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={{ flex: 1, minWidth: 16, marginHorizontal: 8, marginBottom: 5, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line, borderStyle: "dashed" }} />
      <ThemedText type={bold ? "bold" : "smallBold"} style={{ flexShrink: 1, textAlign: "right", color: color ?? theme.text }}>
        {value}
      </ThemedText>
    </View>
  );
}

/* ------------------------------- StatTile ------------------------------- */
export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  onPress,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  tone?: "neutral" | "danger" | "warning";
  onPress?: () => void;
}) {
  const theme = useTheme();
  const accent = tone === "danger" ? theme.danger : tone === "warning" ? theme.warning : theme.accent;
  const Wrap: any = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
      style={{
        flex: 1,
        minWidth: "46%",
        backgroundColor: theme.card,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: theme.line,
        padding: Spacing.three,
        gap: 6,
      }}
    >
      <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: accent }} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <ThemedText type="label" themeColor="textSecondary">
          {label}
        </ThemedText>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <ThemedText style={{ fontFamily: Fonts.serif, fontSize: 28, lineHeight: 32, fontWeight: "700", fontVariant: ["tabular-nums"] }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      {sub ? (
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {sub}
        </ThemedText>
      ) : null}
    </Wrap>
  );
}

/* ------------------------------ EmptyState ------------------------------ */
export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body?: string; children?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: Spacing.five, paddingHorizontal: Spacing.four }}>
      <View style={{ width: 84, height: 84, borderRadius: Radius.lg, borderWidth: 1.5, borderStyle: "dashed", borderColor: theme.inkSoft, alignItems: "center", justifyContent: "center", backgroundColor: theme.accentSurface }}>
        <Ionicons name={icon} size={36} color={theme.accent} />
      </View>
      <ThemedText type="big" style={{ marginTop: Spacing.three, textAlign: "center" }}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one, textAlign: "center", lineHeight: 20, maxWidth: 300 }}>
          {body}
        </ThemedText>
      ) : null}
      {children ? <View style={{ marginTop: Spacing.three, alignSelf: "stretch", gap: Spacing.two }}>{children}</View> : null}
    </View>
  );
}

/* ------------------------------- SearchBar ------------------------------ */
export function SearchBar({ value, onChangeText, placeholder = "Search" }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.md,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.line,
        gap: Spacing.two,
      }}
    >
      <Ionicons name="search" size={18} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.inkSoft}
        selectionColor={theme.accent}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ flex: 1, color: theme.text, fontSize: 15, height: 48, outlineStyle: "none" } as any}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText("")} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={theme.inkSoft} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ------------------------------ QtyStepper ------------------------------ */
export function QtyStepper({ value, onChange, min = 0, max = 99999, small = false }: { value: number; onChange: (n: number) => void; min?: number; max?: number; small?: boolean }) {
  const theme = useTheme();
  const size = small ? 34 : 44;
  const btn = (icon: IconName, delta: number, disabled: boolean) => (
    <TouchableOpacity
      onPress={() => onChange(Math.max(min, Math.min(max, value + delta)))}
      disabled={disabled}
      accessibilityLabel={delta > 0 ? "Increase" : "Decrease"}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.35 : 1 }}
    >
      <Ionicons name={icon} size={small ? 16 : 20} color={theme.text} />
    </TouchableOpacity>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", borderRadius: Radius.sm, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.card }}>
      {btn("remove", -1, value <= min)}
      <View style={{ minWidth: small ? 34 : 50, alignItems: "center", borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.line, height: size, justifyContent: "center" }}>
        <ThemedText type="bold" style={{ fontVariant: ["tabular-nums"] }}>
          {value}
        </ThemedText>
      </View>
      {btn("add", 1, value >= max)}
    </View>
  );
}

/* ---------------------------------- Fab --------------------------------- */
export function Fab({ icon = "add", label, onPress }: { icon?: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        position: "absolute",
        right: PAD,
        bottom: 84,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 52,
        paddingHorizontal: 18,
        borderRadius: Radius.md,
        backgroundColor: theme.cta,
        borderBottomWidth: 3,
        borderBottomColor: "rgba(0,0,0,0.25)",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.ctaText} />
      <ThemedText type="smallBold" style={{ color: theme.ctaText }}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}
