import React, { useState } from "react";
import { apiClient, apiErrorMessage } from "@api/apiClient";
import { useDeviceCheck } from "@modules/interview/hooks/useInterviews";
import { MicOutcome, runDeviceCheck } from "@modules/interview/voice";
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
  microphone: "Microphone access",
  audioPlayback: "Audio playback",
  network: "Connection to the server",
  browserSupported: "Browser supports audio capture",
};

const MIC_HELP: Record<
  Exclude<MicOutcome, "granted">,
  { title: string; message: string }
> = {
  denied: {
    title: "Microphone access was denied",
    message:
      "Your AI interviewer cannot hear you without it. Click the lock or camera icon in your browser's address bar, allow the microphone for this site, then press the button again. On a phone, allow the microphone for your browser in the device settings.",
  },
  none: {
    title: "No microphone was found",
    message: "Connect or enable a microphone, then press the button again.",
  },
  unsupported: {
    title: "This browser cannot capture audio",
    message:
      "Open the interview in a current version of Chrome, Edge or Safari.",
  },
};

/** Microphone permission (plus playback and connection); the clock does not start here (PRD 2.4). */
export function DeviceCheckStep({ interviewId }: { interviewId: string }) {
  const submit = useDeviceCheck(interviewId);
  const [result, setResult] = useState<
    (DeviceCheckResult & { micOutcome: MicOutcome }) | null
  >(null);
  const [running, setRunning] = useState(false);

  // One request per press: the browser prompt is never repeated on its own.
  const run = async () => {
    setRunning(true);
    const r = await runDeviceCheck(() => apiClient.get("/me"));
    setResult(r);
    setRunning(false);
    const { micOutcome, ...checks } = r;
    if (Object.values(checks).every(Boolean)) submit.mutate(checks);
  };

  const granted = result?.micOutcome === "granted";
  const otherFailed = result ? !result.audioPlayback || !result.network : false;

  return (
    <Card>
      <VStack gap={12}>
        <Text variant="h3">Allow Microphone for Interview</Text>
        <Text variant="body-sm" tone="secondary">
          Allow microphone access so your AI interviewer can hear your answers
          and respond naturally. Check that your microphone is working before
          starting.
        </Text>
        {result
          ? (Object.keys(LABELS) as (keyof DeviceCheckResult)[]).map((k) => (
              <HStack key={k} justify="space-between" align="center" gap={8}>
                <Text variant="body-sm" style={{ flex: 1 }}>
                  {LABELS[k]}
                </Text>
                <StatusChip
                  label={
                    result[k]
                      ? k === "microphone"
                        ? "Allowed"
                        : "OK"
                      : "Failed"
                  }
                  tone={result[k] ? "success" : "danger"}
                />
              </HStack>
            ))
          : null}
        {granted && !otherFailed && !submit.isError ? (
          <Banner
            tone="success"
            title="Microphone allowed"
            message="Your interviewer can hear you. You can start the interview."
          />
        ) : null}
        {result && result.micOutcome !== "granted" ? (
          <Banner
            tone="warning"
            title={MIC_HELP[result.micOutcome].title}
            message={MIC_HELP[result.micOutcome].message}
          />
        ) : null}
        {granted && otherFailed ? (
          <Banner
            tone="warning"
            title="Something else needs fixing"
            message="Check your connection and that this browser can play sound, then try again."
          />
        ) : null}
        {submit.isError ? (
          <Banner tone="danger" message={apiErrorMessage(submit.error)} />
        ) : null}
        <Button
          label={result ? "Try again" : "Allow Microphone and Continue"}
          fullWidth={false}
          loading={running || submit.isPending}
          onPress={() => void run()}
        />
      </VStack>
    </Card>
  );
}
