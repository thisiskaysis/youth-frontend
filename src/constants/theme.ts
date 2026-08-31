/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

// Palette inspired by thesend.org.au: near-black base, warm tan/gold accent,
// bold high-energy youth-movement tone.
export const Colors = {
  light: {
    text: "#18130E",
    background: "#FBF8F3",
    backgroundElement: "#F1EAE0",
    backgroundSelected: "#E6D9C4",
    textSecondary: "#6F6759",
    accent: "#B8863F",
    accentText: "#18130E",
    border: "#E3D9C7",
    danger: "#B3261E",
    success: "#2E7D32",
  },
  dark: {
    text: "#F5EFE4",
    background: "#0C0A08",
    backgroundElement: "#1B1712",
    backgroundSelected: "#2B241A",
    textSecondary: "#B3A99A",
    accent: "#D9A54B",
    accentText: "#0C0A08",
    border: "#332B20",
    danger: "#E57373",
    success: "#66BB6A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
