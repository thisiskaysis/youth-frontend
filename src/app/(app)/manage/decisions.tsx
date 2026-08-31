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
import { decisionsApi, usersApi } from "@/lib/api/endpoints";
import type { BasicPerson, FollowUp } from "@/lib/api/types";

const DECISION_TYPES = [
  { value: "FIRST_TIME", label: "First-time decision" },
  { value: "RECOMMITMENT", label: "Recommitment" },
  { value: "BAPTISM_INTEREST", label: "Baptism interest" },
  { value: "BAPTISM", label: "Baptism" },
  { value: "NEW_TO_CHURCH", label: "New to church" },
  { value: "OTHER", label: "Other" },
] as const;

const NEXT_FOLLOW_UP_STATUS: Partial<
  Record<FollowUp["status"], FollowUp["status"]>
> = {
  OUTSTANDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

export default function ManageDecisionsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const decisionsQuery = useQuery({
    queryKey: ["manage", "decisions"],
    queryFn: decisionsApi.list,
  });
  const followUpsQuery = useQuery({
    queryKey: ["manage", "decisions", "follow-ups"],
    queryFn: decisionsApi.followUps,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<BasicPerson | null>(
    null,
  );
  const [personQuery, setPersonQuery] = useState("");
  const [decisionType, setDecisionType] =
    useState<(typeof DECISION_TYPES)[number]["value"]>("FIRST_TIME");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const personResults = useQuery({
    queryKey: ["manage", "decisions", "person-search", personQuery],
    queryFn: () => usersApi.search(personQuery),
    enabled: personQuery.length > 0 && !selectedPerson,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["manage", "decisions"] });
  };

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedPerson) throw new Error("Choose who this decision is for.");
      return decisionsApi.create({
        person: selectedPerson.id,
        decision_type: decisionType,
        occurred_at: new Date().toISOString(),
        notes,
      });
    },
    onSuccess: () => {
      setSelectedPerson(null);
      setPersonQuery("");
      setNotes("");
      setFormOpen(false);
      setFormError(null);
      invalidate();
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: FollowUp["status"] }) =>
      decisionsApi.updateFollowUpStatus(id, status),
    onSuccess: invalidate,
  });

  const [assigningDecisionId, setAssigningDecisionId] = useState<number | null>(
    null,
  );
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const assigneeResults = useQuery({
    queryKey: ["manage", "decisions", "assignee-search", assigneeQuery],
    queryFn: () => usersApi.search(assigneeQuery),
    enabled: assigneeQuery.length > 0,
  });

  const assignFollowUpMutation = useMutation({
    mutationFn: ({
      decisionId,
      assigneeId,
    }: {
      decisionId: number;
      assigneeId: number;
    }) => decisionsApi.assignFollowUp(decisionId, assigneeId),
    onSuccess: () => {
      setAssigningDecisionId(null);
      setAssigneeQuery("");
      invalidate();
    },
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Decisions</ThemedText>

      <Pressable
        onPress={() => setFormOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {formOpen ? "CANCEL" : "+ RECORD DECISION"}
        </ThemedText>
      </Pressable>

      {formOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Person
          </ThemedText>
          {selectedPerson ? (
            <ThemedView style={styles.selectedPersonRow}>
              <ThemedText type="small">
                {selectedPerson.display_name}
              </ThemedText>
              <Pressable onPress={() => setSelectedPerson(null)}>
                <ThemedText type="link" themeColor="danger">
                  Change
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <>
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
                <Pressable
                  key={person.id}
                  onPress={() => setSelectedPerson(person)}
                  style={styles.searchRow}
                >
                  <ThemedText type="small">{person.display_name}</ThemedText>
                </Pressable>
              ))}
            </>
          )}

          <ThemedText type="small" style={styles.label}>
            Decision type
          </ThemedText>
          <ThemedView style={styles.typeGrid}>
            {DECISION_TYPES.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => setDecisionType(type.value)}
              >
                <ThemedView
                  type={
                    decisionType === type.value
                      ? "backgroundSelected"
                      : "backgroundElement"
                  }
                  style={styles.typeChip}
                >
                  <ThemedText
                    type="small"
                    themeColor={
                      decisionType === type.value ? "accent" : "textSecondary"
                    }
                  >
                    {type.label}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>

          <ThemedText type="small" style={styles.label}>
            Notes
          </ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
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
            disabled={!selectedPerson || createMutation.isPending}
            onPress={() => createMutation.mutate()}
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <ThemedText type="buttonLabel" themeColor="accentText">
                SAVE
              </ThemedText>
            )}
          </Pressable>
        </Card>
      )}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Follow-up queue
      </ThemedText>
      <AsyncState
        isLoading={followUpsQuery.isLoading}
        isError={followUpsQuery.isError}
        errorMessage="Couldn't load follow-ups."
        onRetry={() => followUpsQuery.refetch()}
        isEmpty={followUpsQuery.data?.results.length === 0}
        emptyMessage="No outstanding follow-ups."
      />
      {followUpsQuery.data?.results.map((followUp) => {
        const nextStatus = NEXT_FOLLOW_UP_STATUS[followUp.status];
        return (
          <Card key={followUp.id} style={styles.card}>
            <ThemedView style={styles.row}>
              <ThemedText type="smallBold">
                {followUp.assignee.display_name}
              </ThemedText>
              {nextStatus && (
                <Pressable
                  disabled={followUpMutation.isPending}
                  onPress={() =>
                    followUpMutation.mutate({
                      id: followUp.id,
                      status: nextStatus,
                    })
                  }
                >
                  <ThemedText type="link" themeColor="accent">
                    Mark {nextStatus.toLowerCase().replace("_", " ")}
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
            <StatusBadge status={followUp.status} />
          </Card>
        );
      })}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Recent decisions
      </ThemedText>
      <AsyncState
        isLoading={decisionsQuery.isLoading}
        isError={decisionsQuery.isError}
        errorMessage="Couldn't load decisions."
        onRetry={() => decisionsQuery.refetch()}
        isEmpty={decisionsQuery.data?.results.length === 0}
        emptyMessage="No decisions recorded yet."
      />
      {decisionsQuery.data?.results.map((decision) => (
        <Card key={decision.id} style={styles.card}>
          <ThemedText type="smallBold">
            {decision.person.display_name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {decision.decision_type.replace(/_/g, " ")} ·{" "}
            {new Date(decision.occurred_at).toLocaleDateString()}
          </ThemedText>

          <ThemedView style={styles.row}>
            {decision.follow_up ? (
              <ThemedText type="small" themeColor="textSecondary">
                Follow-up: {decision.follow_up.assignee.display_name}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No follow-up assigned
              </ThemedText>
            )}
            <Pressable
              onPress={() =>
                setAssigningDecisionId(
                  assigningDecisionId === decision.id ? null : decision.id,
                )
              }
            >
              <ThemedText type="link" themeColor="accent">
                {assigningDecisionId === decision.id
                  ? "Close"
                  : decision.follow_up
                    ? "Reassign"
                    : "Assign follow-up"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {assigningDecisionId === decision.id && (
            <ThemedView style={styles.assignPanel}>
              <ThemedText type="small" themeColor="textSecondary">
                Search for a leader or admin
              </ThemedText>
              <TextInput
                value={assigneeQuery}
                onChangeText={setAssigneeQuery}
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
              {assigneeResults.data?.results.map((person) => (
                <ThemedView key={person.id} style={styles.searchRow}>
                  <ThemedText type="small">{person.display_name}</ThemedText>
                  <Pressable
                    disabled={assignFollowUpMutation.isPending}
                    onPress={() =>
                      assignFollowUpMutation.mutate({
                        decisionId: decision.id,
                        assigneeId: person.id,
                      })
                    }
                  >
                    <ThemedText type="link" themeColor="accent">
                      Assign
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ))}
            </ThemedView>
          )}
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
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.one,
  },
  assignPanel: { marginTop: Spacing.two, gap: Spacing.one },
  selectedPersonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
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
