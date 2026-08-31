import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { usersApi } from "@/lib/api/endpoints";
import type { PersonDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";

const STATUS_OPTIONS: PersonDetail["status"][] = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];
const ROLE_OPTIONS: PersonDetail["role"][] = ["YOUTH", "LEADER", "ADMIN"];

type FormState = {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  school_year: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: PersonDetail["status"];
  role: PersonDetail["role"];
};

function toFormState(person: PersonDetail): FormState {
  return {
    first_name: person.first_name,
    last_name: person.last_name,
    phone_number: person.phone_number,
    date_of_birth: person.date_of_birth ?? "",
    school_year: person.school_year != null ? String(person.school_year) : "",
    guardian_name: person.guardian_name,
    guardian_phone: person.guardian_phone,
    guardian_email: person.guardian_email,
    emergency_contact_name: person.emergency_contact_name,
    emergency_contact_phone: person.emergency_contact_phone,
    status: person.status,
    role: person.role,
  };
}

export default function PersonDetailScreen() {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const id = Number(personId);
  const theme = useTheme();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["manage", "people", id],
    queryFn: () => usersApi.detail(id),
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) setForm(toFormState(query.data));
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!form) throw new Error("Nothing to save.");
      const payload: Partial<PersonDetail> = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        date_of_birth: form.date_of_birth || null,
        school_year: form.school_year ? Number(form.school_year) : null,
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
        guardian_email: form.guardian_email,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        status: form.status,
      };
      if (isAdmin) payload.role = form.role;
      return usersApi.update(id, payload);
    },
    onSuccess: () => {
      setEditing(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["manage", "people", id] });
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const person = query.data;

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title: person
            ? `${person.first_name} ${person.last_name}`.trim() ||
              person.username
            : "Person",
        }}
      />
      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load this person."
        onRetry={() => query.refetch()}
      />

      {person && form && (
        <>
          <ThemedView style={styles.headerRow}>
            <ThemedText type="display">
              {`${person.first_name} ${person.last_name}`.trim() ||
                person.username}
            </ThemedText>
            <Pressable onPress={() => setEditing((open) => !open)}>
              <ThemedText type="link" themeColor="accent">
                {editing ? "Cancel" : "Edit"}
              </ThemedText>
            </Pressable>
          </ThemedView>
          <ThemedView style={styles.badgeRow}>
            <StatusBadge status={person.role} />
            <StatusBadge status={person.status} />
            {person.is_provisional && <StatusBadge status="PROVISIONAL" />}
          </ThemedView>

          {!editing ? (
            <Card style={styles.card}>
              <InfoRow label="Username" value={person.username} />
              <InfoRow label="Email" value={person.email ?? "—"} />
              <InfoRow label="Phone" value={person.phone_number || "—"} />
              <InfoRow
                label="Date of birth"
                value={person.date_of_birth ?? "—"}
              />
              <InfoRow
                label="School year"
                value={
                  person.school_year != null ? String(person.school_year) : "—"
                }
              />
              <InfoRow label="Guardian" value={person.guardian_name || "—"} />
              <InfoRow
                label="Guardian phone"
                value={person.guardian_phone || "—"}
              />
              <InfoRow
                label="Guardian email"
                value={person.guardian_email || "—"}
              />
              <InfoRow
                label="Emergency contact"
                value={person.emergency_contact_name || "—"}
              />
              <InfoRow
                label="Emergency phone"
                value={person.emergency_contact_phone || "—"}
              />
            </Card>
          ) : (
            <Card style={styles.card}>
              <Field
                label="First name"
                value={form.first_name}
                onChangeText={(v) => setForm({ ...form, first_name: v })}
                theme={theme}
              />
              <Field
                label="Last name"
                value={form.last_name}
                onChangeText={(v) => setForm({ ...form, last_name: v })}
                theme={theme}
              />
              <Field
                label="Phone"
                value={form.phone_number}
                onChangeText={(v) => setForm({ ...form, phone_number: v })}
                theme={theme}
              />
              <Field
                label="Date of birth (YYYY-MM-DD)"
                value={form.date_of_birth}
                onChangeText={(v) => setForm({ ...form, date_of_birth: v })}
                theme={theme}
              />
              <Field
                label="School year"
                value={form.school_year}
                onChangeText={(v) => setForm({ ...form, school_year: v })}
                theme={theme}
                keyboardType="number-pad"
              />
              <Field
                label="Guardian name"
                value={form.guardian_name}
                onChangeText={(v) => setForm({ ...form, guardian_name: v })}
                theme={theme}
              />
              <Field
                label="Guardian phone"
                value={form.guardian_phone}
                onChangeText={(v) => setForm({ ...form, guardian_phone: v })}
                theme={theme}
              />
              <Field
                label="Guardian email"
                value={form.guardian_email}
                onChangeText={(v) => setForm({ ...form, guardian_email: v })}
                theme={theme}
              />
              <Field
                label="Emergency contact"
                value={form.emergency_contact_name}
                onChangeText={(v) =>
                  setForm({ ...form, emergency_contact_name: v })
                }
                theme={theme}
              />
              <Field
                label="Emergency phone"
                value={form.emergency_contact_phone}
                onChangeText={(v) =>
                  setForm({ ...form, emergency_contact_phone: v })
                }
                theme={theme}
              />

              <ThemedText type="small" style={styles.label}>
                Status
              </ThemedText>
              <ThemedView style={styles.chipRow}>
                {STATUS_OPTIONS.map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => setForm({ ...form, status })}
                  >
                    <ThemedView
                      type={
                        form.status === status
                          ? "backgroundSelected"
                          : "backgroundElement"
                      }
                      style={styles.chip}
                    >
                      <ThemedText
                        type="small"
                        themeColor={
                          form.status === status ? "accent" : "textSecondary"
                        }
                      >
                        {status}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
              </ThemedView>

              {isAdmin && (
                <>
                  <ThemedText type="small" style={styles.label}>
                    Role
                  </ThemedText>
                  <ThemedView style={styles.chipRow}>
                    {ROLE_OPTIONS.map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => setForm({ ...form, role })}
                      >
                        <ThemedView
                          type={
                            form.role === role
                              ? "backgroundSelected"
                              : "backgroundElement"
                          }
                          style={styles.chip}
                        >
                          <ThemedText
                            type="small"
                            themeColor={
                              form.role === role ? "accent" : "textSecondary"
                            }
                          >
                            {role}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </ThemedView>
                </>
              )}

              {error && (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              )}
              <Pressable
                disabled={updateMutation.isPending}
                onPress={() => updateMutation.mutate()}
                style={[styles.submitButton, { backgroundColor: theme.accent }]}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color={theme.accentText} />
                ) : (
                  <ThemedText type="buttonLabel" themeColor="accentText">
                    SAVE
                  </ThemedText>
                )}
              </Pressable>
            </Card>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </ThemedView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  theme,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: ReturnType<typeof useTheme>;
  keyboardType?: "number-pad";
}) {
  return (
    <>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
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
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.two },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.one },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  label: { marginTop: Spacing.two, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: Spacing.three,
  },
});
