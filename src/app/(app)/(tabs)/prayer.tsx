import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Switch,
    TextInput,
} from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { NotificationsButton } from "@/components/notifications-button";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { prayerApi } from "@/lib/api/endpoints";

export default function PrayerScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["prayer", "wall"],
    queryFn: prayerApi.wall,
  });

  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      prayerApi.create({
        body,
        visibility: "PUBLIC",
        is_anonymous: isAnonymous,
      }),
    onSuccess: () => {
      setBody("");
      setIsAnonymous(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["prayer"] });
    },
    onError: (mutationError) => setError(extractErrorMessage(mutationError)),
  });

  const prayMutation = useMutation({
    mutationFn: (id: number) => prayerApi.pray(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prayer"] }),
  });

  return (
    <ScreenContainer clearFloatingTabBar>
      <TopBar right={<NotificationsButton />} />
      <ThemedText type="eyebrow" themeColor="accent">
        PRAYER
      </ThemedText>
      <ThemedText type="display">Prayer Wall</ThemedText>

      <Card>
        <ThemedText type="smallBold">Share a request</ThemedText>
        <TextInput
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="What's on your heart?"
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
        <ThemedView style={styles.anonRow}>
          <ThemedText type="small">Post anonymously</ThemedText>
          <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
        </ThemedView>
        {error && (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        )}
        <Pressable
          disabled={!body.trim() || createMutation.isPending}
          onPress={() => createMutation.mutate()}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.accent,
              opacity: pressed || !body.trim() ? 0.7 : 1,
            },
          ]}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={theme.accentText} />
          ) : (
            <ThemedText type="buttonLabel" themeColor="accentText">
              SUBMIT
            </ThemedText>
          )}
        </Pressable>
      </Card>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load the prayer wall."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No requests on the wall yet."
      />

      {query.data?.results.map((request) => (
        <Card key={request.id} style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            {request.is_anonymous
              ? "Anonymous"
              : (request.author?.display_name ?? "Anonymous")}
          </ThemedText>
          <ThemedText>{request.body}</ThemedText>
          <ThemedView style={styles.cardFooter}>
            <StatusBadge status={request.status} />
            <Pressable onPress={() => prayMutation.mutate(request.id)}>
              <ThemedText type="link" themeColor="accent">
                🙏 I prayed{" "}
                {request.prayed_count ? `(${request.prayed_count})` : ""}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: Spacing.three,
    minHeight: 80,
    textAlignVertical: "top",
    marginTop: Spacing.two,
  },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.two,
  },
  button: {
    marginTop: Spacing.two,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  card: { marginTop: Spacing.one },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.one,
  },
});
