import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { extractErrorMessage } from "@/lib/api-client";
import {
    contentApi,
    groupsApi,
    type ContentPostInput,
} from "@/lib/api/endpoints";
import type { ContentItem } from "@/lib/api/types";

const AUTHOR_DISPLAY_OPTIONS: {
  value: ContentItem["author_display"];
  label: string;
}[] = [
  { value: "SELF", label: "Post as myself" },
  { value: "ORGANIZATION", label: "Post as Favor Youth" },
];

const MAX_IMAGES = 10;

// A gallery tile is either an already-uploaded image (removable via
// remove_image_ids, keyed by its real server id) or a freshly-picked local
// image (removable just by dropping it from local state).
type GallerySlot =
  | { kind: "existing"; id: number; uri: string }
  | { kind: "new"; uri: string; name: string; type: string };

export type ContentComposerProps = {
  visible: boolean;
  // When set, the composer edits this post instead of creating a new one.
  editingItem?: ContentItem | null;
  // Shows a primary "Post" (publish immediately) action alongside a
  // secondary "Save as draft" one, instead of a single draft-only submit.
  allowImmediatePublish?: boolean;
  onDone: () => void;
  onCancel: () => void;
};

export function ContentComposer({
  visible,
  editingItem,
  allowImmediatePublish = false,
  onDone,
  onCancel,
}: ContentComposerProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({
    queryKey: ["manage", "content", "manageable-groups"],
    queryFn: groupsApi.manageable,
  });

  const isEditing = editingItem != null;
  const editingItemId = editingItem?.id ?? null;

  // Instagram-style flow for new posts: step 1 is the caption/photos, step
  // 2 is post-as/audience/draft-or-post. Editing shows everything at once.
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorDisplay, setAuthorDisplay] =
    useState<ContentItem["author_display"]>("SELF");
  const [audienceEveryone, setAudienceEveryone] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [slots, setSlots] = useState<GallerySlot[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // The Modal stays mounted across opens so it can play its close
  // animation, so state has to be re-seeded here rather than via a plain
  // useState initializer, which would only run once on first mount.
  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setTitle(editingItem?.title ?? "");
    setBody(editingItem?.body ?? "");
    setAuthorDisplay(editingItem?.author_display ?? "SELF");
    setAudienceEveryone(editingItem?.audience_everyone ?? true);
    setSelectedGroupIds(editingItem?.audience_groups ?? []);
    setSlots(
      (editingItem?.images ?? []).map((img) => ({
        kind: "existing" as const,
        id: img.id,
        uri: img.image,
      })),
    );
    setFormError(null);
    // Re-seed only when the modal opens or the target post changes, not on
    // every parent re-render that happens to pass a new `editingItem` object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingItemId]);

  const invalidateFeeds = () => {
    queryClient.invalidateQueries({ queryKey: ["manage", "content"] });
    queryClient.invalidateQueries({ queryKey: ["home", "feed"] });
  };

  const buildPayload = (): ContentPostInput => ({
    title,
    body,
    author_display: authorDisplay,
    audience_everyone: audienceEveryone,
    audience_groups: audienceEveryone ? [] : selectedGroupIds,
    image_files: slots
      .filter(
        (slot): slot is Extract<GallerySlot, { kind: "new" }> =>
          slot.kind === "new",
      )
      .map((slot) => ({ uri: slot.uri, name: slot.name, type: slot.type })),
    remove_image_ids: (editingItem?.images ?? [])
      .filter(
        (img) =>
          !slots.some((slot) => slot.kind === "existing" && slot.id === img.id),
      )
      .map((img) => img.id),
  });

  // `publishImmediately` is the mutate() variable, so each button can tell
  // (via createMutation.variables) whether it's the one currently pending.
  const createMutation = useMutation({
    mutationFn: async (publishImmediately: boolean) => {
      const created = await contentApi.create(buildPayload());
      if (publishImmediately) {
        await contentApi.publish(created.id);
      }
      return created;
    },
    onSuccess: () => {
      invalidateFeeds();
      onDone();
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: () => contentApi.update(editingItem!.id, buildPayload()),
    onSuccess: () => {
      invalidateFeeds();
      onDone();
    },
    onError: (error) => setFormError(extractErrorMessage(error)),
  });

  const pickImages = async () => {
    setFormError(null);
    const remaining = MAX_IMAGES - slots.length;
    if (remaining <= 0) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Photo library access is required to add photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked: GallerySlot[] = result.assets
      .slice(0, remaining)
      .map((asset, index) => ({
        kind: "new" as const,
        uri: asset.uri,
        name: asset.fileName ?? `post-${Date.now()}-${index}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      }));
    setSlots((current) => [...current, ...picked]);
  };

  const removeSlot = (index: number) => {
    setSlots((current) => current.filter((_, i) => i !== index));
  };

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((current) =>
      current.includes(id)
        ? current.filter((groupId) => groupId !== id)
        : [...current, id],
    );
  };

  const validate = () => {
    if (!audienceEveryone && selectedGroupIds.length === 0) {
      setFormError("Select at least one group, or choose Everyone.");
      return false;
    }
    setFormError(null);
    return true;
  };


  const handleSaveDraft = () => {
    if (!validate()) return;
    createMutation.mutate(false);
  };

  const handlePostNow = () => {
    if (!validate()) return;
    createMutation.mutate(true);
  };

  const handleUpdate = () => {
    if (!validate()) return;
    updateMutation.mutate();
  };

  const isDraftPending =
    createMutation.isPending && createMutation.variables === false;
  const isPostPending =
    createMutation.isPending && createMutation.variables === true;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  // Title is always optional; a post needs a caption or at least one photo.
  const hasContent = body.trim().length > 0 || slots.length > 0;

  const goNext = () => {
    if (!hasContent) return;
    setStep(2);
  };

  const showComposeSection = isEditing || step === 1;
  const showDetailsSection = isEditing || step === 2;
  const headerLeftLabel = !isEditing && step === 2 ? "‹ Back" : "Cancel";
  const headerLeftAction = !isEditing && step === 2
    ? () => setStep(1)
    : onCancel;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill}>
          <KeyboardAvoidingView
            style={styles.fill}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ThemedView
              style={[styles.header, { borderBottomColor: theme.border }]}
            >
              <Pressable onPress={headerLeftAction} hitSlop={8}>
                <ThemedText type="link" themeColor="textSecondary">
                  {headerLeftLabel}
                </ThemedText>
              </Pressable>
              <ThemedText type="smallBold">
                {isEditing ? "Edit post" : "New post"}
              </ThemedText>
              {!isEditing && step === 1 ? (
                <Pressable onPress={goNext} disabled={!hasContent} hitSlop={8}>
                  <ThemedText
                    type="link"
                    themeColor={hasContent ? "accent" : "textSecondary"}
                  >
                    Next
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedView style={styles.headerSpacer} />
              )}
            </ThemedView>

            <ScrollView
              style={styles.fill}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {showComposeSection && (
                <>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Add a title (optional)"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.titleInput, { color: theme.text }]}
                  />
                  <TextInput
                    value={body}
                    onChangeText={setBody}
                    placeholder="What's on your mind?"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    style={[styles.bodyInput, { color: theme.text }]}
                  />

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoRow}
                  >
                    {slots.map((slot, index) => (
                      <ThemedView
                        key={
                          slot.kind === "existing"
                            ? `existing-${slot.id}`
                            : `new-${slot.uri}`
                        }
                        style={styles.photoThumbWrap}
                      >
                        <Image
                          source={{ uri: slot.uri }}
                          style={styles.photoThumb}
                          contentFit="cover"
                        />
                        <Pressable
                          onPress={() => removeSlot(index)}
                          style={styles.removeBadge}
                          hitSlop={6}
                        >
                          <ThemedText style={styles.removeBadgeText}>
                            ×
                          </ThemedText>
                        </Pressable>
                      </ThemedView>
                    ))}
                    {slots.length < MAX_IMAGES && (
                      <Pressable onPress={pickImages}>
                        <ThemedView
                          type="backgroundElement"
                          style={[
                            styles.addPhotoTile,
                            { borderColor: theme.border },
                          ]}
                        >
                          <SymbolView
                            name={{
                              ios: "photo.badge.plus",
                              android: "add_photo_alternate",
                              web: "add_photo_alternate",
                            }}
                            size={26}
                            tintColor={theme.textSecondary}
                          />
                        </ThemedView>
                      </Pressable>
                    )}
                  </ScrollView>
                  {slots.length > 0 && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {slots.length}/{MAX_IMAGES} photos
                    </ThemedText>
                  )}
                </>
              )}

              {showDetailsSection && (
                <>
                  <ThemedText type="small" style={styles.label}>
                    Post as
                  </ThemedText>
                  <ThemedView style={styles.chipRow}>
                    {AUTHOR_DISPLAY_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setAuthorDisplay(option.value)}
                      >
                        <ThemedView
                          type={
                            authorDisplay === option.value
                              ? "backgroundSelected"
                              : "backgroundElement"
                          }
                          style={styles.chip}
                        >
                          <ThemedText
                            type="small"
                            themeColor={
                              authorDisplay === option.value
                                ? "accent"
                                : "textSecondary"
                            }
                          >
                            {option.label}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </ThemedView>

                  <ThemedText type="small" style={styles.label}>
                    Audience
                  </ThemedText>
                  <ThemedView style={styles.chipRow}>
                    <Pressable onPress={() => setAudienceEveryone(true)}>
                      <ThemedView
                        type={
                          audienceEveryone
                            ? "backgroundSelected"
                            : "backgroundElement"
                        }
                        style={styles.chip}
                      >
                        <ThemedText
                          type="small"
                          themeColor={
                            audienceEveryone ? "accent" : "textSecondary"
                          }
                        >
                          Everyone
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                    <Pressable onPress={() => setAudienceEveryone(false)}>
                      <ThemedView
                        type={
                          !audienceEveryone
                            ? "backgroundSelected"
                            : "backgroundElement"
                        }
                        style={styles.chip}
                      >
                        <ThemedText
                          type="small"
                          themeColor={
                            !audienceEveryone ? "accent" : "textSecondary"
                          }
                        >
                          My groups
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  </ThemedView>

                  {!audienceEveryone && (
                    <ThemedView style={[styles.chipRow, styles.groupChipRow]}>
                      {groupsQuery.data?.length === 0 && (
                        <ThemedText type="small" themeColor="textSecondary">
                          You don't manage any groups yet.
                        </ThemedText>
                      )}
                      {groupsQuery.data?.map((group) => {
                        const selected = selectedGroupIds.includes(group.id);
                        return (
                          <Pressable
                            key={group.id}
                            onPress={() => toggleGroup(group.id)}
                          >
                            <ThemedView
                              type={
                                selected
                                  ? "backgroundSelected"
                                  : "backgroundElement"
                              }
                              style={styles.chip}
                            >
                              <ThemedText
                                type="small"
                                themeColor={selected ? "accent" : "textSecondary"}
                              >
                                {group.name}
                              </ThemedText>
                            </ThemedView>
                          </Pressable>
                        );
                      })}
                    </ThemedView>
                  )}
                </>
              )}

              {formError && (
                <ThemedText type="small" themeColor="danger">
                  {formError}
                </ThemedText>
              )}
            </ScrollView>

            {(isEditing || step === 2) && (
              <ThemedView
                style={[styles.footer, { borderTopColor: theme.border }]}
              >
                {isEditing ? (
                  <Pressable
                    disabled={!hasContent || isSaving}
                    onPress={handleUpdate}
                    style={[
                      styles.submitButton,
                      { backgroundColor: theme.accent },
                    ]}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={theme.accentText} />
                    ) : (
                      <ThemedText type="buttonLabel" themeColor="accentText">
                        SAVE CHANGES
                      </ThemedText>
                    )}
                  </Pressable>
                ) : allowImmediatePublish ? (
                  <ThemedView style={styles.actionsRow}>
                    <Pressable
                      disabled={!hasContent || isSaving}
                      onPress={handleSaveDraft}
                      style={[styles.draftButton, { borderColor: theme.border }]}
                    >
                      {isDraftPending ? (
                        <ActivityIndicator color={theme.textSecondary} />
                      ) : (
                        <ThemedText type="buttonLabel" themeColor="textSecondary">
                          SAVE AS DRAFT
                        </ThemedText>
                      )}
                    </Pressable>
                    <Pressable
                      disabled={!hasContent || isSaving}
                      onPress={handlePostNow}
                      style={[
                        styles.submitButton,
                        styles.postButton,
                        { backgroundColor: theme.accent },
                      ]}
                    >
                      {isPostPending ? (
                        <ActivityIndicator color={theme.accentText} />
                      ) : (
                        <ThemedText type="buttonLabel" themeColor="accentText">
                          POST
                        </ThemedText>
                      )}
                    </Pressable>
                  </ThemedView>
                ) : (
                  <Pressable
                    disabled={!hasContent || isSaving}
                    onPress={handleSaveDraft}
                    style={[
                      styles.submitButton,
                      { backgroundColor: theme.accent },
                    ]}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={theme.accentText} />
                    ) : (
                      <ThemedText type="buttonLabel" themeColor="accentText">
                        CREATE (DRAFT)
                      </ThemedText>
                    )}
                  </Pressable>
                )}
              </ThemedView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 50 },
  scrollContent: { padding: Spacing.four, gap: Spacing.one },
  label: { marginTop: Spacing.two, marginBottom: 4 },
  titleInput: {
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: Spacing.two,
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: "top",
    paddingVertical: Spacing.two,
  },
  photoRow: { gap: Spacing.two, paddingVertical: Spacing.two },
  photoThumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoThumb: { width: "100%", height: "100%" },
  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBadgeText: { color: "#FFFFFF", fontSize: 14, lineHeight: 16 },
  addPhotoTile: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  groupChipRow: { marginTop: Spacing.two },
  chip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionsRow: { flexDirection: "row", gap: Spacing.two },
  draftButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  postButton: { flex: 1 },
});

