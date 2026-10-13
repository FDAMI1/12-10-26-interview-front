import React, { useCallback, useEffect, useRef, useState } from "react";
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
  // Hands-free answering: the mic opens after each question, and a spoken
  // answer is sent once the candidate has been silent for the threshold.
  const lastSound = useRef(0);
  // True once this answer contains dictated words. Typing clears it, so an
  // answer being edited by hand is never sent out from under the candidate.
  const dictated = useRef(false);
  const draftRef = useRef("");
  const [silentMs, setSilentMs] = useState(0);
  const mic = useSpeechRecognition(
    (text) => {
      dictated.current = true;
      lastSound.current = Date.now();
      setDraft((d) => {
        const next = d ? `${d} ${text}` : text;
        draftRef.current = next;
        return next;
      });
    },
    () => {
      lastSound.current = Date.now();
    },
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
      draftRef.current = "";
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

  const startListening = mic.start;
  const stopListening = mic.stop;
  const sendAnswer = answer.mutate;
  const sending = answer.isPending || finish.isPending;
  const silenceLimitMs = (state?.silenceSubmitSeconds ?? 5) * 1000;

  /** Sends what is in the box. A second call while one is in flight does nothing. */
  const submit = useCallback(() => {
    const text = draftRef.current.trim();
    if (!text || sending) return;
    dictated.current = false;
    setSilentMs(0);
    stopListening();
    sendAnswer(text);
  }, [sending, stopListening, sendAnswer]);

  // The silence clock. It only runs for a dictated answer, restarts on every
  // sound the recogniser hears, and never sends an empty box.
  useEffect(() => {
    if (!live) return;
    const tick = setInterval(() => {
      if (!dictated.current || !draftRef.current.trim() || sending) return setSilentMs(0);
      const idle = Date.now() - lastSound.current;
      setSilentMs(idle);
      if (idle >= silenceLimitMs) submit();
    }, 250);
    return () => clearInterval(tick);
  }, [live, sending, silenceLimitMs, submit]);

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
        // The mic opens when the interviewer stops talking - not before, or it
        // would transcribe the question from the speakers. Not after the
        // closing line: there is nothing left to answer.
        lastAi.kind === "wrap_up" ? undefined : startListening,
      );
    }
  }, [live, lastAi, voice, id, round, state?.interview.voiceEnabled, startListening]);
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

        {mic.problem ? (
          <Banner
            tone="warning"
            title={mic.problem === "blocked" ? "Microphone access is blocked" : "No microphone was found"}
            message={
              mic.problem === "blocked"
                ? "Allow the microphone for this site in your browser's address bar, then press Speak. You can also type your answer and press Send."
                : "Connect a microphone and press Speak, or type your answer and press Send."
            }
          />
        ) : null}

        {!planDone ? (
          <Card>
            <VStack gap={10}>
              <TextInput
                value={draft}
                onChangeText={(t) => {
                  // Typing takes over from dictation: nothing is sent until Send is pressed.
                  dictated.current = false;
                  draftRef.current = t;
                  setDraft(t);
                }}
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
                    onPress={() => {
                      if (mic.listening) {
                        // Stopping by hand also cancels the automatic send: the
                        // candidate wants to look at the answer first.
                        dictated.current = false;
                        mic.stop();
                      } else {
                        stopSpeaking();
                        mic.start();
                      }
                    }}
                  />
                ) : null}
                <Button
                  label="Send answer"
                  fullWidth={false}
                  disabled={!draft.trim() || finish.isPending}
                  loading={answer.isPending}
                  icon={<Send size={16} color="#FFFFFF" />}
                  onPress={submit}
                />
              </HStack>
              {mic.listening ? (
                <Text variant="caption" tone="tertiary">
                  {silentMs >= 1500
                    ? `Sending your answer in ${Math.max(1, Math.ceil((silenceLimitMs - silentMs) / 1000))}s. Keep talking to continue.`
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
