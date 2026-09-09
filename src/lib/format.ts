// Instagram-style relative timestamps ("Just now", "5m", "3h", "2d"),
// falling back to a short date once it's more than a week old.
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function initialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// Day-granular label for chat date separators ("Today", "Yesterday", or a
// short date - with year only if it's not the current year).
export function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86400000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
