import Button from "@/components/button";
import OnboardingItem from "@/components/onboard";
import Paginator from "@/components/paginator";
import { RoundButton } from "@/components/header";
import { Logo } from "@/components/brand";
import { HeroDecor } from "@/components/ui";
import { ThemedText } from "@/components/themed-text";
import { Colors, PAD, Spacing } from "@/constants/theme";
import { onboardingData } from "@/data/onboardData";
import { goReplace } from "@/lib/nav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useRef, useState } from "react";
import { Alert, FlatList, StatusBar, TouchableOpacity, View, type ViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<(typeof onboardingData)[number]> | null>(null);
  const last = index === onboardingData.length - 1;

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const next = viewableItems[0]?.index;
    if (typeof next === "number") setIndex(next);
  }, []);

  const complete = async (route: "/auth/register" | "/auth/logIn") => {
    if (busy) return;
    setBusy(true);
    try {
      await AsyncStorage.setItem("onboarded", "true");
    } catch (e) {
      console.error("[onboarding] couldn't save completion state", e);
      Alert.alert("Couldn't save progress", "You can still continue. Onboarding may appear again next time.");
    } finally {
      setBusy(false);
    }
    goReplace(route);
  };

  const next = () => (last ? complete("/auth/register") : listRef.current?.scrollToIndex({ index: index + 1 }));
  const prev = () => index > 0 && listRef.current?.scrollToIndex({ index: index - 1 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.hero }} edges={["top", "bottom"]}>
      <HeroDecor lines={14} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: PAD, paddingTop: Spacing.two }}>
        <Logo size={32} light />
        <TouchableOpacity onPress={() => complete("/auth/logIn")} hitSlop={12} disabled={busy}>
          <ThemedText type="smallBold" style={{ color: Colors.heroMuted }}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={onboardingData}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <OnboardingItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />

      <View style={{ paddingHorizontal: PAD, paddingBottom: Spacing.three }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Paginator count={onboardingData.length} currentIndex={index} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {index > 0 && (
              <View style={{ marginRight: Spacing.two }}>
                <RoundButton icon="chevron-back" onHero onPress={prev} label="Previous" />
              </View>
            )}
            <Button
              variant="brass"
              title={last ? "Get started" : "Next"}
              icon={last ? undefined : "arrow-forward"}
              onPress={next}
              loading={busy}
              style={{ minWidth: 150 }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
