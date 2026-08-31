import { StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  YOUTH: "Youth",
  LEADER: "Leader",
  ADMIN: "Admin",
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ScreenContainer clearFloatingTabBar>
      <TopBar />
      <ThemedText type="eyebrow" themeColor="accent">
        PROFILE
      </ThemedText>
      <ThemedText type="display">
        {user.first_name} {user.last_name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {ROLE_LABEL[user.role] ?? user.role} · {user.email ?? user.username}
      </ThemedText>

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

      <Card>
        <DetailRow label="Username" value={user.username} />
        <DetailRow label="Phone" value={user.phone_number || "—"} />
        <DetailRow
          label="School year"
          value={user.school_year ? String(user.school_year) : "—"}
        />
        <DetailRow label="Status" value={user.status} />
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
  qrCard: { alignItems: "center" },
  qrHint: { textAlign: "center", marginBottom: Spacing.two },
  qrWrap: { padding: Spacing.three, borderRadius: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.one,
  },
  logout: { alignSelf: "center", marginTop: Spacing.three },
});
