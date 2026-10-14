import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { FileText } from "lucide-react-native";
import {
  useSetupConfig,
  usePreparations,
  useUploadResume,
  useUpdateRole,
  useDeletePreparation,
} from "@modules/interview/hooks/usePreparations";
import { StartPreparedInterview } from "@modules/interview/components/StartPreparedInterview";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { Preparation } from "@modules/interview/types";
import { apiErrorMessage } from "@api/apiClient";
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
  ConfirmDialog,
} from "@shared/ui";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export default function ResumeSetupScreen() {
  const config = useSetupConfig();
  const resumes = usePreparations("resume");
  const upload = useUploadResume();
  const updateRole = useUpdateRole();
  const remove = useDeletePreparation();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);

  const picked = resumes.data?.find((r) => r.id === pickedId) ?? null;
  const cfg = config.data;

  const choose = async () => {
    if (!cfg) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: cfg.resumeFormats.map((f) => MIME[f]).filter(Boolean),
      copyToCacheDirectory: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    // Checked again on the server; this just saves uploading a file that will be refused.
    setTooLarge(Boolean(asset.size && asset.size > cfg.resumeMaxBytes));
    if (asset.size && asset.size > cfg.resumeMaxBytes) return;
    upload.mutate(asset, { onSuccess: (p) => setPickedId(p.id) });
  };

  return (
    <Screen
      title="Resume-based interview"
      subtitle="Upload your resume. The interviewer asks about your real projects, roles and skills."
      back="Back"
    >
      {config.isLoading || resumes.isLoading ? (
        <Skeleton height={200} />
      ) : config.isError || !cfg ? (
        <ErrorState
          error={config.error}
          onRetry={() => void config.refetch()}
        />
      ) : !cfg.resumeEnabled ? (
        <Banner
          tone="info"
          message="Resume-based interviews are turned off by the administrator."
        />
      ) : (
        <VStack gap={14}>
          <VerifyEmailCard />
          <Card>
            <VStack gap={10}>
              <Text variant="body-sm" tone="secondary">
                {cfg.resumeFormats.map((f) => f.toUpperCase()).join(" or ")}, up
                to {Math.round((cfg.resumeMaxBytes / 1_000_000) * 10) / 10} MB,
                with selectable text (not a scan). We keep only the skills,
                experience, education and projects we find, never the file or
                your contact details, and you can delete them at any time.
              </Text>
              <Button
                label={
                  upload.isPending ? "Reading your resume..." : "Upload resume"
                }
                variant="secondary"
                icon={<FileText size={16} />}
                loading={upload.isPending}
                onPress={() => void choose()}
              />
              {tooLarge ? (
                <Banner
                  tone="danger"
                  message="This file is larger than the allowed size."
                />
              ) : null}
              {upload.isError ? (
                <Banner tone="danger" message={apiErrorMessage(upload.error)} />
              ) : null}
            </VStack>
          </Card>

          {(resumes.data ?? []).length ? (
            <>
              <Text variant="label" tone="secondary">
                Your resumes
              </Text>
              <Card padded={false}>
                {(resumes.data ?? []).map((r, i) => (
                  <React.Fragment key={r.id}>
                    {i > 0 ? <Divider /> : null}
                    <ListRow
                      title={r.title}
                      subtitle={`${r.targetRole || "Role not found"} · ${formatDate(r.updatedAt)}`}
                      value={pickedId === r.id ? "Selected" : undefined}
                      onPress={() => setPickedId(r.id)}
                    />
                  </React.Fragment>
                ))}
              </Card>
            </>
          ) : null}

          {picked ? (
            <>
              <Extracted resume={picked} />
              <HStack gap={10}>
                <Button
                  label="Delete this resume data"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onPress={() => setConfirmDelete(true)}
                />
              </HStack>
              <StartPreparedInterview
                key={picked.id}
                setupMode="resume"
                preparationId={picked.id}
                defaultRole={picked.targetRole}
                config={cfg}
                beforeStart={async (role) => {
                  // The confirmed role is saved with the resume for next time.
                  if (role !== picked.targetRole)
                    await updateRole.mutateAsync({
                      id: picked.id,
                      targetRole: role,
                    });
                  return picked.id;
                }}
              />
            </>
          ) : null}
        </VStack>
      )}
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this resume data?"
        message="The extracted skills, experience, education and projects are deleted, also from interviews that used them. Transcripts stay."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          picked &&
          remove.mutate(picked.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              setPickedId(null);
            },
          })
        }
      />
    </Screen>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <VStack gap={4}>
      <Text variant="label" tone="secondary">
        {title}
      </Text>
      {items.map((s) => (
        <Text key={s} variant="body-sm">
          {"• "}
          {s}
        </Text>
      ))}
    </VStack>
  );
}

/** What was found, so the candidate can see what the interviewer will ask about. */
function Extracted({ resume }: { resume: Preparation }) {
  const r = resume.resume;
  if (!r) return null;
  return (
    <Card>
      <VStack gap={12}>
        <Text variant="label">What we found</Text>
        {r.summary ? <Text variant="body-sm">{r.summary}</Text> : null}
        {r.skills.length ? (
          <VStack gap={4}>
            <Text variant="label" tone="secondary">
              Skills
            </Text>
            <Text variant="body-sm">{r.skills.join(", ")}</Text>
          </VStack>
        ) : null}
        <Section title="Experience" items={r.experience} />
        <Section title="Projects" items={r.projects} />
        <Section title="Education" items={r.education} />
        <Text variant="caption" tone="tertiary">
          These are claims from your resume, not verified facts. The interviewer
          asks you to explain them.
        </Text>
      </VStack>
    </Card>
  );
}
