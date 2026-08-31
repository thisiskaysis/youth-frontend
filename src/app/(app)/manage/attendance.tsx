import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { attendanceApi, eventsApi } from "@/lib/api/endpoints";

export default function ManageAttendanceScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["manage", "attendance", "sessions"],
    queryFn: attendanceApi.sessions,
  });
  const eventsQuery = useQuery({
    queryKey: ["manage", "attendance", "events"],
    queryFn: eventsApi.list,
    enabled: pickerOpen,
  });

  const openMutation = useMutation({
    mutationFn: (eventId: number) => attendanceApi.openSession(eventId),
    onSuccess: (session) => {
      setPickerOpen(false);
      setOpenError(null);
      queryClient.invalidateQueries({
        queryKey: ["manage", "attendance", "sessions"],
      });
      router.push(`/manage/attendance/${session.id}`);
    },
    onError: (error) => setOpenError(extractErrorMessage(error)),
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">Attendance</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Open a session per event, then scan or manually check people in/out.
      </ThemedText>

      <Pressable
        onPress={() => setPickerOpen((open) => !open)}
        style={[styles.openButton, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accentText">
          {pickerOpen ? "CANCEL" : "OPEN NEW SESSION"}
        </ThemedText>
      </Pressable>

      {pickerOpen && (
        <Card>
          <ThemedText type="smallBold">Pick an event</ThemedText>
          <AsyncState
            isLoading={eventsQuery.isLoading}
            isError={eventsQuery.isError}
            errorMessage="Couldn't load events."
            isEmpty={eventsQuery.data?.results.length === 0}
            emptyMessage="No events to open a session for."
          />
          {openError && (
            <ThemedText type="small" themeColor="danger">
              {openError}
            </ThemedText>
          )}
          {eventsQuery.data?.results.map((event) => (
            <Pressable
              key={event.id}
              disabled={openMutation.isPending}
              onPress={() => openMutation.mutate(event.id)}
              style={styles.eventRow}
            >
              <ThemedText type="small">{event.name}</ThemedText>
              {openMutation.isPending &&
                openMutation.variables === event.id && (
                  <ActivityIndicator size="small" color={theme.accent} />
                )}
            </Pressable>
          ))}
        </Card>
      )}

      <AsyncState
        isLoading={sessionsQuery.isLoading}
        isError={sessionsQuery.isError}
        errorMessage="Couldn't load attendance sessions."
        onRetry={() => sessionsQuery.refetch()}
        isEmpty={sessionsQuery.data?.results.length === 0}
        emptyMessage="No attendance sessions yet."
      />

      {sessionsQuery.data?.results.map((session) => (
        <Link
          key={session.id}
          href={`/manage/attendance/${session.id}`}
          asChild
        >
          <Pressable>
            <Card style={styles.card}>
              <ThemedView style={styles.cardRow}>
                <ThemedText type="smallBold">Session #{session.id}</ThemedText>
                <StatusBadge status={session.status} />
              </ThemedView>
              <ThemedText type="small" themeColor="textSecondary">
                Opened{" "}
                {new Date(session.opened_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </ThemedText>
            </Card>
          </Pressable>
        </Link>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  openButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: Spacing.two,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
});
