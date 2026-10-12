import React, { useState } from "react";
import { apiClient, apiErrorMessage } from "@api/apiClient";
import { useDeviceCheck } from "@modules/interview/hooks/useInterviews";
import { runDeviceCheck } from "@modules/interview/voice";
import { DeviceCheckResult } from "@modules/interview/types";
import {
  Card,
  Text,
  VStack,
  HStack,
  Button,
  Banner,
  StatusChip,
} from "@shared/ui";

const LABELS: Record<keyof DeviceCheckResult, string> = {
  browserSupported: "Browser supports audio capture",
  microphone: "Microphone permission",
  audioPlayback: "Audio playback",
  network: "Connection to the server",
};

/** Mic, playback and network checks; the clock does not start here (PRD 2.4). */
export function DeviceCheckStep({ interviewId }: { interviewId: string }) {
  const submit = useDeviceCheck(interviewId);
  const [result, setResult] = useState<DeviceCheckResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const r = await runDeviceCheck(() => apiClient.get("/me"));
    setResult(r);
    setRunning(false);
    if (Object.values(r).every(Boolean)) submit.mutate(r);
  };

  const failed = result ? Object.values(result).some((v) => !v) : false;

  return (
    <Card>
      <VStack gap={12}>
        <Text variant="h3">Device check</Text>
        <Text variant="body-sm" tone="secondary">
          We check your microphone, speakers and connection. Your browser will
          ask for microphone permission.
        </Text>
        {result
          ? (Object.keys(LABELS) as (keyof DeviceCheckResult)[]).map((k) => (
              <HStack key={k} justify="space-between" align="center" gap={8}>
                <Text variant="body-sm" style={{ flex: 1 }}>
                  {LABELS[k]}
                </Text>
                <StatusChip
                  label={result[k] ? "OK" : "Failed"}
                  tone={result[k] ? "success" : "danger"}
                />
              </HStack>
            ))
          : null}
        {failed ? (
          <Banner
            tone="warning"
            title="Something needs fixing"
            message="Allow microphone access in your browser, check your connection, then run the check again."
          />
        ) : null}
        {submit.isError ? (
          <Banner tone="danger" message={apiErrorMessage(submit.error)} />
        ) : null}
        <Button
          label={result ? "Run check again" : "Run device check"}
          fullWidth={false}
          loading={running || submit.isPending}
          onPress={() => void run()}
        />
      </VStack>
    </Card>
  );
}
