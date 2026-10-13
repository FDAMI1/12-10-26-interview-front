import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Briefcase } from "lucide-react-native";
import {
  useTemplates,
  useEntitlements,
  useCreateInterview,
} from "@modules/interview/hooks/useInterviews";
import { InterviewsStackParamList } from "@modules/interview/InterviewsNavigator";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { apiErrorCode, apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
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

export default function NewInterviewScreen() {
  const navigation = useNavigation<Nav>();
  const verified = useAuthStore((s) => s.user?.emailVerified ?? false);
  const templates = useTemplates();
  const credits = useEntitlements();
  const create = useCreateInterview();
  const [picked, setPicked] = useState<string | null>(null);

  const available = credits.data?.available ?? 0;
  // Platform admins are not metered.
  const unlimited = useAuthStore((s) => s.user?.role === "platform_admin");
  const noCredit =
    !unlimited &&
    (apiErrorCode(create.error) === "ENTITLEMENT_INSUFFICIENT" ||
      (credits.isSuccess && available === 0));

  // Asked afresh for every interview: people practise for different jobs.
  const [profession, setProfession] = useState("");
  const professionOk = profession.trim().length >= 2;

  const start = () => {
    if (!picked || !professionOk) return;
    create.mutate({ templateId: picked, targetRole: profession.trim() }, {
      onSuccess: (interview) =>
        navigation.replace("InterviewSession", { id: interview.id }),
    });
  };

  return (
    <Screen
      title="New interview"
      subtitle="Tell us your profession, then pick the closest interview. Three rounds, 10 minutes each."
    >
      <VStack gap={14}>
        <VerifyEmailCard />
        {noCredit ? (
          <Banner
            tone="warning"
            title="No interview credits left"
            message="Your free trial is used. Paid plans arrive in a later release."
          />
        ) : unlimited ? (
          <Banner tone="info" message="As a platform admin you can start any number of interviews. No credit is used." />
        ) : credits.isSuccess ? (
          <Banner
            tone="info"
            message={`You have ${available} interview credit${available === 1 ? "" : "s"}. One is reserved when you start and returned if you cancel before the first round.`}
          />
        ) : null}
        {create.isError && !noCredit ? (
          <Banner tone="danger" message={apiErrorMessage(create.error)} />
        ) : null}

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
          Pick the closest interview
        </Text>

        {templates.isLoading ? (
          <Skeleton height={160} />
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
          disabled={!picked || !professionOk || !verified || noCredit}
          loading={create.isPending}
          onPress={start}
        />
      </VStack>
    </Screen>
  );
}
