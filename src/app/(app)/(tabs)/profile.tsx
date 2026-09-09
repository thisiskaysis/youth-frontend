import { useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import QRCode from "react-native-qrcode-svg";
import { useState } from "react";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";

import { Card } from "@/components/card";
import { NotificationsButton } from "@/components/notifications-button";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import { usersApi } from "@/lib/api/endpoints";
import type { PersonDetail } from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  YOUTH: "Youth",
  LEADER: "Leader",
  ADMIN: "Admin",
};

type ProfileForm = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  school_year: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
};

function toProfileForm(user: ProfileForm): ProfileForm {
  return { ...user };
}

function formatDateForApi(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromApi(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !form) throw new Error("Nothing to save.");
      const schoolYear = form.school_year.trim()
        ? Number(form.school_year)
        : null;
      if (schoolYear != null && (schoolYear < 1 || schoolYear > 12)) {
        throw new Error("Grade must be between 1 and 12.");
      }
      await usersApi.update(user.id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: form.date_of_birth || null,
        email: form.email.trim() || null,
        phone_number: form.phone_number.trim(),
        school_year: schoolYear,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
        guardian_email: form.guardian_email.trim(),
      } satisfies Partial<PersonDetail>);
      await refreshUser();
    },
    onSuccess: () => {
      setEditing(false);
      setError(null);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  if (!user) {
    return null;
  }

  const startEditing = () => {
    setForm(
      toProfileForm({
        first_name: user.first_name,
        last_name: user.last_name,
        date_of_birth: user.date_of_birth ?? "",
        email: user.email ?? "",
        phone_number: user.phone_number,
        school_year: user.school_year != null ? String(user.school_year) : "",
        guardian_name: user.guardian_name,
        guardian_phone: user.guardian_phone,
        guardian_email: user.guardian_email,
      }),
    );
    setError(null);
    setShowDatePicker(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    updateMutation.reset();
    setError(null);
    setShowDatePicker(false);
    setEditing(false);
  };

  const pickAndUploadPhoto = async () => {
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError("Photo library access is required to change your photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      await usersApi.uploadProfileImage(user.id, {
        uri: asset.uri,
        name: asset.fileName ?? "profile.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
      await refreshUser();
    } catch (err) {
      setPhotoError(extractErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <ScreenContainer clearFloatingTabBar>
      <TopBar right={<NotificationsButton />} />
      <Pressable
        onPress={pickAndUploadPhoto}
        disabled={uploadingPhoto}
        style={styles.avatarWrap}
      >
        <ThemedView type="backgroundElement" style={styles.avatar}>
          {user.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              contentFit="cover"
              style={styles.avatarImage}
            />
          ) : (
            <ThemedText type="title" themeColor="accentText">
              {user.first_name[0]}
              {user.last_name[0]}
            </ThemedText>
          )}
        </ThemedView>
        {uploadingPhoto ? (
          <ThemedView style={styles.avatarOverlay}>
            <ActivityIndicator color="#fff" />
          </ThemedView>
        ) : (
          <ThemedView
            style={[
              styles.avatarBadge,
              { backgroundColor: theme.accent, borderColor: theme.background },
            ]}
          >
            <SymbolView
              name={{ ios: "camera.fill", android: "photo_camera", web: "photo_camera" }}
              size={16}
              tintColor={theme.accentText}
            />
          </ThemedView>
        )}
      </Pressable>
      {photoError && (
        <ThemedText type="small" themeColor="danger" style={styles.avatarError}>
          {photoError}
        </ThemedText>
      )}
      <ThemedText type="eyebrow" themeColor="accent">
        PROFILE
      </ThemedText>
      <ThemedText type="display">
        {user.first_name} {user.last_name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {ROLE_LABEL[user.role] ?? user.role} · {user.email ?? user.username}
      </ThemedText>

      <Card>
        <ThemedView style={styles.detailsHeader}>
          <ThemedText type="smallBold">Profile details</ThemedText>
          <Pressable
            onPress={editing ? cancelEditing : startEditing}
            disabled={updateMutation.isPending}
          >
            <ThemedText type="linkPrimary">
              {editing ? "Cancel" : "Edit"}
            </ThemedText>
          </Pressable>
        </ThemedView>
        {editing && form ? (
          <>
            <Field
              label="First name"
              value={form.first_name}
              onChangeText={(value) => setForm({ ...form, first_name: value })}
            />
            <Field
              label="Last name"
              value={form.last_name}
              onChangeText={(value) => setForm({ ...form, last_name: value })}
            />
            <DateField
              label="Date of birth"
              value={form.date_of_birth}
              showPicker={showDatePicker}
              onPress={() => setShowDatePicker(true)}
              onChange={(event, date) => {
                if (event.type === "dismissed") {
                  setShowDatePicker(false);
                  return;
                }
                if (date) {
                  setForm({ ...form, date_of_birth: formatDateForApi(date) });
                }
                setShowDatePicker(false);
              }}
            />
            <Field
              label="Email"
              value={form.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(value) => setForm({ ...form, email: value })}
            />
            <Field
              label="Phone"
              value={form.phone_number}
              keyboardType="phone-pad"
              onChangeText={(value) =>
                setForm({ ...form, phone_number: value })
              }
            />
            <Field
              label="Grade (1-12)"
              value={form.school_year}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(value) =>
                setForm({ ...form, school_year: value.replace(/[^0-9]/g, "") })
              }
            />
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Guardian contact (optional)
            </ThemedText>
            <Field
              label="Guardian name"
              value={form.guardian_name}
              onChangeText={(value) =>
                setForm({ ...form, guardian_name: value })
              }
            />
            <Field
              label="Guardian phone"
              value={form.guardian_phone}
              keyboardType="phone-pad"
              onChangeText={(value) =>
                setForm({ ...form, guardian_phone: value })
              }
            />
            <Field
              label="Guardian email"
              value={form.guardian_email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(value) =>
                setForm({ ...form, guardian_email: value })
              }
            />
            {error && (
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            )}
            <Pressable
              style={[styles.saveButton, { backgroundColor: theme.accent }]}
              onPress={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <ThemedText type="smallBold" themeColor="accentText">
                  Save changes
                </ThemedText>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <DetailRow label="Username" value={user.username} />
            <DetailRow
              label="Name"
              value={`${user.first_name} ${user.last_name}`}
            />
            <DetailRow label="DOB" value={user.date_of_birth ?? "—"} />
            <DetailRow label="Email" value={user.email ?? "—"} />
            <DetailRow label="Phone" value={user.phone_number || "—"} />
            <DetailRow
              label="Grade"
              value={user.school_year ? String(user.school_year) : "—"}
            />
            <DetailRow label="Status" value={user.status} />
            {(user.guardian_name ||
              user.guardian_phone ||
              user.guardian_email) && (
              <>
                <ThemedText type="smallBold" style={styles.sectionLabel}>
                  Guardian contact
                </ThemedText>
                {!!user.guardian_name && (
                  <DetailRow label="Name" value={user.guardian_name} />
                )}
                {!!user.guardian_phone && (
                  <DetailRow label="Phone" value={user.guardian_phone} />
                )}
                {!!user.guardian_email && (
                  <DetailRow label="Email" value={user.guardian_email} />
                )}
              </>
            )}
          </>
        )}
      </Card>

      <Card style={styles.qrCard}>
        <ThemedText type="smallBold">My QR Code</ThemedText>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.qrHint}
        >
          Show this at the door for attendance check-in.
        </ThemedText>
        <ThemedView style={styles.qrWrap}>
          <QRCode
            value={user.qr_token}
            size={200}
            backgroundColor={theme.background}
            color={theme.text}
          />
        </ThemedView>
      </Card>

      <ThemedText
        type="link"
        themeColor="danger"
        onPress={logout}
        style={styles.logout}
      >
        Sign out
      </ThemedText>
    </ScreenContainer>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        {...props}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
      />
    </ThemedView>
  );
}

function DateField({
  label,
  value,
  showPicker,
  onPress,
  onChange,
}: {
  label: string;
  value: string;
  showPicker: boolean;
  onPress: () => void;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable
        onPress={onPress}
        style={[styles.input, { borderColor: theme.border }]}
      >
        <ThemedText themeColor={value ? "text" : "textSecondary"}>
          {value ? dateFromApi(value).toLocaleDateString() : "Select a date"}
        </ThemedText>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value ? dateFromApi(value) : new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onChange}
        />
      )}
    </ThemedView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    alignSelf: "center",
    width: 196,
    height: 196,
    marginBottom: Spacing.three,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 196,
    height: 196,
    borderRadius: 98,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 98,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  avatarError: { textAlign: "center", marginBottom: Spacing.two },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  sectionLabel: { marginTop: Spacing.two, marginBottom: Spacing.one },
  field: { marginBottom: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
    fontSize: 16,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  qrCard: { alignItems: "center" },
  qrHint: { textAlign: "center", marginBottom: Spacing.two },
  qrWrap: { padding: Spacing.three, borderRadius: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.one,
  },
  logout: { alignSelf: "center", marginTop: Spacing.three, marginBottom: Spacing.six },
});
