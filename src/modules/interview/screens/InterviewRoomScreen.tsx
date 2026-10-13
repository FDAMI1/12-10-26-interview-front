import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Send } from "lucide-react-native";
import { VoicePicker } from "@modules/interview/components/VoicePicker";
import { interviewApi } from "@modules/interview/api/interviewApi";
import { useRoom } from "@modules/interview/hooks/useInterviews";
import { useCountdown } from "@modules/interview/hooks/useCountdown";
import {
  speak,
  stopSpeaking,
  getVoicePreference,
  setVoicePreference,
  InterviewerVoice,
  useSpeechRecognition,
} from "@modules/interview/voice";
import {
  useRoundRecorder,
  uploadRoundRecording,
  recordingSupported,
} from "@modules/interview/recorder";
import { InterviewsStackParamList } from "@modules/interview/InterviewsNavigator";
import { ROUND_LABEL, RoomState, Turn } from "@modules/interview/types";
import { apiErrorCode, apiErrorMessage } from "@api/apiClient";
import { formatClock, requestId } from "@shared/format";
import { palette, radius, numeric } from "@shared/designSystem";
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
} from "@shared/ui";

type Nav = NativeStackNavigationProp<InterviewsStackParamList>;
const LIVE = ["in_progress", "reconnecting"];

