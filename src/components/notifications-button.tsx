import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { useTheme } from "@/hooks/use-theme";
import { notificationsApi } from "@/lib/api/endpoints";

// Lives in the top right of every screen - notifications are deliberately
// kept separate from the Inbox (direct messages), see notifications.tsx.
export function NotificationsButton() {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.list,
    refetchInterval: 30000,
  });
  const unreadCount =
    query.data?.results.filter((item) => !item.read_at).length ?? 0;

  return (
    <Link href="/notifications" asChild>
      <Pressable
        hitSlop={12}
        accessibilityLabel="Notifications"
        style={styles.button}
      >
        <SymbolView
          name={{ ios: "bell", android: "notifications", web: "notifications" }}
          size={22}
          tintColor={theme.text}
        />
        {unreadCount > 0 && (
          <ThemedView style={[styles.badge, { backgroundColor: theme.danger }]}>
            <ThemedText style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </ThemedText>
          </ThemedView>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
