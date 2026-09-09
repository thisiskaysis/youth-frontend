import { Image } from "expo-image";
import { useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
} from "react-native";

import { ThemedView } from "./themed-view";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PostImageGalleryProps = {
  images: { id: number; image: string }[];
};

// Instagram-style carousel: every photo renders at the same size as a single
// photo would, swiped sideways, with dots below indicating position.
export function PostImageGallery({ images }: PostImageGalleryProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <ThemedView onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((img) => (
          <Image
            key={img.id}
            source={{ uri: img.image }}
            style={[styles.image, { width }]}
            contentFit="cover"
          />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <ThemedView style={styles.dotsRow}>
          {images.map((img, index) => (
            <ThemedView
              key={img.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? theme.accent : theme.border,
                },
              ]}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  image: { aspectRatio: 1 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
