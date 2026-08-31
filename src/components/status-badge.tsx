import { StyleSheet } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import type { ThemeColor } from "@/constants/theme";
import { Spacing } from "@/constants/theme";

const STATUS_COLOR: Record<string, ThemeColor> = {
  PENDING: "textSecondary",
  OUTSTANDING: "danger",
  OVERDUE: "danger",
  ESCALATED: "danger",
  REQUESTED: "textSecondary",
  DRAFT: "textSecondary",
  IN_PROGRESS: "accent",
  ARRANGING: "accent",
  SCHEDULED: "accent",
  APPROVED: "success",
  ACCEPTED: "success",
  CONFIRMED: "success",
  COMPLETED: "success",
  PUBLISHED: "success",
  ACTIVE: "success",
  OPEN: "success",
  DECLINED: "danger",
  CANCELLED: "danger",
  HIDDEN: "textSecondary",
  CLOSED: "textSecondary",
  EXPIRED: "textSecondary",
  ARCHIVED: "textSecondary",
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "textSecondary";
  return (
    <ThemedView type="backgroundElement" style={styles.badge}>
      <ThemedText type="small" themeColor={color}>
        {status.replace(/_/g, " ")}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
});
