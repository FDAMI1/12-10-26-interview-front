import React from "react";
import { useNavigation } from "@react-navigation/native";
import {
  useInterviews,
  useEntitlements,
} from "@modules/interview/hooks/useInterviews";
import { InterviewList } from "@modules/interview/components/InterviewList";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { useAuthStore } from "@shared/store/useAuthStore";
import {
  Screen,
  Card,
  Text,
  VStack,
  HStack,
  Button,
  Skeleton,
  ErrorState,
  SectionHeader,
} from "@shared/ui";

type Nav = { navigate: (name: string, params?: object) => void };

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const credits = useEntitlements();
  const interviews = useInterviews(5);
  const rows = interviews.data?.data ?? [];
  const completed = rows.filter((r) => r.status === "completed").length;

  const open = (screen: string, params?: object) =>
    navigation.navigate("Interviews", { screen, params });

  return (
    <Screen
      title={`Hello, ${user?.displayName?.split(" ")[0] ?? "there"}`}
      subtitle="Practise a full interview: HR, technical and managerial rounds."
      refreshing={interviews.isRefetching}
      onRefresh={() => {
        void interviews.refetch();
        void credits.refetch();
      }}
    >
      <VStack gap={14}>
        <VerifyEmailCard />
        <HStack gap={12} wrap>
          <Stat label="Interview credits" value={credits.data?.available} />
          <Stat label="Total interviews" value={interviews.data?.meta.total} />
          <Stat
            label="Completed (last 5)"
            value={interviews.isSuccess ? completed : undefined}
          />
        </HStack>
        <Button
          label="Start a new interview"
          size="lg"
          onPress={() => open("NewInterview")}
        />
      </VStack>

      <SectionHeader title="Recent interviews" />
      {interviews.isLoading ? (
        <Skeleton height={140} />
      ) : interviews.isError ? (
        <ErrorState
          error={interviews.error}
          title="Couldn't load your interviews"
          onRetry={() => void interviews.refetch()}
        />
      ) : (
        <InterviewList
          interviews={rows}
          emptyMessage="Your first interview is free."
          onOpen={(it) => open("InterviewSession", { id: it.id })}
        />
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <Card style={{ flexGrow: 1, minWidth: 150 }}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
      <Text variant="display-sm">{value ?? "-"}</Text>
    </Card>
  );
}
