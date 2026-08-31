import { Platform } from "react-native";

// Android emulator can't reach the host machine via localhost - it needs the
// special 10.0.2.2 alias. iOS simulator and web both share the host network.
// Physical devices (Expo Go) need the dev machine's LAN IP - override via
// EXPO_PUBLIC_API_URL in a .env file for that case.
function defaultApiUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }
  return "http://localhost:8000";
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl();
