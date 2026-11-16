import Container from "@/components/custom-container";
import Header from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, ListRow } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/PageContext";
import { authErrorMessage, resetPassword } from "@/services/auth";
import { Alert, View } from "react-native";

export default function Security() {
  const { owner } = useAuth();

  const changePassword = () =>
    Alert.alert("Change password", `We'll email a reset link to ${owner.email}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send link",
        onPress: async () => {
          try {
            await resetPassword(owner.email);
            Alert.alert("Check your email", "Follow the link we sent to choose a new password.");
          } catch (e) {
            Alert.alert("Couldn't send link", authErrorMessage(e));
          }
        },
      },
    ]);

  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Security" />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.three }}>
        <Card style={{ paddingVertical: 0 }}>
          <ListRow icon="key-outline" title="Change password" subtitle="Get a reset link by email" onPress={changePassword} />
          <ListRow icon="mail-outline" title="Sign-in email" subtitle={owner.email} last />
        </Card>
        <ThemedText type="caption" themeColor="textSecondary" style={{ lineHeight: 18 }}>
          Your inventory is private to your account. Team members are records you keep for scheduling and order assignment; they don&apos;t have their own sign-ins.
        </ThemedText>
      </View>
    </Container>
  );
}
