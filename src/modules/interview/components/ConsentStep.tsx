import React from "react";
import { useConsent } from "@modules/interview/hooks/useInterviews";
import { apiErrorMessage } from "@api/apiClient";
import { Card, Text, VStack, HStack, Button, Banner } from "@shared/ui";

const points = (recordsAudio: boolean) => [
  recordsAudio
    ? "What we keep: an audio recording of your microphone for each round, and a written transcript of the questions and your answers. Only your side is recorded; there is no video."
    : "What we keep: a written transcript of the questions and your answers. Audio is not recorded on this device.",
  "Why: to score your answers with AI, give you written feedback, and let you review the session later. Your answers are sent to our AI provider (Google Gemini) for this.",
  recordsAudio
    ? "Who can see it: you. If a company invited you to this interview, its authorised reviewers can see and hear it too."
    : "Who can see it: you. If a company invited you to this interview, its authorised reviewers can read it too.",
  "How long: until you delete your account. Deleting it removes every interview straight away.",
  "Your choice: you can decline now and your interview credit is returned. You can delete your account and all its data at any time from your profile.",
];

interface Props {
  interviewId: string;
  consentVersion: string;
  /** Audio will actually be captured: storage is configured and this is the web app. */
  recordsAudio: boolean;
  onDeclined: () => void;
}

/** Explicit consent before anything is captured (PRD 2.4). */
export function ConsentStep({ interviewId, consentVersion, recordsAudio, onDeclined }: Props) {
  const mut = useConsent(interviewId);
  return (
    <Card>
      <VStack gap={12}>
        <Text variant="h3">Before we begin</Text>
        {points(recordsAudio).map((p) => (
          <Text key={p} variant="body-sm" tone="secondary">
            {p}
          </Text>
        ))}
        <Text variant="caption" tone="tertiary">
          AI feedback is for practice and assessment support. It is not an
          employment decision. Consent version {consentVersion}.
        </Text>
        {mut.isError ? (
          <Banner tone="danger" message={apiErrorMessage(mut.error)} />
        ) : null}
        <HStack gap={8} wrap>
          <Button
            label="I agree, continue"
            fullWidth={false}
            loading={mut.isPending}
            onPress={() =>
              mut.mutate({ accepted: true, version: consentVersion })
            }
          />
          <Button
            label="Decline and cancel"
            variant="secondary"
            fullWidth={false}
            disabled={mut.isPending}
            onPress={() =>
              mut.mutate(
                { accepted: false, version: consentVersion },
                { onSuccess: onDeclined },
              )
            }
          />
        </HStack>
      </VStack>
    </Card>
  );
}
