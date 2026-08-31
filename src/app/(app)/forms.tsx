import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { formsApi } from "@/lib/api/endpoints";

export default function MyFormsScreen() {
  const query = useQuery({
    queryKey: ["forms", "mine"],
    queryFn: formsApi.myAssignments,
  });

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        FORMS
      </ThemedText>
      <ThemedText type="display">My Forms</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load your forms."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="Nothing assigned to you right now."
      />

      {query.data?.results.map((assignment) => (
        <Link key={assignment.id} href={`/forms/${assignment.id}`} asChild>
          <Pressable>
            <Card style={styles.card}>
              <ThemedView style={styles.row}>
                <ThemedText type="smallBold">
                  {assignment.form_title}
                </ThemedText>
                <StatusBadge status={assignment.status} />
              </ThemedView>
              {assignment.due_at ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Due {new Date(assignment.due_at).toLocaleDateString()}
                </ThemedText>
              ) : null}
            </Card>
          </Pressable>
        </Link>
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
});
