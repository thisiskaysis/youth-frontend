import { useQuery } from "@tanstack/react-query";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { inboxApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const { isLeaderOrAdmin } = useAuth();

  const conversationsQuery = useQuery({
    queryKey: ["inbox", "conversations"],
    queryFn: inboxApi.conversations,
    refetchInterval: 15000,
  });
  const unreadCount =
    conversationsQuery.data?.reduce((sum, c) => sum + c.unread_count, 0) ?? 0;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      tintColor={colors.accent}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md="person"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="inbox">
        <NativeTabs.Trigger.Label>Inbox</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat"
        />
        {unreadCount > 0 && (
          <NativeTabs.Trigger.Badge>
            {unreadCount > 9 ? "9+" : String(unreadCount)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="prayer">
        <NativeTabs.Trigger.Label>Prayer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "hands.sparkles", selected: "hands.sparkles.fill" }}
          md="volunteer_activism"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dashboard" hidden={!isLeaderOrAdmin}>
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          md="dashboard"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
