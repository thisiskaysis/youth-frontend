import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { decisionsApi } from "@/lib/api/endpoints";

export default function ManageDecisionsScreen() {
  const decisionsQuery = useQuery({
    queryKey: ["manage", "decisions"],
    queryFn: decisionsApi.list,
  });
  const followUpsQuery = useQuery({
    queryKey: ["manage", "decisions", "follow-ups"],
    queryFn: decisionsApi.followUps,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Decisions</ThemedText>

      <ThemedText type="subtitle">Follow-up queue</ThemedText>
      <AsyncState
        isLoading={followUpsQuery.isLoading}
        isError={followUpsQuery.isError}
        errorMessage="Couldn't load follow-ups."
        onRetry={() => followUpsQuery.refetch()}
        isEmpty={followUpsQuery.data?.results.length === 0}
        emptyMessage="No outstanding follow-ups."
      />
      {followUpsQuery.data?.results.map((followUp) => (
        <Card key={followUp.id} style={styles.card}>
          <ThemedText type="smallBold">
            {followUp.assignee.display_name}
          </ThemedText>
          <StatusBadge status={followUp.status} />
        </Card>
      ))}

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
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  sectionSpacing: { marginTop: Spacing.three },
});
