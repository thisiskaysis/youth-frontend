import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// expo-secure-store is native-only, so web falls back to localStorage -
// same pattern Expo's own auth guide recommends.
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(key)
        : null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore - e.g. private browsing storage restrictions
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const ACCESS_TOKEN_KEY = "youth_access_token";
const REFRESH_TOKEN_KEY = "youth_refresh_token";

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, access),
      setItem(REFRESH_TOKEN_KEY, refresh),
    ]);
  },
  async clear(): Promise<void> {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
    ]);
  },
};
