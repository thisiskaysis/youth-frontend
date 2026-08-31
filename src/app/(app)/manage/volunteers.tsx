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
import {
    eventsApi,
    groupsApi,
    usersApi,
    volunteersApi,
} from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function ManageVolunteersScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ["manage", "volunteers", "assignments"],
    queryFn: () => volunteersApi.assignments(),
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

  const [rosterOpen, setRosterOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null,
  );
  const [personQuery, setPersonQuery] = useState("");
  const [rosterNotes, setRosterNotes] = useState("");
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [notInTeamPersonId, setNotInTeamPersonId] = useState<number | null>(
    null,
  );
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["manage", "volunteers", "events"],
    queryFn: eventsApi.list,
    enabled: rosterOpen,
  });
  const personResults = useQuery({
    queryKey: ["manage", "volunteers", "person-search", personQuery],
    queryFn: () => usersApi.search(personQuery),
    enabled: personQuery.length > 0,
  });
  const rosterAssignmentsQuery = useQuery({
    queryKey: ["manage", "volunteers", "roster", selectedEventId],
    queryFn: () => volunteersApi.assignments(selectedEventId ?? undefined),
    enabled: selectedEventId != null,
  });

  const resetRosterForm = () => {
    setSelectedPositionId(null);
    setPersonQuery("");
    setRosterNotes("");
    setNotInTeamPersonId(null);
    setRosterError(null);
  };

  const createAssignmentMutation = useMutation({
    mutationFn: ({
      personId,
      addToGroup,
    }: {
      personId: number;
      addToGroup?: boolean;
    }) => {
      if (!selectedEventId || !selectedPositionId) {
        throw new Error("Choose an event and a position first.");
      }
      return volunteersApi.createAssignment({
        event: selectedEventId,
        position: selectedPositionId,
        person: personId,
        notes: rosterNotes,
        add_to_group: addToGroup,
      });
    },
    onSuccess: (result) => {
      resetRosterForm();
      setRosterError(null);
      setNotInTeamPersonId(null);
      setConflictWarning(
        result.conflicts.length > 0
          ? `Heads up: this person has ${result.conflicts.length} other assignment(s) around the same time.`
          : null,
      );
      queryClient.invalidateQueries({
        queryKey: ["manage", "volunteers", "roster", selectedEventId],
      });
    },
    onError: (error, variables) => {
      const data = (
        error as { response?: { data?: { code?: string; detail?: string } } }
      ).response?.data;
      if (data?.code === "NOT_IN_TEAM") {
        setNotInTeamPersonId(variables.personId);
      }
      setRosterError(data?.detail ?? extractErrorMessage(error));
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => {
      if (!selectedEventId) throw new Error("Choose an event first.");
      return volunteersApi.publish(selectedEventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["manage", "volunteers", "roster", selectedEventId],
      });
      invalidate();
    },
    onError: (error) => setRosterError(extractErrorMessage(error)),
  });

  const draftCount =
    rosterAssignmentsQuery.data?.results.filter((a) => a.status === "DRAFT")
      .length ?? 0;

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

      <Pressable
        onPress={() => setRosterOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {rosterOpen ? "CANCEL" : "+ BUILD ROSTER"}
        </ThemedText>
      </Pressable>

      {rosterOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Event
          </ThemedText>
          <AsyncState
            isLoading={eventsQuery.isLoading}
            isError={eventsQuery.isError}
            errorMessage="Couldn't load events."
          />
          <ThemedView style={styles.chipRow}>
            {eventsQuery.data?.results.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => {
                  setSelectedEventId(event.id);
                  resetRosterForm();
                  setConflictWarning(null);
                }}
              >
                <ThemedView
                  type={
                    selectedEventId === event.id
                      ? "backgroundSelected"
                      : "backgroundElement"
                  }
                  style={styles.chip}
                >
                  <ThemedText
                    type="small"
                    themeColor={
                      selectedEventId === event.id ? "accent" : "textSecondary"
                    }
                  >
                    {event.name}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          {selectedEventId && (
            <>
              <ThemedText type="small" style={styles.label}>
                Position
              </ThemedText>
              <ThemedView style={styles.chipRow}>
                {positionsQuery.data?.results.map((position) => (
                  <Pressable
                    key={position.id}
                    onPress={() => setSelectedPositionId(position.id)}
                  >
                    <ThemedView
                      type={
                        selectedPositionId === position.id
                          ? "backgroundSelected"
                          : "backgroundElement"
                      }
                      style={styles.chip}
                    >
                      <ThemedText
                        type="small"
                        themeColor={
                          selectedPositionId === position.id
                            ? "accent"
                            : "textSecondary"
                        }
                      >
                        {position.name}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
              </ThemedView>

              <ThemedText type="small" style={styles.label}>
                Person
              </ThemedText>
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
                  <Pressable
                    disabled={
                      !selectedPositionId || createAssignmentMutation.isPending
                    }
                    onPress={() =>
                      createAssignmentMutation.mutate({ personId: person.id })
                    }
                  >
                    <ThemedText type="link" themeColor="accent">
                      Add to roster
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ))}

              {rosterError && (
                <ThemedText type="small" themeColor="danger">
                  {rosterError}
                </ThemedText>
              )}
              {notInTeamPersonId && (
                <Pressable
                  disabled={createAssignmentMutation.isPending}
                  onPress={() =>
                    createAssignmentMutation.mutate({
                      personId: notInTeamPersonId,
                      addToGroup: true,
                    })
                  }
                >
                  <ThemedText type="link" themeColor="accent">
                    Add them to the team & assign anyway
                  </ThemedText>
                </Pressable>
              )}
              {conflictWarning && (
                <ThemedText type="small" themeColor="danger">
                  {conflictWarning}
                </ThemedText>
              )}

              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.label}
              >
                {draftCount} draft assignment{draftCount === 1 ? "" : "s"} for
                this event
              </ThemedText>
              <Pressable
                disabled={draftCount === 0 || publishMutation.isPending}
                onPress={() => publishMutation.mutate()}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: theme.accent,
                    opacity: draftCount === 0 ? 0.5 : 1,
                  },
                ]}
              >
                {publishMutation.isPending ? (
                  <ActivityIndicator color={theme.accentText} />
                ) : (
                  <ThemedText type="buttonLabel" themeColor="accentText">
                    PUBLISH ROSTER
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
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
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.one,
  },
});
