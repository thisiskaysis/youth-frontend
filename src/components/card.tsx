import { StyleSheet, type ViewProps } from "react-native";

import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <ThemedView
      style={[styles.card, { borderColor: theme.border }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
