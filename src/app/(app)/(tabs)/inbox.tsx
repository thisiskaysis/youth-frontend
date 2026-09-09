import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { NotificationsButton } from "@/components/notifications-button";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { inboxApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime, initialFor } from "@/lib/format";

export default function InboxScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const conversationsQuery = useQuery({
    queryKey: ["inbox", "conversations"],
    queryFn: inboxApi.conversations,
    refetchInterval: 10000,
  });

  const [composeOpen, setComposeOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const contactsQuery = useQuery({
    queryKey: ["inbox", "contacts", contactQuery],
    queryFn: () => inboxApi.contacts(contactQuery),
    enabled: composeOpen && contactQuery.length > 0,
  });

  const openThread = (personId: number, name: string, image?: string | null) => {
    setComposeOpen(false);
    setContactQuery("");
    router.push({
      pathname: "/inbox/[personId]",
      params: { personId: String(personId), name, ...(image ? { image } : {}) },
    });
  };

  const conversations = conversationsQuery.data ?? [];

  return (
    <ScreenContainer clearFloatingTabBar>
      <TopBar right={<NotificationsButton />} />
      <ThemedText type="eyebrow" themeColor="accent">
        MESSAGES
      </ThemedText>
      <ThemedText type="display">Messages</ThemedText>

      <Pressable
        onPress={() => setComposeOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {composeOpen ? "CANCEL" : "+ NEW MESSAGE"}
        </ThemedText>
      </Pressable>

      {composeOpen && (
        <Card>
          <TextInput
            value={contactQuery}
            onChangeText={setContactQuery}
            placeholder="Search by name"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />
          {contactQuery.length > 0 &&
            contactsQuery.data?.results.length === 0 && (
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyHint}
              >
                No matches.
              </ThemedText>
            )}
          {contactsQuery.data?.results.map((person) => (
            <Pressable
              key={person.id}
              onPress={() =>
                openThread(person.id, person.display_name, person.profile_image)
              }
              style={styles.searchRow}
            >
              <Avatar
                uri={person.profile_image}
                label={initialFor(person.display_name)}
                size={32}
              />
              <ThemedText type="small">{person.display_name}</ThemedText>
            </Pressable>
          ))}
        </Card>
      )}

      <AsyncState
        isLoading={conversationsQuery.isLoading}
        isError={conversationsQuery.isError}
        errorMessage="Couldn't load messages."
        onRetry={() => conversationsQuery.refetch()}
        isEmpty={conversations.length === 0}
        emptyMessage="No conversations yet - start one above."
      />
      {conversations.map((conversation) => {
        const isMine = conversation.last_message.sender.id === user?.id;
        return (
          <Pressable
            key={conversation.participant.id}
            onPress={() =>
              openThread(
                conversation.participant.id,
                conversation.participant.display_name,
                conversation.participant.profile_image,
              )
            }
          >
            <Card style={styles.card}>
              <ThemedView style={styles.row}>
                <Avatar
                  uri={conversation.participant.profile_image}
                  label={initialFor(conversation.participant.display_name)}
                  size={44}
                />
                <ThemedView style={styles.rowText}>
                  <ThemedView style={styles.rowHeader}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {conversation.participant.display_name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatRelativeTime(conversation.last_message.created_at)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText
                    type="small"
                    themeColor={
                      conversation.unread_count > 0 ? "text" : "textSecondary"
                    }
                    numberOfLines={1}
                  >
                    {isMine
                      ? `You: ${conversation.last_message.body}`
                      : conversation.last_message.body}
                  </ThemedText>
                </ThemedView>
                {conversation.unread_count > 0 && (
                  <ThemedView
                    style={[
                      styles.unreadDot,
                      { backgroundColor: theme.accent },
                    ]}
                  />
                )}
              </ThemedView>
            </Card>
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  newButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: Spacing.two,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  emptyHint: { paddingVertical: Spacing.one },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  rowText: { flex: 1, gap: 2 },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
});
