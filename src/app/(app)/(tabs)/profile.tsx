import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
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
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  YOUTH: "Youth",
  LEADER: "Leader",
  ADMIN: "Admin",
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

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

      <Pressable
        onPress={() => router.push("/profile-details")}
        style={[styles.detailsButton, { borderColor: theme.accent }]}
      >
        <ThemedText type="buttonLabel" themeColor="accent">
          PROFILE DETAILS
        </ThemedText>
      </Pressable>

      <Card>
        <ThemedText type="smallBold">Wall</ThemedText>
        <AsyncState
          isLoading={false}
          isError={false}
          isEmpty
          emptyMessage="Posts will show up here soon."
        />
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
  detailsButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
  },
  logout: { alignSelf: "center", marginTop: Spacing.three, marginBottom: Spacing.six },
});
