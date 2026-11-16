import { Colors, PAD, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "./brand";
import { RoundButton } from "./header";
import { ThemedText } from "./themed-text";
import { HeroDecor } from "./ui";

const TOOTH = 14;

/** Torn-receipt edge: a row of rotated squares in the hero colour, biting into the paper below. */
function TornEdge({ color }: { color: string }) {
  const { width } = useWindowDimensions();
  const count = Math.ceil(width / TOOTH) + 1;
  return (
    <View style={{ height: TOOTH / 2, flexDirection: "row", overflow: "hidden", backgroundColor: "transparent" }}>
      <View style={{ position: "absolute", top: -TOOTH / 2, left: 0, right: 0, flexDirection: "row" }}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ width: TOOTH, height: TOOTH, alignItems: "center" }}>
            <View style={{ width: TOOTH * 0.72, height: TOOTH * 0.72, backgroundColor: color, transform: [{ rotate: "45deg" }, { translateY: -TOOTH * 0.1 }] }} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Shared frame for every sign-in style screen: an espresso "ledger" header carrying the headline,
 * a torn-receipt edge, and a paper-coloured form area below.
 */
export default function AuthShell({
  title,
  subtitle,
  eyebrow,
  onBack,
  hero,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  hero?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} alwaysBounceVertical={false} overScrollMode="never">
          <View style={{ backgroundColor: Colors.hero, paddingTop: insets.top + Spacing.three, paddingHorizontal: PAD, paddingBottom: hero ? 44 : 32 }}>
            <HeroDecor lines={hero ? 10 : 7} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
              {onBack ? <RoundButton icon="chevron-back" onHero onPress={onBack} label="Go back" /> : <Logo light size={36} />}
              {onBack ? <Logo size={30} showName={false} /> : null}
            </View>
            {eyebrow ? (
              <ThemedText type="label" style={{ color: Colors.brass, marginTop: hero ? Spacing.five : Spacing.four }}>
                {eyebrow}
              </ThemedText>
            ) : null}
            <ThemedText type={hero ? "display" : "title"} style={{ color: Colors.heroText, marginTop: eyebrow ? Spacing.two : hero ? Spacing.five : Spacing.four }}>
              {title}
            </ThemedText>
            {subtitle ? <ThemedText style={{ color: Colors.heroMuted, marginTop: Spacing.two, maxWidth: 360 }}>{subtitle}</ThemedText> : null}
          </View>
          <TornEdge color={Colors.hero} />

          <View style={{ flexGrow: 1, paddingHorizontal: PAD, paddingTop: Spacing.three, paddingBottom: insets.bottom + Spacing.four }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
