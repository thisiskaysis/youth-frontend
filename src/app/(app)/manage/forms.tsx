import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { formsApi } from "@/lib/api/endpoints";

export default function ManageFormsScreen() {
  const definitionsQuery = useQuery({
    queryKey: ["manage", "forms", "definitions"],
    queryFn: formsApi.definitions,
  });
  const assignmentsQuery = useQuery({
    queryKey: ["manage", "forms", "assignments"],
    queryFn: formsApi.myAssignments,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Forms & Consent</ThemedText>

      <ThemedText type="subtitle">Definitions</ThemedText>
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
          <ThemedText type="smallBold">{form.title}</ThemedText>
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
          <ThemedText type="smallBold">{assignment.form.title}</ThemedText>
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
});
