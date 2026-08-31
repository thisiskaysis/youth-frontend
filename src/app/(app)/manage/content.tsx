import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { contentApi } from "@/lib/api/endpoints";

export default function ManageContentScreen() {
  const query = useQuery({
    queryKey: ["manage", "content"],
    queryFn: contentApi.list,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Newsfeed</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load content items."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="Nothing posted yet."
      />

      {query.data?.results.map((item) => (
        <Card key={item.id} style={styles.card}>
          <ThemedText type="smallBold">{item.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {item.body}
          </ThemedText>
          <StatusBadge status={item.status} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
});
