import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { formsApi } from "@/lib/api/endpoints";

export default function FillFormScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const id = Number(assignmentId);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["forms", id],
    queryFn: () => formsApi.assignment(id),
  });
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data || query.data.submission) return;
    const initial: Record<string, string | boolean> = {};
    for (const field of query.data.form_schema) {
      initial[field.key] = field.type === "checkbox" ? false : "";
    }
    setAnswers(initial);
  }, [query.data]);

  const submitMutation = useMutation({
    mutationFn: () => formsApi.submit(id, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      router.back();
    },
    onError: (mutationError) => setError(extractErrorMessage(mutationError)),
  });

  const assignment = query.data;
  const missingRequired = assignment?.form_schema.some(
    (field) => field.required && !answers[field.key],
  );

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: assignment?.form_title ?? "Form" }} />
      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load this form."
        onRetry={() => query.refetch()}
      />

      {assignment && (
        <>
          <ThemedText type="display">{assignment.form_title}</ThemedText>
          {assignment.form_description ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.description}
            >
              {assignment.form_description}
            </ThemedText>
          ) : null}

          {assignment.submission ? (
            <Card style={styles.card}>
              <ThemedText type="smallBold">Already submitted</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Submitted{" "}
                {new Date(assignment.submission.created_at).toLocaleString()}
              </ThemedText>
            </Card>
          ) : (
            <>
              {assignment.form_schema.map((field) => (
                <ThemedView key={field.key} style={styles.fieldBlock}>
                  <ThemedText type="small" style={styles.label}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </ThemedText>
                  {field.type === "checkbox" ? (
                    <Pressable
                      onPress={() =>
                        setAnswers((current) => ({
                          ...current,
                          [field.key]: !current[field.key],
                        }))
                      }
                      style={styles.checkboxRow}
                    >
                      <ThemedView
                        type={
                          answers[field.key]
                            ? "backgroundSelected"
                            : "backgroundElement"
                        }
                        style={styles.checkboxBox}
                      >
                        {answers[field.key] ? (
                          <ThemedText themeColor="accent" type="smallBold">
                            ✓
                          </ThemedText>
                        ) : null}
                      </ThemedView>
                      <ThemedText type="small">I agree</ThemedText>
                    </Pressable>
                  ) : (
                    <TextInput
                      value={(answers[field.key] as string) ?? ""}
                      onChangeText={(text) =>
                        setAnswers((current) => ({
                          ...current,
                          [field.key]: text,
                        }))
                      }
                      multiline={field.type === "textarea"}
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.input,
                        field.type === "textarea" && styles.textarea,
                        {
                          color: theme.text,
                          backgroundColor: theme.backgroundElement,
                          borderColor: theme.border,
                        },
                      ]}
                    />
                  )}
                </ThemedView>
              ))}

              {error && (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              )}

              <Pressable
                disabled={missingRequired || submitMutation.isPending}
                onPress={() => submitMutation.mutate()}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: theme.accent,
                    opacity: missingRequired ? 0.5 : 1,
                  },
                ]}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color={theme.accentText} />
                ) : (
                  <ThemedText type="buttonLabel" themeColor="accentText">
                    SUBMIT
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.two },
  description: { marginTop: Spacing.one },
  fieldBlock: { marginTop: Spacing.three },
  label: { marginBottom: Spacing.one },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.four,
  },
});
