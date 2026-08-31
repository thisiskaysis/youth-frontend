import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { reportingApi } from "@/lib/api/endpoints";

const TITLES: Record<string, string> = {
  "attendance-trend": "Attendance trend",
  attendance: "Attendance log",
  "first-time-visitors": "First-time visitors",
  "unassigned-youth": "Unassigned youth",
  decisions: "Decisions",
  "outstanding-followups": "Outstanding follow-ups",
  "outstanding-consent": "Outstanding consent",
  rides: "Rides",
};

export default function ReportingDrilldownScreen() {
  const { report } = useLocalSearchParams<{ report: string }>();

  const trendQuery = useQuery({
    queryKey: ["reporting", "attendance-trend"],
    queryFn: () => reportingApi.attendanceTrend(),
    enabled: report === "attendance-trend",
  });
  const attendanceQuery = useQuery({
    queryKey: ["reporting", "attendance"],
    queryFn: reportingApi.attendanceDrilldown,
    enabled: report === "attendance",
  });
  const firstTimeQuery = useQuery({
    queryKey: ["reporting", "first-time-visitors"],
    queryFn: reportingApi.firstTimeVisitors,
    enabled: report === "first-time-visitors",
  });
  const unassignedQuery = useQuery({
    queryKey: ["reporting", "unassigned-youth"],
    queryFn: reportingApi.unassignedYouth,
    enabled: report === "unassigned-youth",
  });
  const decisionsQuery = useQuery({
    queryKey: ["reporting", "decisions"],
    queryFn: reportingApi.decisionsDrilldown,
    enabled: report === "decisions",
  });
  const followUpsQuery = useQuery({
    queryKey: ["reporting", "outstanding-followups"],
    queryFn: reportingApi.outstandingFollowUps,
    enabled: report === "outstanding-followups",
  });
  const consentQuery = useQuery({
    queryKey: ["reporting", "outstanding-consent"],
    queryFn: reportingApi.outstandingConsent,
    enabled: report === "outstanding-consent",
  });
  const ridesQuery = useQuery({
    queryKey: ["reporting", "rides"],
    queryFn: reportingApi.ridesDrilldown,
    enabled: report === "rides",
  });

  const activeQuery =
    {
      "attendance-trend": trendQuery,
      attendance: attendanceQuery,
      "first-time-visitors": firstTimeQuery,
      "unassigned-youth": unassignedQuery,
      decisions: decisionsQuery,
      "outstanding-followups": followUpsQuery,
      "outstanding-consent": consentQuery,
      rides: ridesQuery,
    }[report] ?? attendanceQuery;

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: TITLES[report] ?? "Report" }} />
      <ThemedText type="display">{TITLES[report] ?? "Report"}</ThemedText>

      <AsyncState
        isLoading={activeQuery.isLoading}
        isError={activeQuery.isError}
        errorMessage="Couldn't load this report."
        onRetry={() => activeQuery.refetch()}
      />

      {report === "attendance-trend" &&
        trendQuery.data?.trend.map((point) => (
          <Card key={point.week} style={styles.card}>
            <ThemedView style={styles.row}>
              <ThemedText type="small">Week of {point.week}</ThemedText>
              <ThemedText type="smallBold">
                {point.unique_youth} youth
              </ThemedText>
            </ThemedView>
          </Card>
        ))}
      {trendQuery.isSuccess &&
        report === "attendance-trend" &&
        trendQuery.data.trend.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            No attendance in this window.
          </ThemedText>
        )}

      {report === "attendance" &&
        attendanceQuery.data?.results.map((record) => (
          <Card key={record.id} style={styles.card}>
            <ThemedText type="smallBold">
              {record.person.display_name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {record.signed_in_at
                ? new Date(record.signed_in_at).toLocaleString()
                : "—"}
              {record.signed_out_at
                ? ` → ${new Date(record.signed_out_at).toLocaleTimeString()}`
                : ""}
            </ThemedText>
          </Card>
        ))}

      {(report === "first-time-visitors" || report === "unassigned-youth") &&
        (report === "first-time-visitors"
          ? firstTimeQuery
          : unassignedQuery
        ).data?.results.map((person) => (
          <Card key={person.id} style={styles.card}>
            <ThemedText type="smallBold">{person.display_name}</ThemedText>
          </Card>
        ))}

      {report === "decisions" &&
        decisionsQuery.data?.results.map((decision) => (
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

      {report === "outstanding-followups" &&
        followUpsQuery.data?.results.map((followUp) => (
          <Card key={followUp.id} style={styles.card}>
            <ThemedView style={styles.row}>
              <ThemedText type="smallBold">
                {followUp.assignee.display_name}
              </ThemedText>
              <StatusBadge status={followUp.status} />
            </ThemedView>
            {followUp.due_at ? (
              <ThemedText type="small" themeColor="textSecondary">
                Due {new Date(followUp.due_at).toLocaleDateString()}
              </ThemedText>
            ) : null}
          </Card>
        ))}

      {report === "outstanding-consent" &&
        consentQuery.data?.results.map((assignment) => (
          <Card key={assignment.id} style={styles.card}>
            <ThemedText type="smallBold">{assignment.form_title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {assignment.person.display_name}
            </ThemedText>
          </Card>
        ))}

      {report === "rides" &&
        ridesQuery.data?.results.map((ride) => (
          <Card key={ride.id} style={styles.card}>
            <ThemedView style={styles.row}>
              <ThemedText type="smallBold">
                {ride.person.display_name}
              </ThemedText>
              <StatusBadge status={ride.status} />
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {ride.area}
            </ThemedText>
          </Card>
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
