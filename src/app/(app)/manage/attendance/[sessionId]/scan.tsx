import { useMutation } from "@tanstack/react-query";
import {
    CameraView,
    useCameraPermissions,
    type BarcodeScanningResult,
} from "expo-camera";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { attendanceApi } from "@/lib/api/endpoints";
import type { AttendanceApiError, BasicPerson } from "@/lib/api/types";

type Outcome = {
  tone: "success" | "warning" | "error";
  title: string;
  subtitle?: string;
};

const SCAN_COOLDOWN_MS = 1800;

export default function AttendanceScanScreen() {
  const { sessionId, mode } = useLocalSearchParams<{
    sessionId: string;
    mode?: string;
  }>();
  const id = Number(sessionId);
  const isSignOut = mode === "out";
  const theme = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const isProcessing = useRef(false);

  const signInMutation = useMutation({
    mutationFn: (qrToken: string) =>
      attendanceApi.signIn(id, { qr_token: qrToken, source: "QR" }),
  });
  const signOutMutation = useMutation({
    mutationFn: (qrToken: string) =>
      attendanceApi.signOut(id, { qr_token: qrToken, source: "QR" }),
  });

  const showOutcome = (next: Outcome) => {
    setOutcome(next);
    setTimeout(() => {
      setOutcome(null);
      isProcessing.current = false;
    }, SCAN_COOLDOWN_MS);
  };

  const handleScan = (scan: BarcodeScanningResult) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const action = isSignOut ? signOutMutation : signInMutation;
    action.mutate(scan.data, {
      onSuccess: (data) => {
        const person = data.person as BasicPerson;
        const name = `${person.first_name} ${person.last_name}`.trim();
        if ("result" in data && data.result === "ALREADY_SIGNED_IN") {
          showOutcome({
            tone: "warning",
            title: "ALREADY SIGNED IN",
            subtitle: name,
          });
        } else {
          showOutcome({
            tone: "success",
            title: isSignOut ? "SIGNED OUT" : "SIGNED IN",
            subtitle: name,
          });
        }
      },
      onError: (error) => {
        const data = (error as { response?: { data?: AttendanceApiError } })
          .response?.data;
        showOutcome({
          tone: "error",
          title: data?.detail ?? "Scan failed",
          subtitle: "Try again or use manual check-in.",
        });
      },
    });
  };

  if (!permission) {
    return <ThemedView style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={[styles.fill, styles.centered]}>
        <Stack.Screen
          options={{ title: isSignOut ? "Scan Sign Out" : "Scan Sign In" }}
        />
        <ThemedText type="smallBold" style={styles.permissionText}>
          Camera access is needed to scan attendance QR codes.
        </ThemedText>
        <Pressable
          onPress={requestPermission}
          style={[styles.actionButton, { backgroundColor: theme.accent }]}
        >
          <ThemedText type="buttonLabel" themeColor="accentText">
            GRANT ACCESS
          </ThemedText>
        </Pressable>
        {!permission.canAskAgain && (
          <Pressable
            onPress={() => Linking.openSettings()}
            style={styles.settingsLink}
          >
            <ThemedText type="link" themeColor="accent">
              Open Settings
            </ThemedText>
          </Pressable>
        )}
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.fallbackHint}
        >
          You can still check people in manually from the session screen.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen
        options={{ title: isSignOut ? "Scan Sign Out" : "Scan Sign In" }}
      />
      <CameraView
        style={styles.fill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleScan}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <ThemedView type="backgroundElement" style={styles.modeBadge}>
          <ThemedText
            type="buttonLabel"
            themeColor={isSignOut ? "danger" : "accent"}
          >
            {isSignOut ? "SIGN OUT MODE" : "SIGN IN MODE"}
          </ThemedText>
        </ThemedView>

        {outcome && (
          <ThemedView
            style={[
              styles.resultCard,
              {
                backgroundColor:
                  outcome.tone === "success"
                    ? theme.success
                    : outcome.tone === "warning"
                      ? theme.accent
                      : theme.danger,
              },
            ]}
          >
            <ThemedText
              type="display"
              themeColor="accentText"
              style={styles.resultTitle}
            >
              {outcome.title}
            </ThemedText>
            {outcome.subtitle && (
              <ThemedText type="smallBold" themeColor="accentText">
                {outcome.subtitle}
              </ThemedText>
            )}
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.five,
    gap: Spacing.three,
  },
  permissionText: { textAlign: "center" },
  actionButton: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
  },
  settingsLink: { padding: Spacing.one },
  fallbackHint: { textAlign: "center", marginTop: Spacing.three },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.four,
  },
  modeBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  resultCard: {
    width: "100%",
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: "center",
    gap: Spacing.one,
    marginBottom: Spacing.five,
  },
  resultTitle: { textAlign: "center" },
});
