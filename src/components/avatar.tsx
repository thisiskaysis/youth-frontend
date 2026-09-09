import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { ThemedText, type ThemedTextProps } from "./themed-text";
import { ThemedView } from "./themed-view";

// Shared person avatar: shows the photo when set, otherwise an initials
// fallback - used anywhere a user/person appears (inbox, newsfeed, etc.)
export function Avatar({
  uri,
  label,
  size = 44,
  textType = "smallBold",
}: {
  uri?: string | null;
  label: string;
  size?: number;
  textType?: ThemedTextProps["type"];
}) {
  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          contentFit="cover"
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <ThemedText type={textType} themeColor="accentText">
          {label}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
