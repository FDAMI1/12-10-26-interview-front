import React, { useState } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templateApi, Question } from "@modules/company/api/templateApi";
import { CompanyStackParamList } from "@modules/company/CompanyNavigator";
import { ROUND_LABEL, RoundType } from "@modules/interview/types";
import { apiErrorMessage } from "@api/apiClient";
import { titleCase } from "@shared/format";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  Text,
  VStack,
  HStack,
  Button,
  Banner,
  TextField,
  Select,
  Skeleton,
  ErrorState,
  SectionHeader,
  StatusChip,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export default function TemplateEditorScreen() {
  const navigation = useNavigation<Nav>();
  const { scope, templateId } = useRoute<RouteProp<CompanyStackParamList, "TemplateEditor">>().params;
  const qc = useQueryClient();
  const tKey = ["managed-template", scope, templateId];
  const qKey = ["managed-template-questions", scope, templateId];

  const template = useQuery({ queryKey: tKey, queryFn: () => templateApi.get(scope, templateId) });
  const questions = useQuery({ queryKey: qKey, queryFn: () => templateApi.questions(scope, templateId) });
  const t = template.data;
  const isDraft = t?.status === "draft";

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: tKey });
    void qc.invalidateQueries({ queryKey: ["managed-templates", scope] });
    void qc.invalidateQueries({ queryKey: ["templates"] });
  };

  const act = useMutation({
    mutationFn: (action: "publish" | "archive" | "versions") =>
      templateApi.action(scope, templateId, action),
    onSuccess: (result, action) => {
      refreshAll();
      // A new version is a different template: open the fresh draft.
      if (action === "versions")
        navigation.replace("TemplateEditor", { scope, templateId: result.id });
    },
  });

  const toggle = useMutation({
    mutationFn: (q: Question) =>
      templateApi.setQuestionActive(scope, templateId, q.id, !q.active),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  if (template.isLoading || !t)
    return (
      <Screen title="Template" back="Back to templates">
        {template.isError ? (
          <ErrorState
            error={template.error}
            title="Couldn't load this template"
            onRetry={() => void template.refetch()}
          />
        ) : (
          <Skeleton height={220} />
        )}
      </Screen>
    );

  return (
    <Screen
      title={t.targetRole}
      subtitle={`${t.name} · version ${t.version}`}
      back="Back to templates"
      right={
        <StatusChip
          label={titleCase(t.status)}
          tone={t.status === "published" ? "success" : isDraft ? "info" : "neutral"}
        />
      }
    >
      <VStack gap={12}>
        {!isDraft ? (
          <Banner
            tone="info"
            message="Published templates cannot be edited, so past reports stay reproducible. Create a new version to change the questions."
          />
        ) : null}
        {act.isError ? <Banner tone="danger" message={apiErrorMessage(act.error)} /> : null}
        <HStack gap={8} wrap>
          {isDraft ? (
            <Button
              label="Publish"
              fullWidth={false}
              loading={act.isPending}
              onPress={() => act.mutate("publish")}
            />
          ) : (
            <Button
              label="Create new version"
              fullWidth={false}
              loading={act.isPending}
              onPress={() => act.mutate("versions")}
            />
          )}
          {t.status === "published" ? (
            <Button
              label="Archive"
              variant="secondary"
              fullWidth={false}
              disabled={act.isPending}
              onPress={() => act.mutate("archive")}
            />
          ) : null}
        </HStack>

        <Card>
          <VStack gap={6}>
            <Text variant="h3">Scoring rubric</Text>
            {t.rubric.dimensions.map((d) => (
              <HStack key={d.key} justify="space-between">
                <Text variant="body-sm">{d.label}</Text>
                <Text variant="body-sm" tone="tertiary">
                  {d.weight}%
                </Text>
              </HStack>
            ))}
          </VStack>
        </Card>
      </VStack>

      {isDraft ? (
        <>
          <SectionHeader title="Add a question" />
          <AddQuestion
            scope={scope}
            templateId={templateId}
            rounds={t.rounds.map((r) => r.roundType)}
            onAdded={() => void qc.invalidateQueries({ queryKey: qKey })}
          />
        </>
      ) : null}

      {questions.isLoading ? (
        <Skeleton height={120} style={{ marginTop: 20 }} />
      ) : questions.isError ? (
        <ErrorState error={questions.error} onRetry={() => void questions.refetch()} />
      ) : (
        t.rounds.map((r) => {
          const rows = (questions.data ?? []).filter((q) => q.roundType === r.roundType);
          return (
            <React.Fragment key={r.roundType}>
              <SectionHeader title={ROUND_LABEL[r.roundType]} count={rows.length} />
              <Card padded={false}>
                {rows.length === 0 ? (
                  <Text variant="body-sm" tone="tertiary" style={{ padding: 16 }}>
                    No questions yet. Each round needs at least one before
                    publishing.
                  </Text>
                ) : (
                  rows.map((q, i) => (
                    <React.Fragment key={q.id}>
                      {i > 0 ? <Divider /> : null}
                      <ListRow
                        title={q.questionText}
                        subtitle={q.competency || undefined}
                        right={
                          isDraft ? (
                            <Button
                              label={q.active ? "Disable" : "Enable"}
                              variant="ghost"
                              size="xs"
                              fullWidth={false}
                              onPress={() => toggle.mutate(q)}
                            />
                          ) : !q.active ? (
                            <StatusChip label="Disabled" tone="neutral" />
                          ) : undefined
                        }
                      />
                    </React.Fragment>
                  ))
                )}
              </Card>
            </React.Fragment>
          );
        })
      )}
    </Screen>
  );
}

interface AddProps {
  scope: string;
  templateId: string;
  rounds: RoundType[];
  onAdded: () => void;
}

function AddQuestion({ scope, templateId, rounds, onAdded }: AddProps) {
  const [roundType, setRoundType] = useState<RoundType>(rounds[0]);
  const [text, setText] = useState("");
  const [competency, setCompetency] = useState("");
  const add = useMutation({
    mutationFn: () =>
      templateApi.addQuestion(scope, templateId, {
        roundType,
        questionText: text.trim(),
        competency: competency.trim() || undefined,
      }),
    onSuccess: () => {
      setText("");
      setCompetency("");
      onAdded();
    },
  });

  return (
    <Card>
      <VStack gap={12}>
        <Select
          label="Round"
          value={roundType}
          options={rounds.map((r) => ({ value: r, label: ROUND_LABEL[r] }))}
          onChange={(v) => v && setRoundType(v as RoundType)}
        />
        <TextField
          label="Question"
          value={text}
          onChangeText={setText}
          placeholder="Tell me about a time you..."
          multiline
        />
        <TextField
          label="Competency (optional)"
          value={competency}
          onChangeText={setCompetency}
          placeholder="teamwork"
        />
        {add.isError ? <Banner tone="danger" message={apiErrorMessage(add.error)} /> : null}
        <Button
          label="Add question"
          fullWidth={false}
          disabled={text.trim().length < 5}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </VStack>
    </Card>
  );
}
