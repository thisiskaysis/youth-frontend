import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { notificationsApi } from "@/lib/api/endpoints";
import type { NotificationItem } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/format";

// Where each deep_link_type should take you. Types with no per-item detail
// route yet (content, events, decisions, prayer, navigation, rides,
// volunteers) land on the screen that lists the item instead.
const DEEP_LINK_ROUTES: Record<string, (id: string) => string> = {
  attendance_session: (id) => `/manage/attendance/${id}`,
  form_assignment: (id) => `/forms/${id}`,
  inbox_message: (id) => `/inbox/${id}`,
  content_item: () => "/",
  event: () => "/events",
  follow_up: () => "/manage/decisions",
  navigation_item: () => "/manage/navigation",
  prayer_request: () => "/manage/prayer",
  ride_request: () => "/manage/rides",
  volunteer_assignment: () => "/manage/volunteers",
};

function resolveNotificationHref(notification: NotificationItem) {
  const resolve = notification.deep_link_type
    ? DEEP_LINK_ROUTES[notification.deep_link_type]
    : undefined;
  if (!resolve) return null;
  if (notification.deep_link_id == null) return null;
  return resolve(String(notification.deep_link_id));
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: notificationsApi.list,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const openNotification = (notification: NotificationItem) => {
    if (!notification.read_at) markRead.mutate(notification.id);
    const href = resolveNotificationHref(notification);
    if (href) router.push(href as never);
  };

  const notifications = notificationsQuery.data?.results ?? [];

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        NOTIFICATIONS
      </ThemedText>
      <ThemedText type="display">Notifications</ThemedText>

      <AsyncState
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
        errorMessage="Couldn't load notifications."
        onRetry={() => notificationsQuery.refetch()}
        isEmpty={notifications.length === 0}
        emptyMessage="Nothing new."
      />
      {notifications.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => openNotification(notification)}
        >
          <Card style={[styles.card, !notification.read_at && styles.unread]}>
            <ThemedText type="smallBold">{notification.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {notification.body}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatRelativeTime(notification.created_at)}
            </ThemedText>
          </Card>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  unread: { borderWidth: 1.5 },
});
