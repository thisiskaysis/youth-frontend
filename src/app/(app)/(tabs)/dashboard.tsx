import { Link } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TopBar } from "@/components/top-bar";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  {
    href: "/manage/attendance",
    label: "Attendance",
    hint: "Sessions, on-site counts",
  },
  {
    href: "/manage/people",
    label: "People",
    hint: "Search and manage profiles",
  },
  { href: "/manage/reporting", label: "Reports", hint: "Leadership KPIs" },
  { href: "/manage/rides", label: "Rides", hint: "Transport requests" },
  {
    href: "/manage/forms",
    label: "Forms & Consent",
    hint: "Definitions and assignments",
  },
  {
    href: "/manage/content",
    label: "Newsfeed posts",
    hint: "Write & publish content",
  },
  {
    href: "/manage/navigation",
    label: "Navigation",
    hint: "Custom menu items",
  },
  { href: "/manage/decisions", label: "Decisions", hint: "Follow-up queue" },
  {
    href: "/manage/volunteers",
    label: "Volunteers",
    hint: "Roster assignments",
  },
] as const;

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <ScreenContainer clearFloatingTabBar>
      <TopBar />
      <ThemedText type="eyebrow" themeColor="accent">
        {user?.role === "ADMIN" ? "ADMIN" : "LEADER"} DASHBOARD
      </ThemedText>
      <ThemedText type="display">Your Tools</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Everything you manage behind the scenes.
      </ThemedText>

      <ThemedView style={styles.grid}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} asChild>
            <Pressable style={styles.tile}>
              <Card style={styles.tileCard}>
                <ThemedText type="smallBold">{link.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {link.hint}
                </ThemedText>
              </Card>
            </Pressable>
          </Link>
        ))}
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  tile: { width: "48%" },
  tileCard: { minHeight: 76, justifyContent: "center" },
});
