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
import { formsApi, usersApi } from "@/lib/api/endpoints";
import type { FormField } from "@/lib/api/types";

const FIELD_TYPES: FormField["type"][] = ["text", "textarea", "checkbox"];
let nextFieldId = 0;

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
  const [fields, setFields] = useState<(FormField & { key: string })[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const addField = () => {
    nextFieldId += 1;
    setFields((current) => [
      ...current,
      { key: `field_${nextFieldId}`, label: "", type: "text", required: false },
    ]);
  };
  const updateField = (index: number, patch: Partial<FormField>) => {
    setFields((current) =>
      current.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  };
  const removeField = (index: number) => {
    setFields((current) => current.filter((_, i) => i !== index));
  };

  const [assigningFormId, setAssigningFormId] = useState<number | null>(null);
  const [assignQuery, setAssignQuery] = useState("");
  const assignResults = useQuery({
    queryKey: ["manage", "forms", "assign-search", assignQuery],
    queryFn: () => usersApi.search(assignQuery),
    enabled: assignQuery.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      formsApi.createDefinition({
        title,
        description,
        schema: fields.map(({ key, label, type, required }) => ({
          key,
          label,
          type,
          required,
        })),
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setFields([]);
      setFormOpen(false);
      setFormError(null);
      queryClient.invalidateQueries({
        queryKey: ["manage", "forms", "definitions"],
      });
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => formsApi.updateDefinitionStatus(id, "ACTIVE"),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["manage", "forms", "definitions"],
      }),
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

          <ThemedView style={styles.row}>
            <ThemedText type="small" style={styles.label}>
              Questions
            </ThemedText>
            <Pressable onPress={addField}>
              <ThemedText type="link" themeColor="accent">
                + Add question
              </ThemedText>
            </Pressable>
          </ThemedView>
          {fields.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              No questions yet - the form will just be a plain acknowledgement.
            </ThemedText>
          )}
          {fields.map((field, index) => (
            <ThemedView key={index} style={styles.fieldRow}>
              <TextInput
                value={field.label}
                onChangeText={(label) => updateField(index, { label })}
                placeholder="Question label"
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
              <ThemedView style={styles.fieldRowActions}>
                <ThemedView style={styles.typeGrid}>
                  {FIELD_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => updateField(index, { type })}
                    >
                      <ThemedView
                        type={
                          field.type === type
                            ? "backgroundSelected"
                            : "backgroundElement"
                        }
                        style={styles.typeChip}
                      >
                        <ThemedText
                          type="small"
                          themeColor={
                            field.type === type ? "accent" : "textSecondary"
                          }
                        >
                          {type}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  ))}
                </ThemedView>
                <Pressable
                  onPress={() =>
                    updateField(index, { required: !field.required })
                  }
                >
                  <ThemedText
                    type="small"
                    themeColor={field.required ? "accent" : "textSecondary"}
                  >
                    {field.required ? "Required" : "Optional"}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => removeField(index)}>
                  <ThemedText type="small" themeColor="danger">
                    Remove
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          ))}

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
            <StatusBadge status={form.status} />
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {form.schema.length} question{form.schema.length === 1 ? "" : "s"}
          </ThemedText>
          <ThemedView style={styles.row}>
            {form.status === "DRAFT" ? (
              <Pressable
                disabled={activateMutation.isPending}
                onPress={() => activateMutation.mutate(form.id)}
              >
                <ThemedText type="link" themeColor="success">
                  Activate
                </ThemedText>
              </Pressable>
            ) : (
              <ThemedView />
            )}
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
  fieldRow: { marginTop: Spacing.two, gap: Spacing.one },
  fieldRowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  typeGrid: { flexDirection: "row", gap: Spacing.one },
  typeChip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
});
