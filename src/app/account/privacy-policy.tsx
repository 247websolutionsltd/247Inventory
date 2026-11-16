import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Brand } from "@/constants/brand";
import { PAD, Spacing } from "@/constants/theme";
import { openExternalLink } from "@/lib/links";
import { View } from "react-native";

const sections = [
  { t: "Information we collect", b: "We collect the details you give us (your name, phone, email and business details) and the inventory, order, staff and supplier records you create, so we can run your account." },
  { t: "How we use it", b: "To store and sync your data across your devices, show you reports and alerts, and keep the service secure and reliable. We never sell your data." },
  { t: "Your team's information", b: "Staff and supplier details you enter are yours to manage. Only add information you have the right to store, and remove it when it is no longer needed." },
  { t: "How we protect it", b: "Your data is encrypted in transit and stored in your private account space. Only you can read or change it when signed in." },
  { t: "Your choices", b: `You can update your details in More at any time, or contact ${Brand.supportEmail} to request a copy of your data or close your account.` },
];

export default function Privacy() {
  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Privacy policy" />
      <View style={{ paddingHorizontal: PAD }}>
        <ThemedText themeColor="textSecondary" style={{ lineHeight: 24 }}>
          At {Brand.name}, your business data stays yours. Here&apos;s a plain-English summary of how we handle it.
        </ThemedText>
        {sections.map((s) => (
          <View key={s.t} style={{ marginTop: Spacing.four }}>
            <ThemedText type="big">{s.t}</ThemedText>
            <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.two, lineHeight: 24 }}>{s.b}</ThemedText>
          </View>
        ))}
        <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: Spacing.five }}>
          Read the complete privacy notice on our policy site. Contact {Brand.supportEmail} with questions.
        </ThemedText>
        <Button
          title="Read full privacy policy"
          icon="open-outline"
          onPress={() => openExternalLink(Brand.privacyPolicyUrl, "your browser")}
          style={{ marginTop: Spacing.three }}
        />
      </View>
    </Container>
  );
}
