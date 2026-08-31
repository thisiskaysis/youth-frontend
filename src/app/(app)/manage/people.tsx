import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { usersApi } from "@/lib/api/endpoints";

export default function ManagePeopleScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const searchQuery = useQuery({
    queryKey: ["manage", "people", query],
    queryFn: () => usersApi.search(query),
    enabled: query.length > 0,
  });

  return (
    <ScreenContainer>
      <ThemedText type="display">People</ThemedText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or email"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}
      />

      {query.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Start typing to search the people you're authorised to manage.
        </ThemedText>
      )}

      <AsyncState
        isLoading={searchQuery.isLoading}
        isError={searchQuery.isError}
        errorMessage="Couldn't search people."
        onRetry={() => searchQuery.refetch()}
        isEmpty={query.length > 0 && searchQuery.data?.results.length === 0}
        emptyMessage="No matches."
      />

      {searchQuery.data?.results.map((person) => (
        <Link key={person.id} href={`/manage/people/${person.id}`} asChild>
          <Pressable>
            <Card style={styles.card}>
              <ThemedText type="smallBold">{person.display_name}</ThemedText>
            </Card>
          </Pressable>
        </Link>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  card: { marginTop: Spacing.one },
});
