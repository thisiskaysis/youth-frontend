import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { ridesApi } from "@/lib/api/endpoints";

export default function ManageRidesScreen() {
  const query = useQuery({
    queryKey: ["manage", "rides"],
    queryFn: ridesApi.list,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Rides</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load ride requests."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No ride requests yet."
      />

      {query.data?.results.map((ride) => (
        <Card key={ride.id} style={styles.card}>
          <ThemedText type="smallBold">{ride.person.display_name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {ride.direction === "TO" ? "To church" : "Home"} ·{" "}
            {ride.area || "No area given"}
          </ThemedText>
          <StatusBadge status={ride.status} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
});
