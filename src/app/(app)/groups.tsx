import { useQuery } from "@tanstack/react-query";
import { StyleSheet } from "react-native";

import { AsyncState } from "@/components/async-state";
import { Card } from "@/components/card";
import { ScreenContainer } from "@/components/screen-container";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { groupsApi } from "@/lib/api/endpoints";

const GROUP_TYPE_LABEL: Record<string, string> = {
  CONNECT: "Connect group",
  VOLUNTEER: "Volunteer team",
  MINISTRY: "Ministry team",
};

export default function GroupsScreen() {
  const query = useQuery({
    queryKey: ["groups", "mine"],
    queryFn: groupsApi.mine,
  });

  return (
    <ScreenContainer>
      <ThemedText type="eyebrow" themeColor="accent">
        GROUPS
      </ThemedText>
      <ThemedText type="display">My Groups</ThemedText>

      <AsyncState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage="Couldn't load your groups."
        onRetry={() => query.refetch()}
        isEmpty={query.data?.length === 0}
        emptyMessage="You're not part of any groups yet."
      />

      {query.data?.map((group) => (
        <Card key={group.id} style={styles.card}>
          <ThemedText type="smallBold">{group.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {GROUP_TYPE_LABEL[group.group_type] ?? group.group_type}
          </ThemedText>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.one },
});
