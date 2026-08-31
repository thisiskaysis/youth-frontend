import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { inboxApi, notificationsApi, usersApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function InboxScreen() {
  const theme = useTheme();
  const { isLeaderOrAdmin } = useAuth();
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

  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{
    id: number;
    display_name: string;
  } | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [composeError, setComposeError] = useState<string | null>(null);

  const recipientResults = useQuery({
    queryKey: ["inbox", "recipient-search", recipientQuery],
    queryFn: () => usersApi.search(recipientQuery),
    enabled: recipientQuery.length > 0 && !selectedRecipient,
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!selectedRecipient) throw new Error("Choose who to message.");
      return inboxApi.send(selectedRecipient.id, messageBody);
    },
    onSuccess: () => {
      setComposeOpen(false);
      setSelectedRecipient(null);
      setRecipientQuery("");
      setMessageBody("");
      setComposeError(null);
      queryClient.invalidateQueries({ queryKey: ["inbox", "messages"] });
    },
    onError: (error) => setComposeError(extractErrorMessage(error)),
  });

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        INBOX
      </ThemedText>
      <ThemedText type="display">Inbox</ThemedText>

      {isLeaderOrAdmin && (
        <>
          <Pressable
            onPress={() => setComposeOpen((open) => !open)}
            style={[styles.composeButton, { backgroundColor: theme.accent }]}
          >
            <ThemedText type="buttonLabel" themeColor="accentText">
              {composeOpen ? "CANCEL" : "+ COMPOSE"}
            </ThemedText>
          </Pressable>

          {composeOpen && (
            <Card>
              <ThemedText type="small" style={styles.label}>
                To
              </ThemedText>
              {selectedRecipient ? (
                <ThemedView style={styles.recipientRow}>
                  <ThemedText type="small">
                    {selectedRecipient.display_name}
                  </ThemedText>
                  <Pressable onPress={() => setSelectedRecipient(null)}>
                    <ThemedText type="link" themeColor="danger">
                      Change
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : (
                <>
                  <TextInput
                    value={recipientQuery}
                    onChangeText={setRecipientQuery}
                    placeholder="Search by name"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                  {recipientResults.data?.results.map((person) => (
                    <Pressable
                      key={person.id}
                      onPress={() => setSelectedRecipient(person)}
                      style={styles.searchRow}
                    >
                      <ThemedText type="small">
                        {person.display_name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </>
              )}

              <ThemedText type="small" style={styles.label}>
                Message
              </ThemedText>
              <TextInput
                multiline
                value={messageBody}
                onChangeText={setMessageBody}
                placeholder="Write a message..."
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  styles.textarea,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />

              {composeError && (
                <ThemedText type="small" themeColor="danger">
                  {composeError}
                </ThemedText>
              )}
              <Pressable
                disabled={
                  !selectedRecipient ||
                  !messageBody.trim() ||
                  sendMutation.isPending
                }
                onPress={() => sendMutation.mutate()}
                style={[styles.submitButton, { backgroundColor: theme.accent }]}
              >
                <ThemedText type="buttonLabel" themeColor="accentText">
                  SEND
                </ThemedText>
              </Pressable>
            </Card>
          )}
        </>
      )}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Messages
      </ThemedText>
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
  composeButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: Spacing.two,
  },
  label: { marginTop: Spacing.two, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  recipientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchRow: { paddingVertical: Spacing.one },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.three,
  },
});
