import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, Setting, SettingValue } from "@modules/admin/api/adminApi";
import { apiErrorMessage } from "@api/apiClient";
import {
  Screen,
  Card,
  Text,
  VStack,
  HStack,
  Button,
  Banner,
  TextField,
  Select,
  Skeleton,
  ErrorState,
} from "@shared/ui";

const LABELS: Record<string, string> = {
  "trial.candidateInterviewCredits": "Free interviews for a new candidate",
  "trial.tenantInterviewCredits": "Free interviews for a new company workspace",
  "interview.roundDurationSeconds": "Round duration for new templates (seconds)",
  "interview.allowSeparateRounds": "Allow rounds in separate sittings",
  "interview.deviceCheckBypassAllowed": "Allow candidates to bypass a failed device check",
  "interview.warningAtSeconds": "Show the time warning at (seconds left)",
  "interview.turnGraceSeconds": "Grace for an answer in flight (seconds)",
  "consent.currentVersion": "Current consent version",
  "retention.recordingDays": "Recording and transcript retention (days)",
};

const BOOL_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export default function AdminSettingsScreen() {
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: adminApi.settings });

  return (
    <Screen
      title="Platform settings"
      subtitle="Changes apply to new sessions within 30 seconds and are written to the audit log."
      back="Back to admin"
    >
      {settings.isLoading ? (
        <Skeleton height={300} />
      ) : settings.isError ? (
        <ErrorState
          error={settings.error}
          title="Couldn't load settings"
          onRetry={() => void settings.refetch()}
        />
      ) : (
        <VStack gap={12}>
          {(settings.data ?? []).map((s) => (
            <SettingRow key={s.key} setting={s} />
          ))}
        </VStack>
      )}
    </Screen>
  );
}

function parse(setting: Setting, draft: string): SettingValue | null {
  if (setting.valueType === "boolean") return draft === "true";
  if (setting.valueType === "string") return draft.trim() || null;
  const n = Number(draft);
  return draft.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
}

function SettingRow({ setting }: { setting: Setting }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(String(setting.value));
  const value = parse(setting, draft);
  const save = useMutation({
    mutationFn: () => adminApi.updateSetting(setting.key, value as SettingValue),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
  });
  const label = LABELS[setting.key] ?? setting.key;

  return (
    <Card>
      <VStack gap={10}>
        {setting.valueType === "boolean" ? (
          <Select
            label={label}
            value={draft}
            options={BOOL_OPTIONS}
            onChange={(v) => v && setDraft(v)}
          />
        ) : (
          <TextField
            label={label}
            value={draft}
            onChangeText={setDraft}
            keyboardType={setting.valueType === "number" ? "number-pad" : "default"}
            error={value === null ? "Enter a valid value" : undefined}
          />
        )}
        {save.isError ? <Banner tone="danger" message={apiErrorMessage(save.error)} /> : null}
        <HStack gap={10} align="center">
          <Button
            label="Save"
            size="sm"
            fullWidth={false}
            disabled={value === null || String(value) === String(setting.value)}
            loading={save.isPending}
            onPress={() => save.mutate()}
          />
          <Text variant="caption" tone="tertiary">
            Default: {String(setting.default)}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
}
