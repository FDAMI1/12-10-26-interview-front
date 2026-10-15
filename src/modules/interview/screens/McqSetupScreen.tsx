import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react-native";
import {
  useSetupConfig,
  usePreparations,
  useSaveMcqSet,
} from "@modules/interview/hooks/usePreparations";
import { StartPreparedInterview } from "@modules/interview/components/StartPreparedInterview";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { McqQuestion, Preparation } from "@modules/interview/types";
import { questionnaire } from "@modules/interview/questionnaire";
import { QuestionnaireStepper } from "@modules/interview/components/QuestionnaireStepper";
import { formatDate } from "@shared/format";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  Button,
  Banner,
  Skeleton,
  ErrorState,
  VStack,
  HStack,
  Text,
  TextField,
} from "@shared/ui";

const LETTERS = "ABCDEF";
const MAX_OPTIONS = 6;
const blank = (): McqQuestion => ({
  text: "",
  options: ["", "", "", ""],
  correctIndex: -1,
});

/** The first thing stopping the set from being used, in words; null when it is ready. */
export function mcqProblem(
  questions: McqQuestion[],
  max: number,
  selfAssessment = false,
): string | null {
  if (!questions.length) return "Add at least one question.";
  if (questions.length > max) return `A set can have at most ${max} questions.`;
  for (const [i, q] of questions.entries()) {
    const n = `Question ${i + 1}`;
    const options = q.options.map((o) => o.trim());
    if (q.text.trim().length < 5)
      return `${n}: write the question (at least 5 characters).`;
    if (options.filter(Boolean).length < 2)
      return `${n}: give at least 2 answer options.`;
    if (options.some((o) => !o))
      return `${n}: fill in or remove the empty option.`;
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
      return `${n}: options must all be different.`;
    if (q.correctIndex < 0 || q.correctIndex >= options.length)
      return selfAssessment
        ? `${n}: choose your answer.`
        : `${n}: mark the correct answer.`;
  }
  return null;
}

export default function McqSetupScreen() {
  const config = useSetupConfig();
  const sets = usePreparations("mcq");
  const save = useSaveMcqSet();
  const [setId, setSetId] = useState<string | null>(null);
  // A new set starts as the candidate questionnaire; the candidate can write their own quiz instead.
  const [selfAssessment, setSelfAssessment] = useState(true);
  const [questions, setQuestions] = useState<McqQuestion[]>(questionnaire);
  const answered = questions.filter((q) => q.correctIndex >= 0).length;
  // Remounts the start step so its role field picks up a loaded set's role.
  const [loadedRole, setLoadedRole] = useState("");

  const cfg = config.data;
  const problem = cfg
    ? mcqProblem(questions, cfg.mcqMaxQuestions, selfAssessment)
    : null;
  const startNew = (asQuestionnaire: boolean) => {
    setSetId(null);
    setSelfAssessment(asQuestionnaire);
    setQuestions(asQuestionnaire ? questionnaire() : [blank()]);
    setLoadedRole("");
  };

  const load = (p: Preparation) => {
    setSetId(p.id);
    setQuestions(p.questions.map((q) => ({ ...q, options: [...q.options] })));
    setSelfAssessment(p.selfAssessment);
    setLoadedRole(p.targetRole);
  };
  const edit = (i: number, change: Partial<McqQuestion>) =>
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...change } : q)));

  return (
    <Screen
      title="MCQ-based preparation"
      subtitle="Answer the candidate questionnaire, or write your own practice questions. The interviewer builds a spoken interview on them."
      back="Back"
    >
      {config.isLoading || sets.isLoading ? (
        <Skeleton height={200} />
      ) : config.isError || !cfg ? (
        <ErrorState
          error={config.error}
          onRetry={() => void config.refetch()}
        />
      ) : !cfg.mcqEnabled ? (
        <Banner
          tone="info"
          message="MCQ-based interviews are turned off by the administrator."
        />
      ) : (
        <VStack gap={14}>
          <VerifyEmailCard />
          {(sets.data ?? []).length ? (
            <>
              <Text variant="label" tone="secondary">
                Your saved sets
              </Text>
              <Card padded={false}>
                {(sets.data ?? []).map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 ? <Divider /> : null}
                    <ListRow
                      title={p.title}
                      subtitle={`${p.questions.length} question${p.questions.length === 1 ? "" : "s"} · ${formatDate(p.updatedAt)}`}
                      value={setId === p.id ? "Editing" : undefined}
                      onPress={() => load(p)}
                    />
                  </React.Fragment>
                ))}
              </Card>
            </>
          ) : null}

          <HStack gap={8} wrap>
            <Button
              label="Candidate questionnaire"
              variant={selfAssessment && !setId ? "primary" : "secondary"}
              size="sm"
              fullWidth={false}
              onPress={() => startNew(true)}
            />
            <Button
              label="Write my own questions"
              variant={!selfAssessment && !setId ? "primary" : "secondary"}
              size="sm"
              fullWidth={false}
              onPress={() => startNew(false)}
            />
          </HStack>

          {selfAssessment ? (
            <QuestionnaireStepper
              // A fresh or newly loaded questionnaire starts its own steps. The
              // prefix keeps it apart from the start step's key below.
              key={`questionnaire-${setId ?? "new"}`}
              questions={questions}
              onSelect={(i, j) => edit(i, { correctIndex: j })}
            />
          ) : (
            <>
              {questions.map((q, i) => (
                <QuestionEditor
                  key={i}
                  index={i}
                  question={q}
                  onChange={(change) => edit(i, change)}
                  onDelete={
                    questions.length > 1
                      ? () => setQuestions((qs) => qs.filter((_, j) => j !== i))
                      : undefined
                  }
                />
              ))}
              <Button
                label={`Add a question (${questions.length} of ${cfg.mcqMaxQuestions})`}
                variant="secondary"
                icon={<Plus size={16} />}
                disabled={questions.length >= cfg.mcqMaxQuestions}
                onPress={() => setQuestions((qs) => [...qs, blank()])}
              />
            </>
          )}

          {/* The questionnaire leads to the role and round step once every question is answered. */}
          {!selfAssessment || answered === questions.length ? (
            <StartPreparedInterview
              key={setId ?? "new"}
              setupMode="mcq"
              preparationId={setId}
              defaultRole={loadedRole}
              config={cfg}
              disabledReason={problem ?? undefined}
              beforeStart={async (role) => {
                // Saved every time, so the set is there for the next interview too.
                const saved = await save.mutateAsync({
                  id: setId,
                  body: {
                    title: selfAssessment
                      ? "Candidate questionnaire"
                      : undefined,
                    selfAssessment,
                    targetRole: role,
                    questions: questions.map((q) => ({
                      ...q,
                      text: q.text.trim(),
                      options: q.options.map((o) => o.trim()),
                    })),
                  },
                });
                setSetId(saved.id);
                return saved.id;
              }}
            />
          ) : null}
        </VStack>
      )}
    </Screen>
  );
}

