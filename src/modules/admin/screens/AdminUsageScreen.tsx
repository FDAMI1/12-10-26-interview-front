import React from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { adminApi, UsageToday } from "@modules/admin/api/adminApi";
import { palette, radius, numeric } from "@shared/designSystem";
import {
  Screen,
  Card,
  Text,
  VStack,
  HStack,
  Banner,
  Skeleton,
  ErrorState,
  SectionHeader,
  StatusChip,
} from "@shared/ui";

const STATUS = {
  ok: { label: "Within quota", tone: "success" },
  approaching_limit: { label: "Approaching limit", tone: "warning" },
  limit_reached: { label: "Limit reached", tone: "danger" },
  not_configured: { label: "No quota set", tone: "neutral" },
} as const;

const BAR_HEIGHT = 120;

export default function AdminUsageScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin-ai-usage"],
    queryFn: () => adminApi.aiUsage(14),
    refetchInterval: 60_000,
  });

  return (
    <Screen
      title="Gemini usage"
      subtitle="Requests this server sent to Gemini, per UTC day"
      back="Back to admin"
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    >
      {isLoading ? (
        <Skeleton height={220} />
      ) : isError || !data ? (
        <ErrorState
          error={error}
          title="Couldn't load usage"
          onRetry={() => void refetch()}
        />
      ) : (
        <VStack gap={14}>
          <Banner
            tone="info"
            title="These are configured quotas, not Google's"
            message="Google does not report remaining quota through its API. Usage below is counted by this server; the limits are the ones set in Platform settings. Set them to match your Gemini plan."
          />
          <HStack gap={12} wrap>
            <QuotaCard title="Questions and scoring" usage={data.today.text} />
            <QuotaCard title="Interviewer voice" usage={data.today.tts} />
          </HStack>

          <SectionHeader title="Daily requests, last 14 days" />
          <Card>
            <TrendBars trend={data.trend} />
            <HStack gap={16} style={{ marginTop: 10 }} wrap>
              <Legend color={palette.teal[600]} label="Questions and scoring" />
              <Legend color={palette.cobalt[600]} label="Voice" />
            </HStack>
          </Card>
          <Text variant="caption" tone="tertiary">
            Unit: requests. Quotas reset at 00:00 UTC. Failed requests are
            included, since most providers count them.
          </Text>
        </VStack>
      )}
    </Screen>
  );
}

function QuotaCard({ title, usage }: { title: string; usage: UsageToday }) {
  const s = STATUS[usage.status];
  const fill =
    usage.status === "limit_reached"
      ? palette.danger.text
      : usage.status === "approaching_limit"
        ? palette.warning.text
        : palette.teal[600];
  return (
    <Card style={{ flexGrow: 1, minWidth: 260 }}>
      <VStack gap={10}>
        <HStack justify="space-between" align="center" gap={8}>
          <Text variant="h3">{title}</Text>
          <StatusChip label={s.label} tone={s.tone} />
        </HStack>
        <Text variant="display-md" style={numeric}>
          {usage.used}
          <Text variant="body" tone="tertiary">
            {" "}
            / {usage.quota} requests today
          </Text>
        </Text>
        <View
          style={{
            height: 8,
            borderRadius: radius.full,
            backgroundColor: palette.surface.sunken,
            overflow: "hidden",
          }}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: usage.percent }}
        >
          <View style={{ width: `${usage.percent}%`, height: 8, backgroundColor: fill }} />
        </View>
        <HStack gap={16} wrap>
          <Stat label="Used" value={`${usage.percent}%`} />
          <Stat label="Remaining" value={String(usage.remaining)} />
          <Stat label="Failed" value={String(usage.failures)} />
        </HStack>
      </VStack>
    </Card>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <VStack gap={0}>
    <Text variant="caption" tone="tertiary">
      {label}
    </Text>
    <Text variant="label" style={numeric}>
      {value}
    </Text>
  </VStack>
);

const Legend = ({ color, label }: { color: string; label: string }) => (
  <HStack gap={6} align="center">
    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
    <Text variant="caption" tone="secondary">
      {label}
    </Text>
  </HStack>
);

/** Stacked bars, one per day. Both series are requests, so stacking them is sound. */
function TrendBars({ trend }: { trend: { day: string; text: number; tts: number }[] }) {
  const max = Math.max(1, ...trend.map((d) => d.text + d.tts));
  return (
    <HStack gap={4} align="flex-end" style={{ height: BAR_HEIGHT + 34 }}>
      {trend.map((d) => {
        const total = d.text + d.tts;
        return (
          <VStack
            key={d.day}
            gap={2}
            flex={1}
            align="center"
            justify="flex-end"
            style={{ height: BAR_HEIGHT + 34 }}
          >
            <Text variant="caption" tone="tertiary" style={numeric}>
              {total || ""}
            </Text>
            <View
              style={{ width: "70%", maxWidth: 28, borderRadius: 3, overflow: "hidden" }}
              accessibilityLabel={`${d.day}: ${d.text} text and ${d.tts} voice requests`}
            >
              <View style={{ height: (d.tts / max) * BAR_HEIGHT, backgroundColor: palette.cobalt[600] }} />
              <View style={{ height: (d.text / max) * BAR_HEIGHT, backgroundColor: palette.teal[600] }} />
            </View>
            <Text variant="caption" tone="tertiary" style={numeric}>
              {d.day.slice(8)}
            </Text>
          </VStack>
        );
      })}
    </HStack>
  );
}
