import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AsyncStateProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
};

// Standard loading/error/empty wrapper so every screen handles the three
// non-happy-paths the same way instead of ad hoc spinners per screen.
export function AsyncState({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyMessage,
  onRetry,
}: AsyncStateProps) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="danger">
          {errorMessage ?? "Something went wrong."}
        </ThemedText>
        {onRetry && (
          <ThemedText
            type="link"
            themeColor="accent"
            onPress={onRetry}
            style={styles.retry}
          >
            Tap to retry
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  if (isEmpty) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">
          {emptyMessage ?? "Nothing here yet."}
        </ThemedText>
      </ThemedView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: Spacing.five,
    alignItems: "center",
    gap: Spacing.two,
  },
  retry: { marginTop: Spacing.one },
});
