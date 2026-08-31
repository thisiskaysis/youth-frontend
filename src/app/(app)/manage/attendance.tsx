import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { attendanceApi } from "@/lib/api/endpoints";

export default function ManageAttendanceScreen() {
  const query = useQuery({
    queryKey: ["manage", "attendance", "sessions"],
    queryFn: attendanceApi.sessions,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Attendance</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Sessions are opened per event. Full QR scanner check-in comes in a later
        pass - this view proves the session data is flowing from the backend.
      </ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load attendance sessions."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.results.length === 0}
        emptyMessage="No attendance sessions yet."
      />

      {query.data?.results.map((session) => (
        <Card key={session.id} style={styles.card}>
          <ThemedText type="smallBold">Session #{session.id}</ThemedText>
          <StatusBadge status={session.status} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
});
