import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { ridesApi } from "@/lib/api/endpoints";
import type { RideRequest } from "@/lib/api/types";

const DIRECTION_LABEL: Record<RideRequest["direction"], string> = {
  TO_CHURCH: "To church",
  HOME: "Home",
  BOTH: "Round trip",
};

const NEXT_STATUS: Partial<
  Record<RideRequest["status"], RideRequest["status"]>
> = {
  REQUESTED: "ARRANGING",
  ARRANGING: "CONFIRMED",
  CONFIRMED: "COMPLETED",
};

export default function ManageRidesScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["manage", "rides"],
    queryFn: ridesApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: RideRequest["status"];
    }) => ridesApi.updateStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["manage", "rides"] }),
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

      {query.data?.results.map((ride) => {
        const nextStatus = NEXT_STATUS[ride.status];
        const canCancel =
          ride.status !== "COMPLETED" && ride.status !== "CANCELLED";
        return (
          <Card key={ride.id} style={styles.card}>
            <ThemedText type="smallBold">{ride.person.display_name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {DIRECTION_LABEL[ride.direction]} · {ride.area || "No area given"}
            </ThemedText>
            <ThemedView style={styles.cardFooter}>
              <StatusBadge status={ride.status} />
              <ThemedView style={styles.actions}>
                {nextStatus && (
                  <Pressable
                    disabled={updateMutation.isPending}
                    onPress={() =>
                      updateMutation.mutate({ id: ride.id, status: nextStatus })
                    }
                  >
                    <ThemedText type="link" themeColor="accent">
                      Mark {nextStatus.toLowerCase()}
                    </ThemedText>
                  </Pressable>
                )}
                {canCancel && (
                  <Pressable
                    disabled={updateMutation.isPending}
                    onPress={() =>
                      updateMutation.mutate({
                        id: ride.id,
                        status: "CANCELLED",
                      })
                    }
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
});
