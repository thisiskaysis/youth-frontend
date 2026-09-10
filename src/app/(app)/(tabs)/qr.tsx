import QRCode from "react-native-qrcode-svg";
import { StyleSheet } from "react-native";

import { Card } from "@/components/card";
import { NotificationsButton } from "@/components/notifications-button";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";

export default function QrCodeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ScreenContainer clearFloatingTabBar>
      <TopBar right={<NotificationsButton />} />
      <ThemedText type="eyebrow" themeColor="accent">
        CHECK-IN
      </ThemedText>
      <ThemedText type="display">My QR Code</ThemedText>

      <Card style={styles.qrCard}>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  qrCard: { alignItems: "center" },
  qrHint: { textAlign: "center", marginBottom: Spacing.two },
  qrWrap: { padding: Spacing.three, borderRadius: 12 },
});
