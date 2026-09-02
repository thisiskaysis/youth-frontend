import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AsyncState } from "@/components/async-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { inboxApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function ConversationScreen() {
  const { personId, name } = useLocalSearchParams<{
    personId: string;
    name?: string;
  }>();
  const otherId = Number(personId);
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const threadQuery = useQuery({
    queryKey: ["inbox", "thread", otherId],
    queryFn: () => inboxApi.thread(otherId),
    refetchInterval: 4000,
  });

  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: (text: string) => inboxApi.send(otherId, text),
    onSuccess: () => {
      setBody("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["inbox", "thread", otherId] });
      queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const messages = threadQuery.data?.results ?? [];
  const otherParticipant =
    messages.find((message) => message.sender.id !== user?.id)?.sender ??
    messages.find((message) => message.recipient.id !== user?.id)?.recipient;
  const title = name ?? otherParticipant?.display_name ?? "Messages";

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen options={{ title }} />
      <SafeAreaView style={styles.fill} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.select({ ios: 90, default: 0 })}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.fill}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            <AsyncState
              isLoading={threadQuery.isLoading}
              isError={threadQuery.isError}
              errorMessage="Couldn't load this conversation."
              onRetry={() => threadQuery.refetch()}
              isEmpty={messages.length === 0}
              emptyMessage="No messages yet - say hi!"
            />
            {messages.map((message) => {
              const isMine = message.sender.id === user?.id;
              return (
                <ThemedView
                  key={message.id}
                  style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}
                >
                  <ThemedView
                    type={isMine ? "backgroundSelected" : "backgroundElement"}
                    style={[styles.bubble, isMine && styles.bubbleMine]}
                  >
                    <ThemedText type="small">{message.body}</ThemedText>
                  </ThemedView>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.timestamp}
                  >
                    {new Date(message.created_at).toLocaleTimeString(
                      undefined,
                      {
                        hour: "numeric",
                        minute: "2-digit",
                      },
                    )}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </ScrollView>

          {error && (
            <ThemedText type="small" themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}
          <ThemedView
            style={[styles.inputRow, { borderTopColor: theme.border }]}
          >
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            />
            <Pressable
              disabled={!body.trim() || sendMutation.isPending}
              onPress={() => sendMutation.mutate(body.trim())}
              style={[
                styles.sendButton,
                { backgroundColor: theme.accent },
                (!body.trim() || sendMutation.isPending) &&
                  styles.sendButtonDisabled,
              ]}
            >
              <ThemedText type="buttonLabel" themeColor="accentText">
                SEND
              </ThemedText>
            </Pressable>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  messages: {
    padding: Spacing.four,
    gap: Spacing.one,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bubbleRow: {
    maxWidth: "80%",
    marginBottom: Spacing.two,
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubbleRowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bubbleMine: { borderTopRightRadius: 4 },
  timestamp: { marginTop: 2, fontSize: 11 },
  error: { paddingHorizontal: Spacing.four },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  sendButtonDisabled: { opacity: 0.5 },
});
