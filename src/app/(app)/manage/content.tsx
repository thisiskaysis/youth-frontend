import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ContentComposer } from "@/components/content-composer";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { contentApi } from "@/lib/api/endpoints";
import type { ContentItem } from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";
import { confirmAsync } from "@/lib/confirm";

export default function ManageContentScreen() {
  const theme = useTheme();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["manage", "content"],
    queryFn: () => contentApi.list({ mine: true }),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const closeForm = () => {
    setFormOpen(false);
    setEditingItem(null);
  };

  const startEditing = (item: ContentItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const invalidateFeeds = () => {
    queryClient.invalidateQueries({ queryKey: ["manage", "content"] });
    queryClient.invalidateQueries({ queryKey: ["home", "feed"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contentApi.remove(id),
    onSuccess: invalidateFeeds,
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => contentApi.publish(id),
    onSuccess: invalidateFeeds,
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAsync(
      "Delete post?",
      "This can't be undone.",
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <ScreenContainer>
      <ThemedText type="display">Newsfeed</ThemedText>

      <Pressable
        onPress={() => setFormOpen(true)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          + NEW POST
        </ThemedText>
      </Pressable>

      <ContentComposer
        visible={formOpen}
        editingItem={editingItem}
        onDone={closeForm}
        onCancel={closeForm}
      />

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load content items."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="Nothing posted yet."
      />

      {query.data?.results.map((item) => {
        const canManage = item.author?.id === user?.id || isAdmin;
        return (
          <Card key={item.id} style={styles.card}>
            <ThemedText type="smallBold">{item.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {item.body}
            </ThemedText>
            <ThemedView style={styles.cardFooter}>
              <StatusBadge status={item.status} />
              <ThemedView style={styles.cardActions}>
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
                {canManage && (
                  <>
                    <Pressable onPress={() => startEditing(item)}>
                      <ThemedText type="link" themeColor="accent">
                        Edit
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      disabled={deleteMutation.isPending}
                      onPress={() => handleDelete(item.id)}
                    >
                      <ThemedText type="link" themeColor="danger">
                        Delete
                      </ThemedText>
                    </Pressable>
                  </>
                )}
              </ThemedView>
            </ThemedView>
          </Card>
        );
      })}
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
  cardActions: {
    flexDirection: "row",
    gap: Spacing.three,
    alignItems: "center",
  },
  newButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: Spacing.two,
  },
});