export default function InterviewRoomScreen() {
  const navigation = useNavigation<Nav>();
  const { id } = useRoute<RouteProp<InterviewsStackParamList, "InterviewRoom">>().params;
  const qc = useQueryClient();
  const room = useRoom(id);
  const state = room.data;
  const round = state?.currentRound ?? null;
  const live = !!round && LIVE.includes(round.status);

  const [draft, setDraft] = useState("");
  const [voice, setVoice] = useState<InterviewerVoice>(getVoicePreference);
  const mic = useSpeechRecognition((text) =>
    setDraft((d) => (d ? `${d} ${text}` : text)),
  );
  const seconds = useCountdown(live && state ? state.deadlineMs : null);
  // Consent was given before the interview could start; this only checks the
  // server has storage and this platform can capture.
  const canRecord = !!state?.interview.recordingEnabled && recordingSupported();
  const recorder = useRoundRecorder(live && canRecord, round?.id ?? null);

  const reload = () => qc.invalidateQueries({ queryKey: ["interview-room", id] });

  const answer = useMutation({
    mutationFn: (text: string) =>
      interviewApi.addTurn(id, round!.id, requestId(), text),
    onSuccess: (r) => {
      setDraft("");
      qc.setQueryData<RoomState>(["interview-room", id], (prev) =>
        prev
          ? {
              ...prev,
              currentRound: r.round,
              turns: [...prev.turns, r.turn, ...(r.aiTurn ? [r.aiTurn] : [])],
            }
          : prev,
      );
    },
    // The server closed the round under us: show what it now says.
    onError: (err) => {
      if (apiErrorCode(err) === "ROUND_CLOSED") void reload();
    },
  });

  const finish = useMutation({
    mutationFn: async (reason: "timer_expired" | "candidate_finished") => {
      const roundId = round!.id;
      const audio = await recorder.stop();
      const result = await interviewApi.completeRound(id, roundId, requestId(), reason);
      // After the round is closed, so a slow upload never holds the clock open.
      // It finishes in the background; the report shows the recording once stored.
      if (audio)
        void uploadRoundRecording(id, roundId, audio).then(() =>
          qc.invalidateQueries({ queryKey: ["interview-report", id] }),
        );
      return result;
    },
    onSuccess: (r) => {
      stopSpeaking();
      mic.stop();
      void qc.invalidateQueries({ queryKey: ["interviews"] });
      void qc.invalidateQueries({ queryKey: ["interview", id] });
      if (r.interview.status === "completed")
        navigation.replace("InterviewReport", { id });
      else void reload();
    },
  });

  const startNext = useMutation({
    mutationFn: (roundId: string) => interviewApi.startRound(id, roundId),
    onSuccess: () => reload(),
  });

  // Read each new interviewer question aloud, once.
  const lastAi = [...(state?.turns ?? [])].reverse().find((t) => t.speaker === "ai");
  const spoken = useRef<string | null>(null);
  useEffect(() => {
    if (live && lastAi && spoken.current !== lastAi.id) {
      spoken.current = lastAi.id;
      const turnId = lastAi.id;
      speak(
        lastAi.text,
        voice,
        state?.interview.voiceEnabled && round
          ? interviewApi.turnSpeechPath(id, round.id, turnId, voice)
          : undefined,
      );
    }
  }, [live, lastAi, voice, id, round, state?.interview.voiceEnabled]);
  useEffect(() => stopSpeaking, []);

  // When the local countdown reaches zero, ask the server to close the round.
  // The server decides the real reason; this only saves waiting for its sweep.
  const closedFor = useRef<string | null>(null);
  const finishRound = finish.mutate;
  useEffect(() => {
    if (live && round && seconds === 0 && closedFor.current !== round.id) {
      closedFor.current = round.id;
      finishRound("timer_expired");
    }
  }, [live, round, seconds, finishRound]);

  if (room.isLoading || !state)
    return (
      <Screen title="Interview room" back={false}>
        {room.isError ? (
          <ErrorState
            error={room.error}
            title="Couldn't reach the interview"
            message="Your progress is saved. Reconnect to carry on."
            onRetry={() => void room.refetch()}
            retrying={room.isFetching}
          />
        ) : (
          <Skeleton height={240} />
        )}
      </Screen>
    );

  const { interview } = state;
  const nextRound = (interview.rounds ?? []).find((r) => r.status === "pending");

  if (interview.status === "completed")
    return (
      <Screen title="Interview complete" back={false}>
        <Button
          label="View report"
          onPress={() => navigation.replace("InterviewReport", { id })}
        />
      </Screen>
    );

  // Between rounds: the clock is stopped until the candidate starts the next one.
  if (!live)
    return (
      <Screen title={interview.targetRole} back={false}>
        <Card>
          <VStack gap={12}>
            <Text variant="h3">
              {round ? `${ROUND_LABEL[round.roundType]} finished` : "Round finished"}
            </Text>
            {nextRound ? (
              <>
                <Text variant="body-sm" tone="secondary">
                  Take a breath. The next 10-minute timer starts when you press
                  the button.
                </Text>
                {startNext.isError ? (
                  <Banner tone="danger" message={apiErrorMessage(startNext.error)} />
                ) : null}
                <Button
                  label={`Start ${ROUND_LABEL[nextRound.roundType].toLowerCase()}`}
                  size="lg"
                  loading={startNext.isPending || room.isFetching}
                  onPress={() => startNext.mutate(nextRound.id)}
                />
              </>
            ) : (
              <Button
                label="Back to the interview"
                onPress={() => navigation.replace("InterviewSession", { id })}
              />
            )}
          </VStack>
        </Card>
      </Screen>
    );

  const remaining = seconds ?? round.remainingSeconds;
  const tone =
    remaining <= 30 ? "danger" : remaining <= state.warningAtSeconds ? "warning" : null;
  const busy = answer.isPending || finish.isPending;
  // The interviewer has closed the round, or (older rounds) has nothing left to ask.
  const planDone =
    round.questionsAsked >= round.questionCount &&
    (lastAi?.kind === "wrap_up" || lastAi !== state.turns.at(-1));

  return (
    <Screen
      title={ROUND_LABEL[round.roundType]}
      subtitle={`Round ${round.sequence} of ${(interview.rounds ?? []).length} · ${interview.targetRole}`}
      back={false}
      right={
        <View accessibilityRole="timer" accessibilityLabel={`${remaining} seconds remaining`}>
          <Text
            variant="display-md"
            tone={tone === "danger" ? "danger" : tone === "warning" ? "warning" : "primary"}
            style={numeric}
          >
            {formatClock(remaining)}
          </Text>
        </View>
      }
    >
      <VStack gap={12}>
        <HStack gap={8} wrap>
          <StatusChip
            label={room.isFetching ? "Reconnecting" : "Connected"}
            tone={room.isFetching ? "warning" : "success"}
          />
          <StatusChip
            label={mic.listening ? "Listening" : mic.supported ? "Microphone off" : "Typed answers"}
            tone={mic.listening ? "info" : "neutral"}
          />
          <StatusChip
            label={
              recorder.state === "recording"
                ? "● Recording audio"
                : recorder.state === "blocked"
                  ? "Microphone blocked · audio not recorded"
                  : "Transcript saved · audio not recorded"
            }
            tone={recorder.state === "recording" ? "danger" : "neutral"}
            icon={false}
          />
        </HStack>

        <VoicePicker
          sampleFromServer={interview.voiceEnabled}
          value={voice}
          onChange={(v) => {
            setVoicePreference(v);
            setVoice(v);
          }}
        />

        {tone ? (
          <Banner
            tone={tone}
            message={
              tone === "danger"
                ? "30 seconds left. Finish your sentence - the round closes automatically."
                : `${formatClock(remaining)} left in this round.`
            }
          />
        ) : null}

        <Card>
          <VStack gap={12}>
            {state.turns.map((t) => (
              <TurnBubble key={t.id} turn={t} />
            ))}
            {answer.isPending ? (
              <Text variant="body-sm" tone="tertiary">
                The interviewer is considering your answer...
              </Text>
            ) : null}
            {planDone ? (
              <Text variant="body-sm" tone="tertiary">
                That was the last question. Finish the round when you are ready.
              </Text>
            ) : null}
          </VStack>
        </Card>

        {answer.isError && apiErrorCode(answer.error) !== "ROUND_CLOSED" ? (
          <Banner
            tone="danger"
            title="Your answer was not saved"
            message={`${apiErrorMessage(answer.error)} Your text is still below - send it again.`}
          />
        ) : null}
        {finish.isError ? (
          <Banner tone="danger" message={apiErrorMessage(finish.error)} />
        ) : null}

        {!planDone ? (
          <Card>
            <VStack gap={10}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                multiline
                editable={!busy}
                placeholder={
                  mic.supported
                    ? "Press the microphone and speak, or type your answer"
                    : "Type your answer"
                }
                placeholderTextColor={palette.text.tertiary}
                accessibilityLabel="Your answer"
                style={styles.input}
              />
              <HStack gap={8} wrap>
                {mic.supported ? (
                  <Button
                    label={mic.listening ? "Stop" : "Speak"}
                    variant="secondary"
                    fullWidth={false}
                    disabled={busy}
                    icon={
                      mic.listening ? (
                        <MicOff size={16} color={palette.text.primary} />
                      ) : (
                        <Mic size={16} color={palette.text.primary} />
                      )
                    }
                    onPress={mic.listening ? mic.stop : mic.start}
                  />
                ) : null}
                <Button
                  label="Send answer"
                  fullWidth={false}
                  disabled={!draft.trim() || finish.isPending}
                  loading={answer.isPending}
                  icon={<Send size={16} color="#FFFFFF" />}
                  onPress={() => {
                    mic.stop();
                    answer.mutate(draft.trim());
                  }}
                />
              </HStack>
            </VStack>
          </Card>
        ) : null}

        <Button
          label="Finish this round"
          variant={planDone ? "primary" : "ghost"}
          fullWidth={planDone}
          disabled={answer.isPending}
          loading={finish.isPending}
          onPress={() => finish.mutate("candidate_finished")}
        />
      </VStack>
    </Screen>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  const ai = turn.speaker === "ai";
  return (
    <View style={[styles.bubble, ai ? styles.ai : styles.me]}>
      <Text variant="overline" tone="tertiary">
        {ai ? "Interviewer" : "You"}
      </Text>
      <Text variant="body">{turn.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 96,
    maxHeight: 220,
    fontSize: 14,
    lineHeight: 20,
    color: palette.text.primary,
    borderWidth: 1,
    borderColor: palette.border.strong,
    borderRadius: radius.md,
    padding: 10,
    textAlignVertical: "top",
  },
  bubble: { padding: 10, borderRadius: radius.md, gap: 2, maxWidth: 720 },
  ai: { backgroundColor: palette.surface.sunken, alignSelf: "flex-start" },
  me: { backgroundColor: palette.teal[50], alignSelf: "flex-end" },
});
