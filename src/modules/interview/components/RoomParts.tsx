import React from "react";
import { View, StyleSheet } from "react-native";
import { ROUND_LABEL, Round, Turn } from "@modules/interview/types";
import { MicProblem } from "@modules/interview/voice";
import { TurnState } from "@modules/interview/hooks/useVoiceTurn";
import { palette, radius } from "@shared/designSystem";
import { Screen, Card, Text, VStack, Button, Banner } from "@shared/ui";

/** What the status chip says in each turn state. */
export const TURN_LABEL: Record<TurnState, string> = {
  waiting_for_candidate: "Microphone off",
  listening: "Listening",
  finalizing_transcript: "Finishing your answer",
  evaluating_answer: "Interviewer is thinking",
  interviewer_speaking: "Interviewer speaking",
};

/** Why the microphone is not listening, and what to do about it. */
export function MicProblemBanner({ problem }: { problem: MicProblem }) {
  if (!problem) return null;
  return (
    <Banner
      tone="warning"
      title={
        problem === "blocked"
          ? "Microphone access is blocked"
          : "No microphone was found"
      }
      message={
        problem === "blocked"
          ? "Allow the microphone for this site in your browser's address bar, then press Speak. You can also type your answer and press Send."
          : "Connect a microphone and press Speak, or type your answer and press Send."
      }
    />
  );
}

/** One line of the conversation, the interviewer's on the left, the candidate's on the right. */
export function TurnBubble({ turn }: { turn: Turn }) {
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

interface BreakProps {
  title: string;
  round: Round | null;
  nextRound: Round | null;
  starting: boolean;
  error: string | null;
  onStartNext: (roundId: string) => void;
  onBack: () => void;
}

/** Between rounds: the clock is stopped until the candidate starts the next one. */
export function RoundBreak({
  title,
  round,
  nextRound,
  starting,
  error,
  onStartNext,
  onBack,
}: BreakProps) {
  return (
    <Screen title={title} back={false}>
      <Card>
        <VStack gap={12}>
          <Text variant="h3">
            {round
              ? `${ROUND_LABEL[round.roundType]} finished`
              : "Round finished"}
          </Text>
          {nextRound ? (
            <>
              <Text variant="body-sm" tone="secondary">
                Take a breath. The next 10-minute timer starts when you press
                the button.
              </Text>
              {error ? <Banner tone="danger" message={error} /> : null}
              <Button
                label={`Start ${ROUND_LABEL[nextRound.roundType].toLowerCase()}`}
                size="lg"
                loading={starting}
                onPress={() => onStartNext(nextRound.id)}
              />
            </>
          ) : (
            <Button label="Back to the interview" onPress={onBack} />
          )}
        </VStack>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 10, borderRadius: radius.md, gap: 2, maxWidth: 720 },
  ai: { backgroundColor: palette.surface.sunken, alignSelf: "flex-start" },
  me: { backgroundColor: palette.teal[50], alignSelf: "flex-end" },
});
