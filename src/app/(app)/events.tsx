import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { eventsApi } from "@/lib/api/endpoints";

export default function EventsScreen() {
  const query = useQuery({ queryKey: ["events"], queryFn: eventsApi.list });

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        WHAT'S ON
      </ThemedText>
      <ThemedText type="display">Events</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load events."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No events published yet."
      />

      {query.data?.results.map((event) => (
        <Card key={event.id} style={styles.card}>
          <ThemedText type="smallBold">{event.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(event.starts_at).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {event.location ? ` · ${event.location}` : ""}
          </ThemedText>
          <StatusBadge status={event.status} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
});
