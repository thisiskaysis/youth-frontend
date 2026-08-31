import { useMemo } from "react";
import type { TextProps } from "react-native";

import { ThemedText } from "./themed-text";

import { openExternalUrl } from "@/lib/open-external-url";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function splitLinks(text: string): { text: string; isLink: boolean }[] {
  const parts: { text: string; isLink: boolean }[] = [];
  const regex = new RegExp(URL_PATTERN);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isLink: false });
    }
    parts.push({ text: match[0], isLink: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isLink: false });
  }
  return parts;
}

type LinkifiedTextProps = Omit<TextProps, "children"> & { text: string };

// Renders plain post/caption text, but turns any http(s) URL inside it into
// a tappable link (in-app browser on native, new tab on web).
export function LinkifiedText({ text, ...rest }: LinkifiedTextProps) {
  const parts = useMemo(() => splitLinks(text), [text]);

  return (
    <ThemedText {...rest}>
      {parts.map((part, index) =>
        part.isLink ? (
          <ThemedText
            key={index}
            themeColor="accent"
            onPress={() => openExternalUrl(part.text)}
          >
            {part.text}
          </ThemedText>
        ) : (
          part.text
        ),
      )}
    </ThemedText>
  );
}
