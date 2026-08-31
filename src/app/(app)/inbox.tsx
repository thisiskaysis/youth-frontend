import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { inboxApi, notificationsApi } from "@/lib/api/endpoints";

export default function InboxScreen() {
  const queryClient = useQueryClient();
  const messagesQuery = useQuery({
    queryKey: ["inbox", "messages"],
    queryFn: inboxApi.list,
  });
  const notificationsQuery = useQuery({
    queryKey: ["inbox", "notifications"],
    queryFn: notificationsApi.list,
  });

  const markMessageRead = useMutation({
    mutationFn: (id: number) => inboxApi.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inbox", "messages"] }),
  });
  const markNotificationRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["inbox", "notifications"] }),
  });

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        INBOX
      </ThemedText>
      <ThemedText type="display">Inbox</ThemedText>

      <ThemedText type="subtitle">Messages</ThemedText>
      <AsyncState
        isLoading={messagesQuery.isLoading}
        isError={messagesQuery.isError}
        errorMessage="Couldn't load messages."
        onRetry={() => messagesQuery.refetch()}
        isEmpty={messagesQuery.data?.results.length === 0}
        emptyMessage="No messages yet."
      />
      {messagesQuery.data?.results.map((message) => (
        <Pressable
          key={message.id}
          onPress={() => !message.read_at && markMessageRead.mutate(message.id)}
        >
          <Card style={[styles.card, !message.read_at && styles.unread]}>
            <ThemedText type="small" themeColor="textSecondary">
              From {message.sender.display_name}
            </ThemedText>
            <ThemedText>{message.body}</ThemedText>
          </Card>
        </Pressable>
      ))}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Notifications
      </ThemedText>
      <AsyncState
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
        errorMessage="Couldn't load notifications."
        onRetry={() => notificationsQuery.refetch()}
        isEmpty={notificationsQuery.data?.results.length === 0}
        emptyMessage="Nothing new."
      />
      {notificationsQuery.data?.results.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() =>
            !notification.read_at &&
            markNotificationRead.mutate(notification.id)
          }
        >
          <Card style={[styles.card, !notification.read_at && styles.unread]}>
            <ThemedText type="smallBold">{notification.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {notification.body}
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
  sectionSpacing: { marginTop: Spacing.three },
});
