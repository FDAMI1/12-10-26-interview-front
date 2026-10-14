import React from "react";
import { QuestionOutcome } from "@modules/interview/types";
import { Card, Text, VStack, HStack, StatusChip } from "@shared/ui";

const STATUS: Record<
  QuestionOutcome["finalStatus"],
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  answered: { label: "Answered", tone: "success" },
  partially_answered: { label: "Partly answered", tone: "warning" },
  unanswered: { label: "Not answered", tone: "danger" },
  no_answer: { label: "No answer", tone: "neutral" },
  not_assessed: { label: "Not assessed", tone: "neutral" },
};

const RELEVANCE: Record<string, string> = {
  relevant: "on topic",
  partially_relevant: "partly on topic",
  irrelevant: "off topic",
  unclear: "unclear",
  incomplete: "incomplete",
};

/**
 * Each question with how the final answer related to it. Redirects are shown
 * as a fact, not a penalty: the round score is based on the final answer.
 */
export function QuestionOutcomes({
  questions,
}: {
  questions: QuestionOutcome[];
}) {
  if (!questions?.length) return null;
  return (
    <Card style={{ marginTop: 8 }}>
      <VStack gap={12}>
        <Text variant="label" tone="secondary">
          Questions
        </Text>
        {questions.map((q, i) => {
          const status = STATUS[q.finalStatus] ?? STATUS.not_assessed;
          return (
            <VStack key={q.questionId} gap={4}>
              <Text variant="body-sm">
                {i + 1}. {q.question}
              </Text>
              <HStack gap={8} wrap align="center">
                <StatusChip label={status.label} tone={status.tone} />
                {q.relevance ? (
                  <Text variant="caption" tone="tertiary">
                    Final answer {RELEVANCE[q.relevance] ?? q.relevance}
                  </Text>
                ) : null}
                {q.redirections ? (
                  <Text variant="caption" tone="tertiary">
                    · brought back to the question {q.redirections}{" "}
                    {q.redirections === 1 ? "time" : "times"}
                  </Text>
                ) : null}
              </HStack>
            </VStack>
          );
        })}
      </VStack>
    </Card>
  );
}
