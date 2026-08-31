import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
} from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { attendanceApi, usersApi } from "@/lib/api/endpoints";
import type { AttendanceApiError } from "@/lib/api/types";

export default function AttendanceSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [closeError, setCloseError] = useState<AttendanceApiError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [visitorPanelOpen, setVisitorPanelOpen] = useState(false);
  const [visitorFirstName, setVisitorFirstName] = useState("");
  const [visitorLastName, setVisitorLastName] = useState("");

  const sessionQuery = useQuery({
    queryKey: ["attendance", id],
    queryFn: () => attendanceApi.session(id),
  });
  const liveQuery = useQuery({
    queryKey: ["attendance", id, "live"],
    queryFn: () => attendanceApi.live(id),
  });
  const onSiteQuery = useQuery({
    queryKey: ["attendance", id, "on-site"],
    queryFn: () => attendanceApi.onSite(id),
  });
  const searchResults = useQuery({
    queryKey: ["attendance", id, "search", searchQuery],
    queryFn: () => usersApi.search(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["attendance", id] });
  };

  const signInMutation = useMutation({
    mutationFn: (personId: number) =>
      attendanceApi.signIn(id, { person_id: personId, source: "MANUAL" }),
    onSuccess: () => {
      setActionError(null);
      setSearchQuery("");
      invalidateAll();
    },
    onError: (error) => setActionError(extractErrorMessage(error)),
  });

  const createVisitorMutation = useMutation({
    mutationFn: () =>
      usersApi.createVisitor({
        first_name: visitorFirstName,
        last_name: visitorLastName,
      }),
    onSuccess: (person) => {
      setVisitorPanelOpen(false);
      setVisitorFirstName("");
      setVisitorLastName("");
      signInMutation.mutate(person.id);
    },
    onError: (error) => setActionError(extractErrorMessage(error)),
  });

  const signOutMutation = useMutation({
    mutationFn: (personId: number) =>
      attendanceApi.signOut(id, { person_id: personId, source: "MANUAL" }),
    onSuccess: () => {
      setActionError(null);
      invalidateAll();
    },
    onError: (error) => setActionError(extractErrorMessage(error)),
  });

  const closeMutation = useMutation({
    mutationFn: (force: boolean) => attendanceApi.close(id, force),
    onSuccess: () => {
      setCloseError(null);
      invalidateAll();
      router.back();
    },
    onError: (error) => {
      const data = (error as { response?: { data?: AttendanceApiError } })
        .response?.data;
      setCloseError(
        data ?? { code: "ERROR", detail: extractErrorMessage(error) },
      );
    },
  });

  const session = sessionQuery.data;
  const isOpen = session?.status === "OPEN";

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: `Session #${sessionId}` }} />
      <ThemedView style={styles.statsRow}>
        <Stat label="On site" value={liveQuery.data?.currently_on_site} />
        <Stat label="Signed in" value={liveQuery.data?.total_signed_in} />
        <Stat
          label="First-timers"
          value={liveQuery.data?.first_time_visitors}
        />
      </ThemedView>

      {isOpen && (
        <ThemedView style={styles.scanRow}>
          <Link href={`/manage/attendance/${sessionId}/scan?mode=in`} asChild>
            <Pressable
              style={StyleSheet.flatten([
                styles.scanButton,
                { backgroundColor: theme.accent },
              ])}
            >
              <ThemedText type="buttonLabel" themeColor="accentText">
                SCAN SIGN IN
              </ThemedText>
            </Pressable>
          </Link>
          <Link href={`/manage/attendance/${sessionId}/scan?mode=out`} asChild>
            <Pressable
              style={StyleSheet.flatten([
                styles.scanButton,
                styles.scanButtonOutline,
                { borderColor: theme.accent },
              ])}
            >
              <ThemedText type="buttonLabel" themeColor="accent">
                SCAN SIGN OUT
              </ThemedText>
            </Pressable>
          </Link>
        </ThemedView>
      )}

      {isOpen && (
        <Card>
          <ThemedText type="smallBold">Manual check-in</ThemedText>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />
          {searchResults.data?.results.map((person) => (
            <ThemedView key={person.id} style={styles.searchRow}>
              <ThemedText type="small">{person.display_name}</ThemedText>
              <Pressable
                disabled={signInMutation.isPending}
                onPress={() => signInMutation.mutate(person.id)}
                style={StyleSheet.flatten([
                  styles.smallButton,
                  { backgroundColor: theme.accent },
                ])}
              >
                <ThemedText type="small" themeColor="accentText">
                  Sign in
                </ThemedText>
              </Pressable>
            </ThemedView>
          ))}

          <Pressable onPress={() => setVisitorPanelOpen((open) => !open)}>
            <ThemedText
              type="link"
              themeColor="accent"
              style={styles.visitorToggle}
            >
              {visitorPanelOpen
                ? "Cancel"
                : "Can't find them? Add as a visitor"}
            </ThemedText>
          </Pressable>

          {visitorPanelOpen && (
            <ThemedView style={styles.visitorPanel}>
              <TextInput
                value={visitorFirstName}
                onChangeText={setVisitorFirstName}
                placeholder="First name"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
              <TextInput
                value={visitorLastName}
                onChangeText={setVisitorLastName}
                placeholder="Last name (optional)"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              />
              <Pressable
                disabled={
                  !visitorFirstName.trim() || createVisitorMutation.isPending
                }
                onPress={() => createVisitorMutation.mutate()}
                style={StyleSheet.flatten([
                  styles.smallButton,
                  { backgroundColor: theme.accent, alignSelf: "flex-start" },
                ])}
              >
                {createVisitorMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.accentText} />
                ) : (
                  <ThemedText type="small" themeColor="accentText">
                    Add & sign in
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          )}
        </Card>
      )}

      {actionError && (
        <ThemedText
          type="small"
          themeColor="danger"
          style={styles.sectionTitle}
        >
          {actionError}
        </ThemedText>
      )}

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        On site
      </ThemedText>
      <AsyncState
        isLoading={onSiteQuery.isLoading}
        isError={onSiteQuery.isError}
        errorMessage="Couldn't load who's on site."
        onRetry={() => onSiteQuery.refetch()}
        isEmpty={onSiteQuery.data?.length === 0}
        emptyMessage="Nobody currently on site."
      />
      {onSiteQuery.data?.map((record) => (
        <ThemedView key={record.id} style={styles.onSiteRow}>
          <ThemedView>
            <ThemedText type="small">{record.person.display_name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Since{" "}
              {record.signed_in_at
                ? new Date(record.signed_in_at).toLocaleTimeString(undefined, {
                    timeStyle: "short",
                  })
                : "—"}
            </ThemedText>
          </ThemedView>
          {isOpen && (
            <Pressable
              disabled={signOutMutation.isPending}
              onPress={() => signOutMutation.mutate(record.person.id)}
              style={styles.smallButtonOutline}
            >
              <ThemedText type="small" themeColor="danger">
                Sign out
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>
      ))}

      {isOpen && (
        <>
          {closeError && (
            <Card style={styles.closeErrorCard}>
              <ThemedText type="small" themeColor="danger">
                {closeError.detail}
              </ThemedText>
              {closeError.code === "REMAINING_ON_SITE" && (
                <Pressable
                  onPress={() => closeMutation.mutate(true)}
                  disabled={closeMutation.isPending}
                  style={[
                    styles.smallButton,
                    { backgroundColor: theme.danger, marginTop: Spacing.one },
                  ]}
                >
                  <ThemedText type="small" themeColor="accentText">
                    Force close anyway
                  </ThemedText>
                </Pressable>
              )}
            </Card>
          )}
          <Pressable
            disabled={closeMutation.isPending}
            onPress={() => closeMutation.mutate(false)}
            style={styles.closeButton}
          >
            {closeMutation.isPending ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <ThemedText type="buttonLabel" themeColor="danger">
                CLOSE SESSION
              </ThemedText>
            )}
          </Pressable>
        </>
      )}
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card style={styles.statCard}>
      <ThemedText type="title" themeColor="accent">
        {value ?? "–"}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: Spacing.two },
  statCard: { flex: 1, alignItems: "center" },
  scanRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.three },
  scanButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  scanButtonOutline: { backgroundColor: "transparent", borderWidth: 2 },
  sectionTitle: { marginTop: Spacing.three },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: Spacing.two,
  },
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  smallButton: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  smallButtonOutline: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  onSiteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  closeErrorCard: { marginTop: Spacing.three },
  closeButton: {
    alignItems: "center",
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
  },
  visitorToggle: { marginTop: Spacing.two },
  visitorPanel: { marginTop: Spacing.two, gap: Spacing.two },
});
