import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Matches ExternalLink's native (in-app browser) vs web (new tab) split,
// for places that need a plain onPress handler instead of a Link element.
export async function openExternalUrl(url: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}
