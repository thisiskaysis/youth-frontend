import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    // "minimal": icon-only back button everywhere (iOS defaults to showing
    // the previous screen's title/route name otherwise, e.g. "(tabs)").
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="groups" options={{ title: "Groups" }} />
      <Stack.Screen name="events" options={{ title: "Events" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen
        name="manage/attendance"
        options={{ title: "Attendance" }}
      />
      <Stack.Screen name="manage/people" options={{ title: "People" }} />
      <Stack.Screen name="manage/reporting" options={{ title: "Reports" }} />
      <Stack.Screen name="manage/content" options={{ title: "Newsfeed" }} />
      <Stack.Screen
        name="manage/navigation"
        options={{ title: "Navigation" }}
      />
      <Stack.Screen name="manage/decisions" options={{ title: "Decisions" }} />
      <Stack.Screen
        name="manage/volunteers"
        options={{ title: "Volunteers" }}
      />
      <Stack.Screen name="manage/prayer" options={{ title: "Prayer" }} />
      <Stack.Screen name="manage/groups" options={{ title: "Groups" }} />
    </Stack>
  );
}