interface EditorProps {
  index: number;
  question: McqQuestion;
  onChange: (change: Partial<McqQuestion>) => void;
  onDelete?: () => void;
}

function QuestionEditor({
  index,
  question: q,
  onChange,
  onDelete,
}: EditorProps) {
  const setOption = (j: number, value: string) =>
    onChange({ options: q.options.map((o, k) => (k === j ? value : o)) });
  const removeOption = (j: number) =>
    onChange({
      options: q.options.filter((_, k) => k !== j),
      // Keep the mark on the same answer, or clear it if that answer went.
      correctIndex:
        q.correctIndex === j
          ? -1
          : q.correctIndex > j
            ? q.correctIndex - 1
            : q.correctIndex,
    });

  return (
    <Card>
      <VStack gap={10}>
        <HStack justify="space-between" align="center">
          <Text variant="label">Question {index + 1}</Text>
          {onDelete ? (
            <Button
              label="Delete"
              variant="ghost"
              size="xs"
              fullWidth={false}
              icon={<Trash2 size={14} />}
              onPress={onDelete}
            />
          ) : null}
        </HStack>
        <TextField
          label="Question"
          value={q.text}
          onChangeText={(text) => onChange({ text })}
          placeholder="For example: What is the purpose of JWT?"
          maxLength={500}
        />
        {q.options.map((o, j) => (
          <VStack key={j} gap={6}>
            <TextField
              label={`Option ${LETTERS[j]}`}
              value={o}
              onChangeText={(v) => setOption(j, v)}
              maxLength={200}
            />
            <HStack gap={8}>
              <Button
                label={q.correctIndex === j ? "Correct" : "Mark correct"}
                variant={q.correctIndex === j ? "primary" : "secondary"}
                size="sm"
                fullWidth={false}
                onPress={() => onChange({ correctIndex: j })}
              />
              {q.options.length > 2 ? (
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  icon={<Trash2 size={14} />}
                  onPress={() => removeOption(j)}
                />
              ) : null}
            </HStack>
          </VStack>
        ))}
        {q.options.length < MAX_OPTIONS ? (
          <Button
            label="Add an option"
            variant="ghost"
            size="sm"
            fullWidth={false}
            icon={<Plus size={14} />}
            onPress={() => onChange({ options: [...q.options, ""] })}
          />
        ) : null}
      </VStack>
    </Card>
  );
}
