import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileText,
  ListChecks,
  UserRound,
} from "lucide-react-native";
import {
  usePreparations,
  useSetupConfig,
} from "@modules/interview/hooks/usePreparations";
import { useResumePicker } from "@modules/interview/hooks/useResumePicker";
import {
  useTemplates,
  useEntitlements,
  useCreateInterview,
} from "@modules/interview/hooks/useInterviews";
import { InterviewsStackParamList } from "@modules/interview/InterviewsNavigator";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { apiErrorCode, apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
import { palette, radius } from "@shared/designSystem";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  Button,
  Banner,
  Skeleton,
  ErrorState,
  EmptyState,
  VStack,
  Text,
  TextField,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<InterviewsStackParamList>;

/**
 * One hero (upload a resume) and one fallback link. The alternatives - the
 * questionnaire and the standard interview - stay out of sight until the
 * person says they have no resume, or an upload fails.
 */
export default function NewInterviewScreen() {
  const navigation = useNavigation<Nav>();
  const verified = useAuthStore((s) => s.user?.emailVerified ?? false);
  const templates = useTemplates();
  const credits = useEntitlements();
  const create = useCreateInterview();
  const setup = useSetupConfig();
  const resumes = usePreparations("resume");
  const cfg = setup.data;
  const minutes = Math.round((cfg?.durationSeconds ?? 600) / 60);
  const [picked, setPicked] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [standard, setStandard] = useState(false);

  const available = credits.data?.available ?? 0;
  // Platform admins are not metered.
  const unlimited = useAuthStore((s) => s.user?.role === "platform_admin");
  const noCredit =
    !unlimited &&
    (apiErrorCode(create.error) === "ENTITLEMENT_INSUFFICIENT" ||
      (credits.isSuccess && available === 0));

  const { choose, upload, tooLarge } = useResumePicker(cfg, (p) =>
    navigation.navigate("ResumeSetup", { resumeId: p.id }),
  );
  const uploadFailed = tooLarge || upload.isError;
  const lastResume = resumes.data?.[0] ?? null;
  const resumeOn = cfg?.resumeEnabled ?? false;
  const mcqOn = cfg?.mcqEnabled ?? false;
  // With no resume route the alternatives are the main choice.
  const othersOpen = showOthers || uploadFailed || !resumeOn;

  // Asked afresh for every interview: people practise for different jobs.
  const [profession, setProfession] = useState("");
  const professionOk = profession.trim().length >= 2;
  // Any profession works: with no pick, the first listed interview supplies the round format.
  const templateId = picked ?? templates.data?.[0]?.id ?? null;
  const start = () => {
    if (!templateId || !professionOk) return;
    create.mutate(
      { templateId, targetRole: profession.trim() },
      {
        onSuccess: (interview) =>
          navigation.replace("InterviewSession", { id: interview.id }),
      },
    );
  };

  return (
    <Screen title="New interview">
      <VStack gap={14}>
        <VerifyEmailCard />
        {noCredit ? (
          <Banner
            tone="warning"
            title="No interview credits left"
            message="Your free trial is used. Paid plans arrive in a later release."
          />
        ) : unlimited ? null : credits.isSuccess ? (
          <Text variant="caption" tone="tertiary">
            {`${available} interview credit${available === 1 ? "" : "s"} left. One is reserved when you start and returned if you cancel before the first round.`}
          </Text>
        ) : null}
        {create.isError && !noCredit ? (
          <Banner tone="danger" message={apiErrorMessage(create.error)} />
        ) : null}

        {setup.isLoading || resumes.isLoading ? (
          <Skeleton height={220} />
        ) : setup.isError || !cfg ? (
          <ErrorState
            error={setup.error}
            onRetry={() => void setup.refetch()}
          />
        ) : null}

        {cfg && resumeOn ? (
          <View style={styles.hero}>
            <VStack gap={12}>
              <View style={styles.heroIcon}>
                <FileText
                  size={26}
                  color={palette.teal[700]}
                  strokeWidth={1.8}
                />
              </View>
              <Text variant="h2">Upload your resume</Text>
              <Text variant="body-sm" tone="secondary">
                {`${cfg.resumeFormats.map((f) => f.toUpperCase()).join(" or ")}. The interviewer asks about your real projects, roles and skills. ${minutes} minutes.`}
              </Text>
              <Button
                label={
                  upload.isPending ? "Reading your resume..." : "Upload resume"
                }
                size="lg"
                icon={<FileText size={18} color="#FFFFFF" />}
                loading={upload.isPending}
                disabled={!verified || noCredit}
                onPress={() => void choose()}
              />
              {lastResume ? (
                <Button
                  label={`Use your last resume: ${lastResume.title}`}
                  variant="secondary"
                  disabled={!verified || noCredit}
                  onPress={() =>
                    navigation.navigate("ResumeSetup", {
                      resumeId: lastResume.id,
                    })
                  }
                />
              ) : null}
              {tooLarge ? (
                <Banner
                  tone="danger"
                  message="This file is larger than the allowed size. Try a smaller file, or choose another way below."
                />
              ) : upload.isError ? (
                <Banner
                  tone="danger"
                  message={`${apiErrorMessage(upload.error)} Try another file, or choose another way below.`}
                />
              ) : null}
            </VStack>
          </View>
        ) : null}

        {cfg && resumeOn && !uploadFailed ? (
          <Button
            label="Don't have a resume?"
            variant="ghost"
            rightIcon={
              othersOpen ? (
                <ChevronUp size={16} color={palette.text.accent} />
              ) : (
                <ChevronDown size={16} color={palette.text.accent} />
              )
            }
            onPress={() => setShowOthers((v) => !v)}
          />
        ) : null}

        {cfg && othersOpen ? (
          <Card padded={false}>
            {mcqOn ? (
              <>
                <ListRow
                  icon={ListChecks}
                  title="Answer five quick questions"
                  subtitle={`Tell us about yourself and your experience; the interviewer builds on it. ${minutes} minutes.`}
                  chevron
                  onPress={() => navigation.navigate("McqSetup")}
                />
                <Divider />
              </>
            ) : null}
            <ListRow
              icon={UserRound}
              title="Just tell us your profession"
              subtitle="The standard interview: three rounds, 10 minutes each."
              value={standard ? "Selected" : undefined}
              onPress={() => setStandard(true)}
            />
          </Card>
        ) : null}

        {cfg && othersOpen && standard ? (
          <>
            <Card>
              <TextField
                label="What is your profession?"
                value={profession}
                onChangeText={setProfession}
                placeholder="For example: Project Manager, Nurse, Sales Executive, Java Developer"
                hint="The interviewer asks questions for this role."
                autoCapitalize="words"
                maxLength={80}
              />
            </Card>
            <Text variant="label" tone="secondary">
              Interview style (optional)
            </Text>
            {templates.isLoading ? (
              <Skeleton height={120} />
            ) : templates.isError ? (
              <ErrorState
                error={templates.error}
                title="Couldn't load the roles"
                onRetry={templates.refetch}
              />
            ) : (templates.data ?? []).length === 0 ? (
              <Card>
                <EmptyState
                  icon={Briefcase}
                  title="No roles published yet"
                  message="An administrator needs to publish an interview template."
                />
              </Card>
            ) : (
              <Card padded={false}>
                {(templates.data ?? []).map((t, i) => (
                  <React.Fragment key={t.id}>
                    {i > 0 ? <Divider /> : null}
                    <ListRow
                      title={t.targetRole}
                      subtitle={t.description || t.name}
                      value={picked === t.id ? "Selected" : undefined}
                      onPress={() => {
                        setPicked(t.id);
                        // Saves typing when the listed role is the one they want.
                        if (!profession.trim()) setProfession(t.targetRole);
                      }}
                    />
                  </React.Fragment>
                ))}
              </Card>
            )}
            <Button
              label="Continue"
              size="lg"
              disabled={!templateId || !professionOk || !verified || noCredit}
              loading={create.isPending}
              onPress={start}
            />
          </>
        ) : null}
      </VStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.surface.primary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: 20,
    shadowColor: "#2B3F99",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.teal[50],
  },
});
