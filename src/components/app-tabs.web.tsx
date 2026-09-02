import { useQuery } from "@tanstack/react-query";
import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, View } from "react-native";

import { HamburgerButton } from "./hamburger-menu";
import { NotificationsButton } from "./notifications-button";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { inboxApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function AppTabs() {
  const { isLeaderOrAdmin } = useAuth();
  const conversationsQuery = useQuery({
    queryKey: ["inbox", "conversations"],
    queryFn: inboxApi.conversations,
    refetchInterval: 15000,
  });
  const unreadCount =
    conversationsQuery.data?.reduce((sum, c) => sum + c.unread_count, 0) ?? 0;

  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="prayer" href="/prayer" asChild>
            <TabButton>Prayer</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
          <TabTrigger name="inbox" href="/inbox" asChild>
            <TabButton badge={unreadCount}>Inbox</TabButton>
          </TabTrigger>
          {isLeaderOrAdmin && (
            <TabTrigger name="dashboard" href="/dashboard" asChild>
              <TabButton>Dashboard</TabButton>
            </TabTrigger>
          )}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  badge,
  ...props
}: TabTriggerSlotProps & { badge?: number }) {
  const theme = useTheme();
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? "backgroundSelected" : "backgroundElement"}
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "accent" : "textSecondary"}
        >
          {children}
        </ThemedText>
        {!!badge && (
          <ThemedView style={[styles.badge, { backgroundColor: theme.danger }]}>
            <ThemedText style={styles.badgeText}>
              {badge > 9 ? "9+" : badge}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { user } = useAuth();

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <HamburgerButton />
        <ThemedText
          type="smallBold"
          themeColor="accent"
          style={styles.brandText}
        >
          YOUTH
        </ThemedText>

        {props.children}

        {user && (
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.greeting}
          >
            {user.first_name}
          </ThemedText>
        )}
        <NotificationsButton />
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: Spacing.three,
    letterSpacing: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  badge: {
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
  greeting: {
    marginLeft: Spacing.two,
  },
});
