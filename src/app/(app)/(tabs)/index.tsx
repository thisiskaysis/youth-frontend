import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AsyncState } from "@/components/async-state";
import { Avatar } from "@/components/avatar";
import { ContentComposer } from "@/components/content-composer";
import { HamburgerButton } from "@/components/hamburger-menu";
import { LinkifiedText } from "@/components/linkified-text";
import { NotificationsButton } from "@/components/notifications-button";
import { PostImageGallery } from "@/components/post-image-gallery";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { contentApi, eventsApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth-context";
import { confirmAsync } from "@/lib/confirm";
import { initialFor } from "@/lib/format";

export default function HomeScreen() {
  const theme = useTheme();
  const { user, isAdmin, isLeaderOrAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);

  const feedQuery = useQuery({
    queryKey: ["home", "feed"],
    queryFn: () => contentApi.list(),
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["manage", "content"] });
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAsync(
      "Delete post?",
      "This can't be undone.",
    );
    if (confirmed) {
      deleteMutation.mutate(id);
    }
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
                FAVOR YOUTH
              </ThemedText>
              <ThemedView style={styles.topRowRight}>
                <NotificationsButton />
                <Link href="/profile" asChild>
                  <Pressable>
                    <Avatar
                      uri={user?.profile_image}
                      label={user?.first_name?.[0]?.toUpperCase() ?? "?"}
                      size={32}
                    />
                  </Pressable>
                </Link>
              </ThemedView>
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
            <ThemedText type="display">What's On</ThemedText>
          </ThemedView>

          {isLeaderOrAdmin && (
            <ThemedView style={styles.composerWrap}>
              <Pressable onPress={() => setComposerOpen(true)}>
                <ThemedView type="backgroundElement" style={styles.composerPrompt}>
                  <Avatar
                    uri={user?.profile_image}
                    label={user?.first_name?.[0]?.toUpperCase() ?? "?"}
                    size={36}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    Share something with the group...
                  </ThemedText>
                </ThemedView>
              </Pressable>
              <ContentComposer
                visible={composerOpen}
                allowImmediatePublish
                onDone={() => setComposerOpen(false)}
                onCancel={() => setComposerOpen(false)}
              />
            </ThemedView>
          )}

          <AsyncState
            isLoading={feedQuery.isLoading}
            isError={feedQuery.isError}
            errorMessage="Couldn't load the feed."
            onRetry={() => feedQuery.refetch()}
            isEmpty={posts.length === 0}
            emptyMessage="Nothing posted yet - check back soon!"
          />

          {posts.map((post) => {
            const isOrganization = post.author_display === "ORGANIZATION";
            const canManage = post.author?.id === user?.id || isAdmin;
            return (
              <ThemedView
                key={post.id}
                type="backgroundElement"
                style={styles.postCard}
              >
                <ThemedView style={styles.postHeader}>
                  <Avatar
                    uri={isOrganization ? null : post.author?.profile_image}
                    label={
                      isOrganization || !post.author
                        ? "F"
                        : initialFor(post.author.display_name)
                    }
                    size={36}
                  />
                  <ThemedView style={styles.postHeaderText}>
                    <ThemedText type="smallBold">
                      {isOrganization
                        ? "Favor Youth"
                        : (post.author?.display_name ?? "Favor Youth")}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {post.publish_at
                        ? new Date(post.publish_at).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )
                        : "Just now"}
                    </ThemedText>
                  </ThemedView>
                  {canManage && (
                    <ThemedView style={styles.postActions}>
                      <Link href="/manage/content" asChild>
                        <Pressable>
                          <ThemedText type="link" themeColor="accent">
                            Edit
                          </ThemedText>
                        </Pressable>
                      </Link>
                      <Pressable onPress={() => handleDelete(post.id)}>
                        <ThemedText type="link" themeColor="danger">
                          Delete
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  )}
                </ThemedView>

                <PostImageGallery images={post.images} />

                <ThemedView style={styles.postBody}>
                  <ThemedText type="smallBold" style={styles.postTitle}>
                    {post.title}
                  </ThemedText>
                  <LinkifiedText text={post.body} style={styles.postText} />
                </ThemedView>
              </ThemedView>
            );
          })}
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
  topRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  wordmark: { letterSpacing: 2 },
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
  composerWrap: {
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  composerPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderRadius: 20,
    padding: Spacing.three,
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
  postHeaderText: { flex: 1 },
  postActions: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "center",
  },
  postBody: { padding: Spacing.three, paddingTop: Spacing.two, gap: 4 },
  postTitle: { fontSize: 16 },
  postText: { lineHeight: 22 },
});

