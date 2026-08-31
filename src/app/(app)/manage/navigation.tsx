import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { navigationApi } from "@/lib/api/endpoints";

export default function ManageNavigationScreen() {
  const query = useQuery({
    queryKey: ["manage", "navigation"],
    queryFn: navigationApi.list,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Navigation</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Custom menu items, ordered by sort_order. Drag-to-reorder comes later.
      </ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load navigation items."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No custom navigation items yet."
      />

      {query.data?.results.map((item) => (
        <Card key={item.id} style={styles.card}>
          <ThemedView style={styles.row}>
            <ThemedText type="smallBold">{item.label}</ThemedText>
            {item.is_protected && (
              <ThemedText type="small" themeColor="accent">
                Protected
              </ThemedText>
            )}
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {item.destination_type} · {item.destination_value}
          </ThemedText>
          <StatusBadge status={item.status} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  row: { flexDirection: "row", justifyContent: "space-between" },
});
