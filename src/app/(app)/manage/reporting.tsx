import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { reportingApi } from "@/lib/api/endpoints";

const DRILLDOWNS = [
  { slug: "attendance-trend", label: "Attendance trend" },
  { slug: "attendance", label: "Attendance log" },
  { slug: "first-time-visitors", label: "First-time visitors" },
  { slug: "unassigned-youth", label: "Unassigned youth" },
  { slug: "decisions", label: "Decisions" },
  { slug: "outstanding-followups", label: "Outstanding follow-ups" },
  { slug: "outstanding-consent", label: "Outstanding consent" },
  { slug: "rides", label: "Rides" },
] as const;

export default function ManageReportingScreen() {
  const query = useQuery({
    queryKey: ["manage", "reporting", "dashboard"],
    queryFn: reportingApi.dashboard,
  });
  const data = query.data;

  return (
    <ScreenContainer>
      <ThemedText type="display">Reports</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load the dashboard."
        onRetry={() => query.refetch()}
      />

      {data && (
        <ThemedView style={styles.grid}>
          <Metric label="Attended" value={data.attendance.total_attended} />
          <Metric label="Unique youth" value={data.attendance.unique_youth} />
          <Metric
            label="First-time visitors"
            value={data.attendance.first_time_visitors}
          />
          <Metric
            label="Unassigned youth"
            value={data.group_participation.unassigned_youth}
          />
          <Metric label="Decisions" value={data.decisions.total} />
          <Metric
            label="Outstanding follow-ups"
            value={data.decisions.outstanding_follow_ups}
          />
          <Metric label="Prayer requests" value={data.prayer.total} />
          <Metric label="Ride requests" value={data.rides.total} />
          <Metric
            label="Outstanding consent"
            value={data.outstanding_consent}
          />
        </ThemedView>
      )}

      <ThemedText type="subtitle" style={styles.sectionSpacing}>
        Drilldowns
      </ThemedText>
      {DRILLDOWNS.map((drilldown) => (
        <Link
          key={drilldown.slug}
          href={`/manage/reporting/${drilldown.slug}`}
          asChild
        >
          <Pressable>
            <Card style={styles.card}>
              <ThemedText type="smallBold">{drilldown.label}</ThemedText>
            </Card>
          </Pressable>
        </Link>
      ))}
    </ScreenContainer>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.metricCard}>
      <ThemedText type="title" themeColor="accent">
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  metricCard: { width: "48%", alignItems: "center" },
  sectionSpacing: { marginTop: Spacing.three },
  card: { marginTop: Spacing.one },
});
