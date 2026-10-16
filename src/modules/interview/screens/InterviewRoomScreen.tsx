import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Send } from "lucide-react-native";
import { VoicePicker } from "@modules/interview/components/VoicePicker";
import {
  MicProblemBanner,
  RoundBreak,
  TURN_LABEL,
  TurnBubble,
} from "@modules/interview/components/RoomParts";
import { interviewApi } from "@modules/interview/api/interviewApi";
import { useRoom } from "@modules/interview/hooks/useInterviews";
import { useCountdown } from "@modules/interview/hooks/useCountdown";
import { useRelevanceMonitor } from "@modules/interview/hooks/useRelevanceMonitor";
import { useVoiceTurn } from "@modules/interview/hooks/useVoiceTurn";
import {
  speak,
  stopSpeaking,
  getVoicePreference,
  setVoicePreference,
  InterviewerVoice,
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
  const { id } =
    useRoute<RouteProp<InterviewsStackParamList, "InterviewRoom">>().params;
  const qc = useQueryClient();
  const room = useRoom(id);
  const state = room.data;
  const round = state?.currentRound ?? null;
  const live = !!round && LIVE.includes(round.status);

  const [voice, setVoice] = useState<InterviewerVoice>(getVoicePreference);
  const seconds = useCountdown(live && state ? state.deadlineMs : null);
  // Consent was given before the interview could start; this only checks the
  // server has storage and this platform can capture.
  const canRecord = !!state?.interview.recordingEnabled && recordingSupported();
  const recorder = useRoundRecorder(live && canRecord, round?.id ?? null);

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: ["interview-room", id] }),
    [qc, id],
  );

  const answer = useMutation({
    mutationFn: ({
      text,
      interrupted,
    }: {
      text: string;
      interrupted: boolean;
    }) => interviewApi.addTurn(id, round!.id, requestId(), text, interrupted),
    onSuccess: (r) => {
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
  const sendAnswer = answer.mutateAsync;

  const turn = useVoiceTurn({
    live,
    roundKey: round?.id ?? null,
    silenceLimitMs: (state?.silenceSubmitSeconds ?? 5) * 1000,
    send: useCallback(
      (text: string, interrupted: boolean) => sendAnswer({ text, interrupted }),
      [sendAnswer],
    ),
  });

  const finish = useMutation({
    mutationFn: async (reason: "timer_expired" | "candidate_finished") => {
      const roundId = round!.id;
      const audio = await recorder.stop();
      const result = await interviewApi.completeRound(
        id,
        roundId,
        requestId(),
        reason,
      );
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
      turn.stopListening();
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

  // An answer that has stayed off the question is cut short: the mic stops,
  // what was said so far is sent, and the interviewer speaks the redirect.
  const { submit } = turn;
  useRelevanceMonitor({
    enabled: live && !!state?.realtimeRelevance && turn.state === "listening",
    draftRef: turn.draftRef,
    check: (text) => interviewApi.relevanceCheck(id, round!.id, text),
    onOffTopic: () => void submit(true),
  });

  // Read each new interviewer question aloud, once. The mic opens when the
  // interviewer stops talking (not before, or it would transcribe the question).
  const lastAi = [...(state?.turns ?? [])]
    .reverse()
    .find((t) => t.speaker === "ai");
  const spoken = useRef<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const { startListening, interviewerSpeaking } = turn;
  const say = useCallback(
    (line: Turn) => {
      setAudioBlocked(false);
      interviewerSpeaking();
      speak(line.text, voice, {
        path:
          state?.interview.voiceEnabled && round
            ? interviewApi.turnSpeechPath(id, round.id, line.id, voice)
            : undefined,
        // After a goodbye the finished interview is shown; after the wrap-up nothing more is asked.
        onDone:
          line.kind === "end_call"
            ? () => void reload()
            : line.kind === "wrap_up"
              ? undefined
              : startListening,
        onBlocked: () => setAudioBlocked(true),
      });
    },
    [
      voice,
      state?.interview.voiceEnabled,
      round,
      id,
      reload,
      startListening,
      interviewerSpeaking,
    ],
  );
  useEffect(() => {
    // The goodbye after "please end the interview" is said even though the round has closed.
    if (
      (live || lastAi?.kind === "end_call") &&
      lastAi &&
      spoken.current !== lastAi.id
    ) {
      spoken.current = lastAi.id;
      say(lastAi);
    }
  }, [live, lastAi, say]);
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
  const nextRound = (interview.rounds ?? []).find(
    (r) => r.status === "pending",
  );

  if (interview.status === "completed")
    return (
      <Screen title="Interview complete" back={false}>
        <Button
          label="View report"
          onPress={() => navigation.replace("InterviewReport", { id })}
        />
      </Screen>
    );

  if (!live)
    return (
      <RoundBreak
        title={interview.targetRole}
        round={round}
        nextRound={nextRound ?? null}
        starting={startNext.isPending || room.isFetching}
        error={startNext.isError ? apiErrorMessage(startNext.error) : null}
        onStartNext={(roundId) => startNext.mutate(roundId)}
        onBack={() => navigation.replace("InterviewSession", { id })}
      />
    );

  const remaining = seconds ?? round.remainingSeconds;
  const tone =
    remaining <= 30
      ? "danger"
      : remaining <= state.warningAtSeconds
        ? "warning"
        : null;
  const listening = turn.state === "listening";
  const busy =
    turn.state === "finalizing_transcript" ||
    turn.state === "evaluating_answer" ||
    finish.isPending;
  const silenceLimitMs = (state.silenceSubmitSeconds ?? 5) * 1000;
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
        <View
          accessibilityRole="timer"
          accessibilityLabel={`${remaining} seconds remaining`}
        >
          <Text
            variant="display-md"
            tone={
              tone === "danger"
                ? "danger"
                : tone === "warning"
                  ? "warning"
                  : "primary"
            }
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
            label={turn.micSupported ? TURN_LABEL[turn.state] : "Typed answers"}
            tone={
              listening
                ? "info"
                : busy || turn.state === "interviewer_speaking"
                  ? "warning"
                  : "neutral"
            }
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

        {audioBlocked && lastAi ? (
          <Banner
            tone="warning"
            title="Your browser needs a tap before it can play sound"
          >
            <Button
              label="Start audio"
              fullWidth={false}
              onPress={() => say(lastAi)}
            />
          </Banner>
        ) : null}

        <Card>
          <VStack gap={12}>
            {state.turns.map((t) => (
              <TurnBubble key={t.id} turn={t} />
            ))}
            {turn.state === "evaluating_answer" ? (
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

        <MicProblemBanner problem={turn.micProblem} />

        {!planDone ? (
          <Card>
            <VStack gap={10}>
              <TextInput
                value={turn.draft}
                onChangeText={turn.type}
                multiline
                editable={!busy}
                placeholder={
                  turn.micSupported
                    ? "Press the microphone and speak, or type your answer"
                    : "Type your answer"
                }
                placeholderTextColor={palette.text.tertiary}
                accessibilityLabel="Your answer"
                style={styles.input}
              />
              {turn.interim ? (
                <View accessibilityLabel="Words being recognised">
                  <Text variant="body-sm" tone="tertiary">
                    {turn.interim}…
                  </Text>
                </View>
              ) : null}
              <HStack gap={8} wrap>
                {turn.micSupported ? (
                  <Button
                    label={listening ? "Stop" : "Speak"}
                    variant="secondary"
                    fullWidth={false}
                    disabled={busy}
                    icon={
                      listening ? (
                        <MicOff size={16} color={palette.text.primary} />
                      ) : (
                        <Mic size={16} color={palette.text.primary} />
                      )
                    }
                    // Stopping by hand also cancels the automatic send: the
                    // candidate wants to look at the answer first.
                    onPress={() =>
                      listening ? turn.stopListening() : turn.startListening()
                    }
                  />
                ) : null}
                <Button
                  label="Send answer"
                  fullWidth={false}
                  disabled={!turn.draft.trim() || finish.isPending}
                  loading={turn.state === "evaluating_answer"}
                  icon={<Send size={16} color="#FFFFFF" />}
                  onPress={() => void turn.submit()}
                />
              </HStack>
              {listening ? (
                <Text variant="caption" tone="tertiary">
                  {turn.silentMs >= 1500
                    ? `Sending your answer in ${Math.max(1, Math.ceil((silenceLimitMs - turn.silentMs) / 1000))}s. Keep talking to continue.`
                    : `Listening. Your answer is sent after ${Math.round(silenceLimitMs / 1000)} seconds of silence.`}
                </Text>
              ) : null}
            </VStack>
          </Card>
        ) : null}

        <Button
          label="Finish this round"
          variant={planDone ? "primary" : "ghost"}
          fullWidth={planDone}
          disabled={turn.state === "evaluating_answer"}
          loading={finish.isPending}
          onPress={() => finish.mutate("candidate_finished")}
        />
      </VStack>
    </Screen>
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
});
