import { type PropsWithChildren } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    type ScrollViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "./themed-view";

import { MaxContentWidth, Spacing } from "@/constants/theme";

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  /** Pass true for bottom-tab screens on web, which sit under the floating
   * tab bar chrome with no Stack header to push content down. Pushed
   * (Stack) screens already get header clearance for free - leave false. */
  clearFloatingTabBar?: boolean;
}>;

// Keeps content readable on wide desktop/web viewports instead of stretching
// full-width, while still filling the screen naturally on phones.
export function ScreenContainer({
  children,
  scroll = true,
  contentContainerStyle,
  clearFloatingTabBar = false,
}: ScreenContainerProps) {
  const topClearance = clearFloatingTabBar && Platform.OS === "web" ? 76 : 0;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={["top", "left", "right"]}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingTop: Spacing.four + topClearance },
              contentContainerStyle,
            ]}
            style={styles.fill}
          >
            {children}
          </ScrollView>
        ) : (
          <ThemedView
            style={[
              styles.content,
              { paddingTop: Spacing.four + topClearance },
              styles.fill,
              contentContainerStyle,
            ]}
          >
            {children}
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    gap: Spacing.three,
  },
});
