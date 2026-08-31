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
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { formsApi, usersApi } from "@/lib/api/endpoints";

export default function ManageFormsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const definitionsQuery = useQuery({
    queryKey: ["manage", "forms", "definitions"],
    queryFn: formsApi.definitions,
  });
  const assignmentsQuery = useQuery({
    queryKey: ["manage", "forms", "assignments"],
    queryFn: formsApi.myAssignments,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [assigningFormId, setAssigningFormId] = useState<number | null>(null);
  const [assignQuery, setAssignQuery] = useState("");
  const assignResults = useQuery({
    queryKey: ["manage", "forms", "assign-search", assignQuery],
    queryFn: () => usersApi.search(assignQuery),
    enabled: assignQuery.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: () => formsApi.createDefinition({ title, description }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setFormOpen(false);
      setFormError(null);
      queryClient.invalidateQueries({
        queryKey: ["manage", "forms", "definitions"],
      });
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const assignMutation = useMutation({
    mutationFn: ({ formId, personId }: { formId: number; personId: number }) =>
      formsApi.assign(formId, [personId]),
    onSuccess: () => {
      setAssignQuery("");
      setAssigningFormId(null);
      queryClient.invalidateQueries({
        queryKey: ["manage", "forms", "assignments"],
      });
    },
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Forms & Consent</ThemedText>

      <Pressable
        onPress={() => setFormOpen((open) => !open)}
        style={[styles.newButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {formOpen ? "CANCEL" : "+ NEW FORM"}
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
            placeholder="Camp Consent Form"
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
            Description
          </ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's this form for?"
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
            disabled={!title.trim() || createMutation.isPending}
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

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Definitions
      </ThemedText>
      <AsyncState
        isLoading={definitionsQuery.isLoading}
        isError={definitionsQuery.isError}
        errorMessage="Couldn't load form definitions."
        onRetry={() => definitionsQuery.refetch()}
        isEmpty={definitionsQuery.data?.results.length === 0}
        emptyMessage="No forms defined yet."
      />
      {definitionsQuery.data?.results.map((form) => (
        <Card key={form.id} style={styles.card}>
          <ThemedView style={styles.row}>
            <ThemedText type="smallBold">{form.title}</ThemedText>
            <Pressable
              onPress={() =>
                setAssigningFormId(assigningFormId === form.id ? null : form.id)
              }
            >
              <ThemedText type="link" themeColor="accent">
                {assigningFormId === form.id ? "Close" : "Assign"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          {assigningFormId === form.id && (
            <ThemedView style={styles.assignPanel}>
              <TextInput
                value={assignQuery}
                onChangeText={setAssignQuery}
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
              {assignResults.data?.results.map((person) => (
                <ThemedView key={person.id} style={styles.searchRow}>
                  <ThemedText type="small">{person.display_name}</ThemedText>
                  <Pressable
                    disabled={assignMutation.isPending}
                    onPress={() =>
                      assignMutation.mutate({
                        formId: form.id,
                        personId: person.id,
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

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Assignments
      </ThemedText>
      <AsyncState
        isLoading={assignmentsQuery.isLoading}
        isError={assignmentsQuery.isError}
        errorMessage="Couldn't load assignments."
        onRetry={() => assignmentsQuery.refetch()}
        isEmpty={assignmentsQuery.data?.results.length === 0}
        emptyMessage="No outstanding assignments."
      />
      {assignmentsQuery.data?.results.map((assignment) => (
        <Card key={assignment.id} style={styles.card}>
          <ThemedText type="smallBold">{assignment.form_title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {assignment.person.display_name} ·{" "}
            {assignment.submission ? "Submitted" : "Outstanding"}
          </ThemedText>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  sectionSpacing: { marginTop: Spacing.three },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.three,
  },
  assignPanel: { marginTop: Spacing.two, gap: Spacing.one },
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.one,
  },
});
