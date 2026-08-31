import { type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { HamburgerButton } from "./hamburger-menu";
import { ThemedView } from "./themed-view";

// Web already shows the hamburger in the persistent tab bar chrome (see
// app-tabs.web.tsx) - only native needs a per-screen entry point since
// NativeTabs has no shared header row.
export function TopBar({ right }: { right?: ReactNode }) {
  if (Platform.OS === "web") {
    return null;
  }

  return (
    <ThemedView style={styles.row}>
      <HamburgerButton />
      {right}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
