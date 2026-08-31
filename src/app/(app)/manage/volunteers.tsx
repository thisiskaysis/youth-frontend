import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { volunteersApi } from "@/lib/api/endpoints";

export default function ManageVolunteersScreen() {
  const query = useQuery({
    queryKey: ["manage", "volunteers"],
    queryFn: volunteersApi.assignments,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Volunteers</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load volunteer assignments."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No volunteer assignments yet."
      />

      {query.data?.results.map((assignment) => (
        <Card key={assignment.id} style={styles.card}>
          <ThemedText type="smallBold">{assignment.position.name}</ThemedText>
          <StatusBadge status={assignment.status} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
});
