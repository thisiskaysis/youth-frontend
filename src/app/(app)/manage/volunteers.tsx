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
import { groupsApi, volunteersApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function ManageVolunteersScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ["manage", "volunteers", "assignments"],
    queryFn: volunteersApi.assignments,
  });
  const positionsQuery = useQuery({
    queryKey: ["manage", "volunteers", "positions"],
    queryFn: () => volunteersApi.positions(),
  });
  const groupsQuery = useQuery({
    queryKey: ["manage", "volunteers", "groups"],
    queryFn: groupsApi.list,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [positionName, setPositionName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["manage", "volunteers"] });
  };

  const createPositionMutation = useMutation({
    mutationFn: () => {
      if (!selectedGroupId) throw new Error("Choose a team first.");
      return volunteersApi.createPosition({
        group: selectedGroupId,
        name: positionName,
      });
    },
    onSuccess: () => {
      setPositionName("");
      setSelectedGroupId(null);
      setFormOpen(false);
      setFormError(null);
      queryClient.invalidateQueries({
        queryKey: ["manage", "volunteers", "positions"],
      });
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      volunteersApi.respond(id, accept),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => volunteersApi.cancel(id),
    onSuccess: invalidate,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Volunteers</ThemedText>

      <Pressable
        onPress={() => setFormOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {formOpen ? "CANCEL" : "+ NEW POSITION"}
        </ThemedText>
      </Pressable>

      {formOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Team
          </ThemedText>
          <ThemedView style={styles.chipRow}>
            {groupsQuery.data?.results.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => setSelectedGroupId(group.id)}
              >
                <ThemedView
                  type={
                    selectedGroupId === group.id
                      ? "backgroundSelected"
                      : "backgroundElement"
                  }
                  style={styles.chip}
                >
                  <ThemedText
                    type="small"
                    themeColor={
                      selectedGroupId === group.id ? "accent" : "textSecondary"
                    }
                  >
                    {group.name}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
          <ThemedText type="small" style={styles.label}>
            Position name
          </ThemedText>
          <TextInput
            value={positionName}
            onChangeText={setPositionName}
            placeholder="MC1, Sound, Drums..."
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
            disabled={
              !positionName.trim() ||
              !selectedGroupId ||
              createPositionMutation.isPending
            }
            onPress={() => createPositionMutation.mutate()}
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
          >
            {createPositionMutation.isPending ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <ThemedText type="buttonLabel" themeColor="accentText">
                CREATE
              </ThemedText>
            )}
          </Pressable>
        </Card>
      )}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Positions
      </ThemedText>
      <AsyncState
        isLoading={positionsQuery.isLoading}
        isError={positionsQuery.isError}
        errorMessage="Couldn't load positions."
        onRetry={() => positionsQuery.refetch()}
        isEmpty={positionsQuery.data?.results.length === 0}
        emptyMessage="No positions set up yet."
      />
      {positionsQuery.data?.results.map((position) => (
        <Card key={position.id} style={styles.card}>
          <ThemedText type="smallBold">{position.name}</ThemedText>
        </Card>
      ))}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Assignments
      </ThemedText>
      <AsyncState
        isLoading={assignmentsQuery.isLoading}
        isError={assignmentsQuery.isError}
        errorMessage="Couldn't load volunteer assignments."
        onRetry={() => assignmentsQuery.refetch()}
        isEmpty={assignmentsQuery.data?.results.length === 0}
        emptyMessage="No volunteer assignments yet."
      />

      {assignmentsQuery.data?.results.map((assignment) => {
        const isMine = assignment.person.id === user?.id;
        const canRespond = isMine && assignment.status === "PENDING";
        const canCancel =
          assignment.status !== "CANCELLED" &&
          assignment.status !== "COMPLETED";
        return (
          <Card key={assignment.id} style={styles.card}>
            <ThemedText type="smallBold">{assignment.position_name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {assignment.person.display_name}
            </ThemedText>
            <ThemedView style={styles.cardFooter}>
              <StatusBadge status={assignment.status} />
              <ThemedView style={styles.actions}>
                {canRespond && (
                  <>
                    <Pressable
                      disabled={respondMutation.isPending}
                      onPress={() =>
                        respondMutation.mutate({
                          id: assignment.id,
                          accept: true,
                        })
                      }
                    >
                      <ThemedText type="link" themeColor="accent">
                        Accept
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      disabled={respondMutation.isPending}
                      onPress={() =>
                        respondMutation.mutate({
                          id: assignment.id,
                          accept: false,
                        })
                      }
                    >
                      <ThemedText type="link" themeColor="danger">
                        Decline
                      </ThemedText>
                    </Pressable>
                  </>
                )}
                {canCancel && (
                  <Pressable
                    disabled={cancelMutation.isPending}
                    onPress={() => cancelMutation.mutate(assignment.id)}
                  >
                    <ThemedText type="link" themeColor="danger">
                      Cancel
                    </ThemedText>
                  </Pressable>
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
  actions: { flexDirection: "row", gap: Spacing.three },
  sectionSpacing: { marginTop: Spacing.three },
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
