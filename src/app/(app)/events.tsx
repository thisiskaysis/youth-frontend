import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { eventsApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function EventsScreen() {
  const theme = useTheme();
  const { isLeaderOrAdmin } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["events"], queryFn: eventsApi.list });

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      const parsed = new Date(startsAt.replace(" ", "T"));
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Enter the date/time like 2026-09-05 19:00");
      }
      return eventsApi.create({
        name,
        starts_at: parsed.toISOString(),
        location,
      });
    },
    onSuccess: () => {
      setName("");
      setStartsAt("");
      setLocation("");
      setFormOpen(false);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => eventsApi.publish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        WHAT'S ON
      </ThemedText>
      <ThemedText type="display">Events</ThemedText>

      {isLeaderOrAdmin && (
        <Pressable
          onPress={() => setFormOpen((open) => !open)}
          style={[styles.newButton, { backgroundColor: theme.accent }]}
        >
          <ThemedText type="buttonLabel" themeColor="accentText">
            {formOpen ? "CANCEL" : "+ NEW EVENT"}
          </ThemedText>
        </Pressable>
      )}

      {formOpen && (
        <Card>
          <ThemedText type="small" style={styles.label}>
            Name
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Friday Youth Night"
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
          <ThemedText type="small" style={styles.label}>
            Starts at
          </ThemedText>
          <TextInput
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="2026-09-05 19:00"
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
          <ThemedText type="small" style={styles.label}>
            Location
          </ThemedText>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Main hall"
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
          {formError && (
            <ThemedText type="small" themeColor="danger">
              {formError}
            </ThemedText>
          )}
          <Pressable
            disabled={
              !name.trim() || !startsAt.trim() || createMutation.isPending
            }
            onPress={() => createMutation.mutate()}
            style={[styles.submitButton, { backgroundColor: theme.accent }]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={theme.accentText} />
            ) : (
              <ThemedText type="buttonLabel" themeColor="accentText">
                CREATE (DRAFT)
              </ThemedText>
            )}
          </Pressable>
        </Card>
      )}

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
          <ThemedView style={styles.cardFooter}>
            <StatusBadge status={event.status} />
            {isLeaderOrAdmin && event.status === "DRAFT" && (
              <Pressable
                disabled={publishMutation.isPending}
                onPress={() => publishMutation.mutate(event.id)}
              >
                <ThemedText type="link" themeColor="accent">
                  Publish
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        </Card>
      ))}
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
  newButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: Spacing.two,
  },
  label: { marginTop: Spacing.two, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.three,
  },
});
