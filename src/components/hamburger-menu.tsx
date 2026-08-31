import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const PANEL_WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);

const MENU_ITEMS = [
  {
    href: "/groups",
    label: "Groups",
    hint: "Connect, volunteer & ministry teams",
  },
  { href: "/events", label: "Events", hint: "What's coming up" },
  { href: "/inbox", label: "Inbox", hint: "Messages & notifications" },
] as const;

export function HamburgerButton() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const open = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const goTo = (href: (typeof MENU_ITEMS)[number]["href"]) => {
    close();
    router.push(href);
  };

  return (
    <>
      <Pressable
        onPress={open}
        hitSlop={12}
        style={styles.hamburger}
        accessibilityLabel="Open menu"
      >
        <ThemedView style={[styles.bar, { backgroundColor: theme.text }]} />
        <ThemedView style={[styles.bar, { backgroundColor: theme.text }]} />
        <ThemedView style={[styles.bar, { backgroundColor: theme.text }]} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: theme.background,
              borderRightColor: theme.border,
            },
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-PANEL_WIDTH, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.panelSafeArea}>
            <ThemedText
              type="eyebrow"
              themeColor="accent"
              style={styles.panelTitle}
            >
              MENU
            </ThemedText>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => goTo(item.href)}
                style={styles.item}
              >
                <ThemedText type="smallBold">{item.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.hint}
                </ThemedText>
              </Pressable>
            ))}
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburger: {
    width: 32,
    height: 32,
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  bar: { height: 2.5, borderRadius: 2 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  panelSafeArea: { flex: 1, padding: Spacing.four },
  panelTitle: { marginBottom: Spacing.three },
  item: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
});
