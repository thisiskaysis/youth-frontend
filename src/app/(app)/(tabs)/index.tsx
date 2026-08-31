import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Link } from "expo-router";
import {
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AsyncState } from "@/components/async-state";
import { HamburgerButton } from "@/components/hamburger-menu";
import { LinkifiedText } from "@/components/linkified-text";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { contentApi, eventsApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";

export default function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const feedQuery = useQuery({
    queryKey: ["home", "feed"],
    queryFn: contentApi.list,
  });
  const eventsQuery = useQuery({
    queryKey: ["home", "events"],
    queryFn: eventsApi.list,
  });

  const upcoming = eventsQuery.data?.results.slice(0, 8) ?? [];
  const posts = feedQuery.data?.results ?? [];

  const isRefreshing = feedQuery.isFetching || eventsQuery.isFetching;
  const refresh = () => {
    feedQuery.refetch();
    eventsQuery.refetch();
  };

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.fill}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.accent}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {Platform.OS !== "web" && (
            <ThemedView style={styles.topRow}>
              <HamburgerButton />
              <ThemedText
                type="smallBold"
                themeColor="accent"
                style={styles.wordmark}
              >
                YOUTH
              </ThemedText>
              <Link href="/profile" asChild>
                <Pressable>
                  <ThemedView type="backgroundElement" style={styles.avatar}>
                    <ThemedText type="smallBold">
                      {user?.first_name?.[0] ?? "?"}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </Link>
            </ThemedView>
          )}

          {upcoming.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesRow}
            >
              {upcoming.map((event) => (
                <Link key={event.id} href="/events" asChild>
                  <Pressable>
                    <ThemedView
                      style={[styles.storyCard, { borderColor: theme.accent }]}
                    >
                      <ThemedText
                        type="small"
                        themeColor="accent"
                        numberOfLines={1}
                        style={styles.storyDate}
                      >
                        {new Date(event.starts_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        numberOfLines={2}
                        style={styles.storyName}
                      >
                        {event.name}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          )}

          <ThemedView style={styles.feedHeader}>
            <ThemedText type="display">The Feed</ThemedText>
          </ThemedView>

          <AsyncState
            isLoading={feedQuery.isLoading}
            isError={feedQuery.isError}
            errorMessage="Couldn't load the feed."
            onRetry={() => feedQuery.refetch()}
            isEmpty={posts.length === 0}
            emptyMessage="Nothing posted yet - check back soon!"
          />

          {posts.map((post) => (
            <ThemedView
              key={post.id}
              type="backgroundElement"
              style={styles.postCard}
            >
              <ThemedView style={styles.postHeader}>
                <ThemedView
                  type="backgroundSelected"
                  style={styles.postAvatar}
                />
                <ThemedView style={styles.postHeaderText}>
                  <ThemedText type="smallBold">Youth Ministry</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {post.publish_at
                      ? new Date(post.publish_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )
                      : "Just now"}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {post.image ? (
                <Image
                  source={{ uri: post.image }}
                  style={styles.postImage}
                  contentFit="cover"
                />
              ) : null}

              <ThemedView style={styles.postBody}>
                <ThemedText type="smallBold" style={styles.postTitle}>
                  {post.title}
                </ThemedText>
                <LinkifiedText text={post.body} style={styles.postText} />
              </ThemedView>
            </ThemedView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.six,
    paddingTop: Platform.select({ web: 76, default: 0 }),
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  wordmark: { letterSpacing: 2 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  storiesRow: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  storyCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    borderWidth: 2,
    padding: Spacing.two,
    justifyContent: "flex-end",
  },
  storyDate: { marginBottom: 2 },
  storyName: { fontWeight: "700" },
  feedHeader: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  postCard: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: 20,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
  },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postHeaderText: { flex: 1 },
  postImage: { width: "100%", aspectRatio: 1 },
  postBody: { padding: Spacing.three, paddingTop: Spacing.two, gap: 4 },
  postTitle: { fontSize: 16 },
  postText: { lineHeight: 22 },
});
