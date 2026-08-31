import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
} from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { prayerApi } from "@/lib/api/endpoints";
import type { PrayerRequest } from "@/lib/api/types";

const NEEDS_REVIEW: PrayerRequest["status"][] = ["PENDING", "ESCALATED"];

export default function ManagePrayerScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["manage", "prayer"],
    queryFn: prayerApi.mine,
  });

  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["manage", "prayer"] });

  const moderateMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: PrayerRequest["status"];
    }) => prayerApi.moderate(id, status),
    onSuccess: invalidate,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      prayerApi.respond(id, body),
    onSuccess: () => {
      setReplyingId(null);
      setReplyBody("");
      setReplyError(null);
    },
    onError: (error) => setReplyError(extractErrorMessage(error)),
  });

  const needsReview =
    query.data?.results.filter((request) =>
      NEEDS_REVIEW.includes(request.status),
    ) ?? [];
  const moderated =
    query.data?.results.filter(
      (request) => !NEEDS_REVIEW.includes(request.status),
    ) ?? [];

  return (
    <ScreenContainer>
      <ThemedText type="display">Prayer Moderation</ThemedText>

      <ThemedText type="subtitle">Needs review</ThemedText>
      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load prayer requests."
        onRetry={() => query.refetch()}
        isEmpty={needsReview.length === 0}
        emptyMessage="Nothing waiting on moderation."
      />
      {needsReview.map((request) => (
        <Card key={request.id} style={styles.card}>
          <ThemedView style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              {request.is_anonymous
                ? "Anonymous"
                : (request.author?.display_name ?? "Anonymous")}{" "}
              ·{" "}
              {request.visibility === "PUBLIC" ? "Public wall" : "Leaders only"}
            </ThemedText>
            <StatusBadge status={request.status} />
          </ThemedView>
          <ThemedText style={styles.body}>{request.body}</ThemedText>

          <ThemedView style={styles.actions}>
            <Pressable
              disabled={moderateMutation.isPending}
              onPress={() =>
                moderateMutation.mutate({ id: request.id, status: "APPROVED" })
              }
            >
              <ThemedText type="link" themeColor="success">
                Approve
              </ThemedText>
            </Pressable>
            <Pressable
              disabled={moderateMutation.isPending}
              onPress={() =>
                moderateMutation.mutate({ id: request.id, status: "HIDDEN" })
              }
            >
              <ThemedText type="link" themeColor="danger">
                Hide
              </ThemedText>
            </Pressable>
            {request.status !== "ESCALATED" && (
              <Pressable
                disabled={moderateMutation.isPending}
                onPress={() =>
                  moderateMutation.mutate({
                    id: request.id,
                    status: "ESCALATED",
                  })
                }
              >
                <ThemedText type="link" themeColor="danger">
                  Escalate
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              onPress={() =>
                setReplyingId(replyingId === request.id ? null : request.id)
              }
            >
              <ThemedText type="link" themeColor="accent">
                {replyingId === request.id ? "Close" : "Reply privately"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {replyingId === request.id && (
            <ThemedView style={styles.replyPanel}>
              <TextInput
                multiline
                value={replyBody}
                onChangeText={setReplyBody}
                placeholder="Write a private reply..."
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
              {replyError && (
                <ThemedText type="small" themeColor="danger">
                  {replyError}
                </ThemedText>
              )}
              <Pressable
                disabled={!replyBody.trim() || respondMutation.isPending}
                onPress={() =>
                  respondMutation.mutate({ id: request.id, body: replyBody })
                }
                style={[styles.submitButton, { backgroundColor: theme.accent }]}
              >
                {respondMutation.isPending ? (
                  <ActivityIndicator color={theme.accentText} />
                ) : (
                  <ThemedText type="buttonLabel" themeColor="accentText">
                    SEND
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          )}
        </Card>
      ))}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Recently moderated
      </ThemedText>
      <AsyncState
        isLoading={false}
        isError={false}
        isEmpty={moderated.length === 0}
        emptyMessage="Nothing moderated yet."
      />
      {moderated.map((request) => (
        <Card key={request.id} style={styles.card}>
          <ThemedView style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              {request.is_anonymous
                ? "Anonymous"
                : (request.author?.display_name ?? "Anonymous")}
            </ThemedText>
            <StatusBadge status={request.status} />
          </ThemedView>
          <ThemedText style={styles.body}>{request.body}</ThemedText>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: { marginTop: Spacing.one },
  sectionSpacing: { marginTop: Spacing.three },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  replyPanel: { marginTop: Spacing.two },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: Spacing.three,
    minHeight: 70,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.two,
  },
});
