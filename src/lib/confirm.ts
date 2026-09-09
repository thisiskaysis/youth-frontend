import { Alert, Platform } from "react-native";

// react-native-web's Alert.alert() is a no-op stub, so a destructive-action
// confirm dialog needs a web fallback (window.confirm) to actually show
// anything on that platform.
export function confirmAsync(
  title: string,
  message?: string,
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm([title, message].filter(Boolean).join("\n")));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}
