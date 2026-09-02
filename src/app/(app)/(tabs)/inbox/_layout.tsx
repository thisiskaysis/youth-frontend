import { Stack } from "expo-router";

// Nested inside the Inbox tab so opening a thread pushes with its own
// native back button instead of replacing the tab's root screen.
export default function InboxLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
