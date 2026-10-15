import React, { useState } from "react";
import { McqQuestion } from "@modules/interview/types";
import {
  Card,
  ListRow,
  Divider,
  Button,
  VStack,
  HStack,
  Text,
} from "@shared/ui";

const LETTERS = "ABCDEF";
// Long enough to see the choice land before the next question replaces it.
const ADVANCE_MS = 300;

interface Props {
  questions: McqQuestion[];
  onSelect: (question: number, option: number) => void;
}

/**
 * The candidate questionnaire one question at a time: picking an answer moves
 * to the next question, Back and Next revisit any of them, and once all are
 * answered a summary lists every answer (tap one to change it).
 */
export function QuestionnaireStepper({ questions, onSelect }: Props) {
  const total = questions.length;
  const answered = questions.filter((q) => q.correctIndex >= 0).length;
  // A saved, finished questionnaire opens on the summary; otherwise on the first open question.
  const firstOpen = questions.findIndex((q) => q.correctIndex < 0);
  const [step, setStep] = useState(firstOpen < 0 ? total : firstOpen);

  const choose = (option: number) => {
    onSelect(step, option);
    const nowAnswered = questions.map((q, i) =>
      i === step ? option : q.correctIndex,
    );
    const nextOpen = nowAnswered.findIndex((c, i) => c < 0 && i > step);
    const anyOpen = nowAnswered.findIndex((c) => c < 0);
    // Next unanswered question, else the summary once everything is answered.
    const next = nextOpen >= 0 ? nextOpen : anyOpen >= 0 ? anyOpen : total;
    setTimeout(() => setStep(next), ADVANCE_MS);
  };

  const header = (
    <Card>
      <VStack gap={4}>
        <Text variant="label">
          {step < total ? `Question ${step + 1} of ${total} · ` : ""}
          {answered}/{total} answered
        </Text>
        <Text variant="body-sm" tone="secondary">
          Select one answer per question. Answer honestly based on your current
          abilities and work history.
        </Text>
      </VStack>
    </Card>
  );

  if (step >= total)
    return (
      <VStack gap={10}>
        {header}
        <Text variant="label" tone="secondary">
          Your answers (tap one to change it)
        </Text>
        <Card padded={false}>
          {questions.map((q, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                title={`${i + 1}. ${q.text}`}
                subtitle={q.options[q.correctIndex] ?? "Not answered"}
                onPress={() => setStep(i)}
              />
            </React.Fragment>
          ))}
        </Card>
      </VStack>
    );

  const q = questions[step];
  return (
    <VStack gap={10}>
      {header}
      <Text variant="h3">
        {step + 1}. {q.text}
      </Text>
      <Card padded={false}>
        {q.options.map((o, j) => (
          <React.Fragment key={j}>
            {j > 0 ? <Divider /> : null}
            <ListRow
              title={`${LETTERS[j]}. ${o}`}
              value={q.correctIndex === j ? "Selected" : undefined}
              chevron={false}
              onPress={() => choose(j)}
            />
          </React.Fragment>
        ))}
      </Card>
      <HStack gap={8} justify="space-between">
        <Button
          label="Previous question"
          variant="secondary"
          size="sm"
          fullWidth={false}
          disabled={step === 0}
          onPress={() => setStep(step - 1)}
        />
        <Button
          label={step === total - 1 ? "Review answers" : "Next question"}
          variant="secondary"
          size="sm"
          fullWidth={false}
          disabled={q.correctIndex < 0}
          onPress={() => setStep(step + 1)}
        />
      </HStack>
    </VStack>
  );
}
