import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { InterviewsStackParamList } from "@modules/interview/InterviewsNavigator";
import {
  useCreateInterview,
  useTemplates,
} from "@modules/interview/hooks/useInterviews";
import { ROUND_LABEL, RoundType, SetupConfig } from "@modules/interview/types";
import { apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
import {
  Card,
  ListRow,
  Divider,
  Button,
  Banner,
  VStack,
  Text,
  TextField,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<InterviewsStackParamList>;

const ROUNDS: RoundType[] = ["technical", "hr", "managerial"];
const ROLE_OK = /^[\p{L}\p{N} .,&+#/()'-]{2,80}$/u;

interface Props {
  setupMode: "resume" | "mcq";
  /** The resume or question set to use; nothing can start without one. */
  preparationId: string | null;
  defaultRole: string;
  config: SetupConfig;
  /** Runs first, e.g. to save the question set or the corrected role. */
  beforeStart?: (role: string) => Promise<string | null>;
  disabledReason?: string;
}

/**
 * The last step of a resume- or MCQ-based setup: confirm the role, choose the
 * round(s), then create the interview and go to consent and the device check.
 */
export function StartPreparedInterview({
  setupMode,
  preparationId,
  defaultRole,
  config,
  beforeStart,
  disabledReason,
}: Props) {
  const navigation = useNavigation<Nav>();
  const verified = useAuthStore((s) => s.user?.emailVerified ?? false);
  const templates = useTemplates();
  const create = useCreateInterview();
  const [role, setRole] = useState(defaultRole);
  const [rounds, setRounds] = useState<RoundType[]>(["technical"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const single = config.roundMode === "single";
  const minutes = Math.round(config.durationSeconds / 60);
  const roleOk = ROLE_OK.test(role.trim());
  const templateId = templates.data?.[0]?.id ?? null;

  const toggle = (r: RoundType) =>
    setRounds((cur) =>
      single ? [r] : cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r],
    );

  const start = async () => {
    if (!templateId) return;
    setError(null);
    setBusy(true);
    try {
      const id = beforeStart ? await beforeStart(role.trim()) : preparationId;
      if (!id) return;
      const interview = await create.mutateAsync({
        templateId,
        targetRole: role.trim(),
        setupMode,
        preparationId: id,
        // Asked in a fixed order, whatever order they were tapped in.
        roundTypes: ROUNDS.filter((r) => rounds.includes(r)),
      });
      navigation.replace("InterviewSession", { id: interview.id });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <VStack gap={12}>
      <Card>
        <TextField
          label="Target job role"
          value={role}
          onChangeText={setRole}
          placeholder="For example: Data Scientist"
          hint="Correct it if it is not the job you are preparing for."
          error={
            role.trim() && !roleOk
              ? "Use 2 to 80 letters and numbers"
              : undefined
          }
          autoCapitalize="words"
          maxLength={80}
        />
      </Card>
      <Text variant="label" tone="secondary">
        {single
          ? `Round (one ${minutes}-minute interview)`
          : `Rounds (${minutes} minutes each)`}
      </Text>
      <Card padded={false}>
        {ROUNDS.map((r, i) => (
          <React.Fragment key={r}>
            {i > 0 ? <Divider /> : null}
            <ListRow
              title={ROUND_LABEL[r]}
              value={rounds.includes(r) ? "Selected" : undefined}
              onPress={() => toggle(r)}
            />
          </React.Fragment>
        ))}
      </Card>
      {disabledReason ? <Banner tone="info" message={disabledReason} /> : null}
      {error ? <Banner tone="danger" message={error} /> : null}
      <Button
        label="Continue to consent and audio check"
        size="lg"
        disabled={
          (!preparationId && !beforeStart) ||
          !!disabledReason ||
          !roleOk ||
          !rounds.length ||
          !templateId ||
          !verified
        }
        loading={busy}
        onPress={() => void start()}
      />
      <Text variant="caption" tone="tertiary">
        The clock is kept by the server: refreshing or reconnecting does not
        reset it.
      </Text>
    </VStack>
  );
}
