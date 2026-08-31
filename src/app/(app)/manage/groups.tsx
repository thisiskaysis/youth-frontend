import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
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
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { groupsApi } from "@/lib/api/endpoints";
import type { Group } from "@/lib/api/types";

const GROUP_TYPES: { value: Group["group_type"]; label: string }[] = [
  { value: "CONNECT", label: "Connect group" },
  { value: "VOLUNTEER", label: "Volunteer team" },
  { value: "MINISTRY", label: "Ministry team" },
];

export default function ManageGroupsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["manage", "groups"],
    queryFn: groupsApi.list,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState<Group["group_type"]>("CONNECT");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      groupsApi.create({ name, group_type: groupType, description }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setFormOpen(false);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["manage", "groups"] });
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Groups</ThemedText>

      <Pressable
        onPress={() => setFormOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {formOpen ? "CANCEL" : "+ NEW GROUP"}
        </ThemedText>
      </Pressable>

      {formOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Name
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Year 11 Connect Group"
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
            Type
          </ThemedText>
          <ThemedView style={styles.chipRow}>
            {GROUP_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => setGroupType(type.value)}
              >
                <ThemedView
                  type={
                    groupType === type.value
                      ? "backgroundSelected"
                      : "backgroundElement"
                  }
                  style={styles.chip}
                >
                  <ThemedText
                    type="small"
                    themeColor={
                      groupType === type.value ? "accent" : "textSecondary"
                    }
                  >
                    {type.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
          <ThemedText type="small" style={styles.label}>
            Description
          </ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional"
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
          {formError && (
            <ThemedText type="small" themeColor="danger">
              {formError}
            </ThemedText>
          )}
          <Pressable
            disabled={!name.trim() || createMutation.isPending}
            onPress={() => createMutation.mutate()}
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <ThemedText type="buttonLabel" themeColor="accentText">
                CREATE
              </ThemedText>
            )}
          </Pressable>
        </Card>
      )}

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load groups."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No groups yet."
      />
      {query.data?.results.map((group) => (
        <Link key={group.id} href={`/manage/groups/${group.id}`} asChild>
          <Pressable>
            <Card style={styles.card}>
              <ThemedText type="smallBold">{group.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {group.member_count ?? 0} member
                {group.member_count === 1 ? "" : "s"} ·{" "}
                {group.leader_count ?? 0} leader
                {group.leader_count === 1 ? "" : "s"}
              </ThemedText>
            </Card>
          </Pressable>
        </Link>
      ))}
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
  label: { marginTop: Spacing.two, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
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
