import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="groups" options={{ title: "Groups" }} />
      <Stack.Screen name="events" options={{ title: "Events" }} />
      <Stack.Screen name="inbox" options={{ title: "Inbox" }} />
      <Stack.Screen name="forms" options={{ title: "Forms" }} />
      <Stack.Screen
        name="manage/attendance"
        options={{ title: "Attendance" }}
      />
      <Stack.Screen name="manage/people" options={{ title: "People" }} />
      <Stack.Screen name="manage/reporting" options={{ title: "Reports" }} />
      <Stack.Screen name="manage/rides" options={{ title: "Rides" }} />
      <Stack.Screen name="manage/forms" options={{ title: "Forms" }} />
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
