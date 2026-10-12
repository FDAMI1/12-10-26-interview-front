import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { adminApi, Overview } from "@modules/admin/api/adminApi";
import { AdminStackParamList } from "@modules/admin/AdminNavigator";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  Text,
  HStack,
  Skeleton,
  ErrorState,
  SectionHeader,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const KPIS: { key: keyof Overview; label: string; suffix?: string }[] = [
  { key: "registrations", label: "Registrations" },
  { key: "activeCompanies", label: "Active companies" },
  { key: "interviews", label: "Interviews" },
  { key: "completedInterviews", label: "Completed" },
  { key: "completionRate", label: "Completion rate", suffix: "%" },
  { key: "failedSessions", label: "Failed sessions" },
  { key: "publishedTemplates", label: "Published templates" },
];

export default function AdminOverviewScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminApi.overview,
  });

  return (
    <Screen
      title="Platform admin"
      subtitle="Revenue and AI cost appear here once billing ships."
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    >
      {isLoading ? (
        <Skeleton height={140} />
      ) : isError || !data ? (
        <ErrorState
          error={error}
          title="Couldn't load the overview"
          onRetry={() => void refetch()}
        />
      ) : (
        <HStack gap={12} wrap>
          {KPIS.map((k) => (
            <Card key={k.key} style={{ flexGrow: 1, minWidth: 150 }}>
              <Text variant="caption" tone="tertiary">
                {k.label}
              </Text>
              <Text variant="display-sm">
                {data[k.key]}
                {k.suffix ?? ""}
              </Text>
            </Card>
          ))}
        </HStack>
      )}

      <SectionHeader title="Manage" />
      <Card padded={false}>
        <ListRow
          title="Users"
          subtitle="Search, suspend and reactivate accounts"
          chevron
          onPress={() => navigation.navigate("AdminUsers")}
        />
        <Divider />
        <ListRow
          title="Platform settings"
          subtitle="Trial credits, round duration, consent version, retention"
          chevron
          onPress={() => navigation.navigate("AdminSettings")}
        />
        <Divider />
        <ListRow
          title="Platform interview templates"
          subtitle="The roles candidates can practise"
          chevron
          onPress={() =>
            (navigation.getParent() as { navigate: (n: string, p: object) => void } | undefined)?.navigate(
              "Company",
              { screen: "Templates", params: { scope: "platform" } },
            )
          }
        />
      </Card>
    </Screen>
  );
}
