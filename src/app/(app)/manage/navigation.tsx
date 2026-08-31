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
import { navigationApi } from "@/lib/api/endpoints";

const DESTINATION_TYPES = ["INTERNAL_SCREEN", "EXTERNAL_URL"] as const;

export default function ManageNavigationScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["manage", "navigation"],
    queryFn: navigationApi.list,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [destinationType, setDestinationType] =
    useState<(typeof DESTINATION_TYPES)[number]>("EXTERNAL_URL");
  const [destinationValue, setDestinationValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["manage", "navigation"] });

  const createMutation = useMutation({
    mutationFn: () =>
      navigationApi.create({
        label,
        destination_type: destinationType,
        destination_value: destinationValue,
      }),
    onSuccess: () => {
      setLabel("");
      setDestinationValue("");
      setFormOpen(false);
      setFormError(null);
      invalidate();
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => navigationApi.publish(id),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: number[]) => navigationApi.reorder(orderedIds),
    onSuccess: invalidate,
  });

  const move = (index: number, direction: -1 | 1) => {
    const items = query.data?.results;
    if (!items) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    reorderMutation.mutate(ids);
  };

  return (
    <ScreenContainer>
      <ThemedText type="display">Navigation</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Custom menu items, ordered top to bottom. Use the arrows to reorder.
      </ThemedText>

      <Pressable
        onPress={() => setFormOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {formOpen ? "CANCEL" : "+ NEW ITEM"}
        </ThemedText>
      </Pressable>

      {formOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Label
          </ThemedText>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Give Online"
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
            Destination type
          </ThemedText>
          <ThemedView style={styles.typeRow}>
            {DESTINATION_TYPES.map((type) => (
              <Pressable key={type} onPress={() => setDestinationType(type)}>
                <ThemedView
                  type={
                    destinationType === type
                      ? "backgroundSelected"
                      : "backgroundElement"
                  }
                  style={styles.typeChip}
                >
                  <ThemedText
                    type="small"
                    themeColor={
                      destinationType === type ? "accent" : "textSecondary"
                    }
                  >
                    {type === "EXTERNAL_URL"
                      ? "External link"
                      : "Internal screen"}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
          <ThemedText type="small" style={styles.label}>
            {destinationType === "EXTERNAL_URL" ? "URL" : "Screen key"}
          </ThemedText>
          <TextInput
            value={destinationValue}
            onChangeText={setDestinationValue}
            placeholder={
              destinationType === "EXTERNAL_URL"
                ? "https://give.example.com"
                : "home"
            }
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            style={[
              styles.input,
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
            disabled={
              !label.trim() ||
              !destinationValue.trim() ||
              createMutation.isPending
            }
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
        errorMessage="Couldn't load navigation items."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No custom navigation items yet."
      />

      {query.data?.results.map((item, index) => (
        <Card key={item.id} style={styles.card}>
          <ThemedView style={styles.row}>
            <ThemedText type="smallBold">{item.label}</ThemedText>
            {item.is_protected && (
              <ThemedText type="small" themeColor="accent">
                Protected
              </ThemedText>
            )}
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {item.destination_type} · {item.destination_value}
          </ThemedText>
          <ThemedView style={styles.cardFooter}>
            <StatusBadge status={item.status} />
            <ThemedView style={styles.actions}>
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
              <Pressable
                disabled={reorderMutation.isPending || index === 0}
                onPress={() => move(index, -1)}
              >
                <ThemedText
                  type="link"
                  themeColor={index === 0 ? "textSecondary" : "accent"}
                >
                  Up
                </ThemedText>
              </Pressable>
              <Pressable
                disabled={
                  reorderMutation.isPending ||
                  index === (query.data?.results.length ?? 1) - 1
                }
                onPress={() => move(index, 1)}
              >
                <ThemedText
                  type="link"
                  themeColor={
                    index === (query.data?.results.length ?? 1) - 1
                      ? "textSecondary"
                      : "accent"
                  }
                >
                  Down
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.one,
  },
  actions: { flexDirection: "row", gap: Spacing.three },
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
  typeRow: { flexDirection: "row", gap: Spacing.two },
  typeChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.three,
  },
});
