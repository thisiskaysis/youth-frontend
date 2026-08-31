import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { groupsApi, usersApi } from "@/lib/api/endpoints";
import type { GroupMembershipEntry } from "@/lib/api/types";

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = Number(groupId);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["manage", "groups", id],
    queryFn: () => groupsApi.detail(id),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [personQuery, setPersonQuery] = useState("");
  const personResults = useQuery({
    queryKey: ["manage", "groups", id, "person-search", personQuery],
    queryFn: () => usersApi.search(personQuery),
    enabled: personQuery.length > 0,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["manage", "groups", id] });

  const addMemberMutation = useMutation({
    mutationFn: ({
      personId,
      role,
    }: {
      personId: number;
      role: GroupMembershipEntry["membership_role"];
    }) => groupsApi.addMember(id, personId, role),
    onSuccess: () => {
      setPersonQuery("");
      setAddOpen(false);
      invalidate();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (membershipId: number) => groupsApi.removeMember(membershipId),
    onSuccess: invalidate,
  });

  const toggleLeaderMutation = useMutation({
    mutationFn: ({
      membershipId,
      role,
    }: {
      membershipId: number;
      role: GroupMembershipEntry["membership_role"];
    }) => groupsApi.updateMembership(membershipId, { membership_role: role }),
    onSuccess: invalidate,
  });

  const group = query.data;
  const activeMemberships = group?.memberships.filter((m) => m.is_active) ?? [];

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: group?.name ?? "Group" }} />
      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load this group."
        onRetry={() => query.refetch()}
      />

      {group && (
        <>
          <ThemedText type="display">{group.name}</ThemedText>
          {group.description ? (
            <ThemedText type="small" themeColor="textSecondary">
              {group.description}
            </ThemedText>
          ) : null}

          <Pressable
            onPress={() => setAddOpen((open) => !open)}
            style={[styles.newButton, { backgroundColor: theme.accent }]}
          >
            <ThemedText type="buttonLabel" themeColor="accentText">
              {addOpen ? "CANCEL" : "+ ADD MEMBER"}
            </ThemedText>
          </Pressable>

          {addOpen && (
            <Card>
              <TextInput
                value={personQuery}
                onChangeText={setPersonQuery}
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
              {personResults.data?.results.map((person) => (
                <ThemedView key={person.id} style={styles.searchRow}>
                  <ThemedText type="small">{person.display_name}</ThemedText>
                  <ThemedView style={styles.searchActions}>
                    <Pressable
                      disabled={addMemberMutation.isPending}
                      onPress={() =>
                        addMemberMutation.mutate({
                          personId: person.id,
                          role: "MEMBER",
                        })
                      }
                    >
                      <ThemedText type="link" themeColor="accent">
                        Add as member
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      disabled={addMemberMutation.isPending}
                      onPress={() =>
                        addMemberMutation.mutate({
                          personId: person.id,
                          role: "LEADER",
                        })
                      }
                    >
                      <ThemedText type="link" themeColor="accent">
                        Add as leader
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              ))}
            </Card>
          )}

          <ThemedText type="subtitle" style={styles.sectionSpacing}>
            Members ({activeMemberships.length})
          </ThemedText>
          <AsyncState
            isLoading={false}
            isError={false}
            isEmpty={activeMemberships.length === 0}
            emptyMessage="Nobody in this group yet."
          />
          {activeMemberships.map((membership) => (
            <Card key={membership.id} style={styles.card}>
              <ThemedView style={styles.row}>
                <ThemedView>
                  <ThemedText type="smallBold">
                    {membership.person.display_name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {membership.membership_role === "LEADER"
                      ? "Leader"
                      : "Member"}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.searchActions}>
                  <Pressable
                    disabled={toggleLeaderMutation.isPending}
                    onPress={() =>
                      toggleLeaderMutation.mutate({
                        membershipId: membership.id,
                        role:
                          membership.membership_role === "LEADER"
                            ? "MEMBER"
                            : "LEADER",
                      })
                    }
                  >
                    <ThemedText type="link" themeColor="accent">
                      {membership.membership_role === "LEADER"
                        ? "Make member"
                        : "Make leader"}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    disabled={removeMemberMutation.isPending}
                    onPress={() => removeMemberMutation.mutate(membership.id)}
                  >
                    <ThemedText type="link" themeColor="danger">
                      Remove
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              </ThemedView>
            </Card>
          ))}
        </>
      )}
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
  sectionSpacing: { marginTop: Spacing.three },
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.one,
  },
  searchActions: { flexDirection: "row", gap: Spacing.three },
});
