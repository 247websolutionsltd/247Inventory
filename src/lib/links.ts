import { Alert, Linking } from "react-native";

export async function openExternalLink(url: string, appName: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(`Couldn't open ${appName}`, `Check that an app is available to handle this link.`);
  }
}
