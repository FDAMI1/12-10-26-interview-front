import React, { useState } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useInterview,
  useStartInterview,
  useCancelInterview,
} from "@modules/interview/hooks/useInterviews";
import { InterviewsStackParamList } from "@modules/interview/InterviewsNavigator";
import { ConsentStep } from "@modules/interview/components/ConsentStep";
import { recordingSupported } from "@modules/interview/recorder";
import { VoicePicker } from "@modules/interview/components/VoicePicker";
import {
  getVoicePreference,
  setVoicePreference,
  InterviewerVoice,
} from "@modules/interview/voice";
import { DeviceCheckStep } from "@modules/interview/components/DeviceCheckStep";
import { ROUND_LABEL, statusTone } from "@modules/interview/types";
import { apiErrorMessage } from "@api/apiClient";
import { titleCase } from "@shared/format";
import {
  Screen,
  Card,
  Text,
  VStack,
  HStack,
  Button,
  Banner,
  Skeleton,
  ErrorState,
  StatusChip,
  ConfirmDialog,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<InterviewsStackParamList>;
const LIVE = ["in_progress", "reconnecting", "round_submitted"];
const PRE_START = ["consent_pending", "device_check", "ready"];

/** The lobby: consent, device check, then the start button. */
export default function InterviewSessionScreen() {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<RouteProp<InterviewsStackParamList, "InterviewSession">>().params;
  const { data: interview, isLoading, isError, error, refetch } = useInterview(id);
  const start = useStartInterview(id);
  const cancel = useCancelInterview(id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [voice, setVoice] = useState<InterviewerVoice>(getVoicePreference);

  if (isLoading || !interview)
    return (
      <Screen title="Interview">
        {isError ? (
          <ErrorState
            error={error}
            title="Couldn't load this interview"
            actionLabel="Back to interviews"
            onAction={() => navigation.navigate("InterviewsList")}
          />
        ) : (
          <Skeleton height={200} />
        )}
      </Screen>
    );

  const { status } = interview;

  return (
    <Screen
      title={interview.targetRole}
      subtitle={interview.templateName}
      back="Back to interviews"
      right={<StatusChip label={titleCase(status)} tone={statusTone(status)} />}
    >
      <VStack gap={14}>
        <Card>
          <VStack gap={8}>
            <Text variant="h3">Rounds</Text>
            {(interview.rounds ?? []).map((r) => (
              <HStack key={r.id} justify="space-between" align="center">
                <Text variant="body-sm">
                  {r.sequence}. {ROUND_LABEL[r.roundType]} ·{" "}
                  {Math.round(r.durationSeconds / 60)} min
                </Text>
                <StatusChip label={titleCase(r.status)} tone={statusTone(r.status)} />
              </HStack>
            ))}
          </VStack>
        </Card>

        {status === "consent_pending" ? (
          <ConsentStep
            interviewId={id}
            consentVersion={interview.consentVersion ?? ""}
            recordsAudio={interview.recordingEnabled && recordingSupported()}
            onDeclined={() => void refetch()}
          />
        ) : null}

        {status === "device_check" ? <DeviceCheckStep interviewId={id} /> : null}

        {status === "ready" ? (
          <Card>
            <VStack gap={12}>
              <Text variant="h3">You are ready</Text>
              <Text variant="body-sm" tone="secondary">
                The timer starts as soon as you begin and is kept by the server.
                Each round closes automatically when its 10 minutes are up. Find
                a quiet place first.
              </Text>
              <VoicePicker
                value={voice}
                onChange={(v) => {
                  setVoicePreference(v);
                  setVoice(v);
                }}
              />
              {start.isError ? (
                <Banner tone="danger" message={apiErrorMessage(start.error)} />
              ) : null}
              <Button
                label="Start interview"
                size="lg"
                loading={start.isPending}
                onPress={() =>
                  start.mutate(undefined, {
                    onSuccess: () => navigation.replace("InterviewRoom", { id }),
                  })
                }
              />
            </VStack>
          </Card>
        ) : null}

        {LIVE.includes(status) ? (
          <Card>
            <VStack gap={12}>
              <Text variant="h3">Interview in progress</Text>
              <Button
                label="Return to the interview room"
                onPress={() => navigation.navigate("InterviewRoom", { id })}
              />
            </VStack>
          </Card>
        ) : null}

        {status === "completed" ? (
          <Button
            label="View report"
            onPress={() => navigation.navigate("InterviewReport", { id })}
          />
        ) : null}

        {status === "cancelled" ? (
          <Banner
            tone="info"
            message="This interview was cancelled and its credit was returned."
          />
        ) : null}

        {PRE_START.includes(status) ? (
          <Button
            label="Cancel interview"
            variant="ghost"
            fullWidth={false}
            onPress={() => setConfirmCancel(true)}
          />
        ) : null}
        {cancel.isError ? (
          <Banner tone="danger" message={apiErrorMessage(cancel.error)} />
        ) : null}
      </VStack>

      <ConfirmDialog
        visible={confirmCancel}
        title="Cancel this interview?"
        message="Your credit is returned and you can start again whenever you like."
        confirmLabel="Cancel interview"
        cancelLabel="Keep it"
        destructive
        loading={cancel.isPending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() =>
          cancel.mutate(undefined, { onSettled: () => setConfirmCancel(false) })
        }
      />
    </Screen>
  );
}
