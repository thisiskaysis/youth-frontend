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
import { contentApi } from "@/lib/api/endpoints";

export default function ManageContentScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["manage", "content"],
    queryFn: contentApi.list,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => contentApi.create({ title, body }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setFormOpen(false);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["manage", "content"] });
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => contentApi.publish(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["manage", "content"] }),
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Newsfeed</ThemedText>

      <Pressable
        onPress={() => setFormOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {formOpen ? "CANCEL" : "+ NEW POST"}
        </ThemedText>
      </Pressable>

      {formOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Title
          </ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Camp sign-ups are open"
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
          <ThemedText type="small" style={styles.label}>
            Body
          </ThemedText>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Tell everyone what's happening..."
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[
              styles.input,
              styles.multiline,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />
          {formError && (
            <ThemedText type="small" themeColor="danger">
              {formError}
            </ThemedText>
          )}
          <Pressable
            disabled={!title.trim() || !body.trim() || createMutation.isPending}
            onPress={() => createMutation.mutate()}
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <ThemedText type="buttonLabel" themeColor="accentText">
                CREATE (DRAFT)
              </ThemedText>
            )}
          </Pressable>
        </Card>
      )}

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load content items."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="Nothing posted yet."
      />

      {query.data?.results.map((item) => (
        <Card key={item.id} style={styles.card}>
          <ThemedText type="smallBold">{item.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {item.body}
          </ThemedText>
          <ThemedView style={styles.cardFooter}>
            <StatusBadge status={item.status} />
            {item.status === "DRAFT" && (
              <Pressable
                disabled={publishMutation.isPending}
                onPress={() => publishMutation.mutate(item.id)}
              >
                <ThemedText type="link" themeColor="accent">
                  Publish
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.one,
  },
  newButton: {
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
  multiline: { minHeight: 90, textAlignVertical: "top" },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.three,
  },
});
