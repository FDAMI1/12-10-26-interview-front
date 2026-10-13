import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  profileApi,
  EXPERIENCE_LEVELS,
} from "@modules/profile/api/profileApi";
import { DeleteAccountCard } from "@modules/profile/components/DeleteAccountCard";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { apiErrorMessage } from "@api/apiClient";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { useAuthStore } from "@shared/store/useAuthStore";
import { titleCase } from "@shared/format";
import {
  Screen,
  Card,
  Text,
  VStack,
  Button,
  Banner,
  Select,
  Skeleton,
  ErrorState,
  LegalLinks,
} from "@shared/ui";

const schema = z.object({
  displayName: z.string().trim().min(2, "Your name is required").max(80),
  targetRoles: z.string().trim().max(400),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  skills: z.string().trim().max(1000),
});
type Form = z.infer<typeof schema>;

const toList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function ProfileScreen() {
  const qc = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const me = useQuery({ queryKey: ["me"], queryFn: profileApi.me });
  const { control, handleSubmit, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      targetRoles: "",
      experienceLevel: "mid",
      skills: "",
    },
  });

  useEffect(() => {
    if (!me.data) return;
    reset({
      displayName: me.data.user.displayName,
      targetRoles: me.data.candidateProfile?.targetRoles.join(", ") ?? "",
      experienceLevel: me.data.candidateProfile?.experienceLevel ?? "mid",
      skills: me.data.candidateProfile?.skills.join(", ") ?? "",
    });
  }, [me.data, reset]);

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const user = await profileApi.updateMe(f.displayName);
      await profileApi.updateCandidateProfile({
        targetRoles: toList(f.targetRoles).slice(0, 10),
        experienceLevel: f.experienceLevel,
        skills: toList(f.skills).slice(0, 50),
      });
      return user;
    },
    onSuccess: (user) => {
      useAuthStore.getState().updateUser({ displayName: user.displayName });
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <Screen title="Profile" subtitle={me.data?.user.email}>
      {me.isLoading ? (
        <Skeleton height={260} />
      ) : me.isError ? (
        <ErrorState
          error={me.error}
          title="Couldn't load your profile"
          onRetry={() => void me.refetch()}
        />
      ) : (
        <VStack gap={14}>
          <VerifyEmailCard />
          <Card>
            <VStack gap={14}>
              <Text variant="h3">About you</Text>
              <ControlledTextField control={control} name="displayName" label="Full name" />
              <ControlledTextField
                control={control}
                name="targetRoles"
                label="Target roles"
                hint="Separate with commas, e.g. Backend Developer, Tech Lead"
              />
              <Controller
                control={control}
                name="experienceLevel"
                render={({ field }) => (
                  <Select
                    label="Experience level"
                    value={field.value}
                    options={EXPERIENCE_LEVELS.map((l) => ({
                      value: l,
                      label: titleCase(l),
                    }))}
                    onChange={(v) => v && field.onChange(v)}
                  />
                )}
              />
              <ControlledTextField
                control={control}
                name="skills"
                label="Skills"
                hint="Separate with commas. Used to tailor technical questions."
              />
              {save.isError ? (
                <Banner tone="danger" message={apiErrorMessage(save.error)} />
              ) : null}
              {save.isSuccess ? <Banner tone="success" message="Profile saved." /> : null}
              <Button
                label="Save profile"
                fullWidth={false}
                loading={save.isPending}
                onPress={handleSubmit((f) => save.mutate(f))}
              />
            </VStack>
          </Card>
          <Button
            label="Sign out"
            variant="secondary"
            fullWidth={false}
            onPress={() => void logout()}
          />
          {me.data?.user.role === "platform_admin" ? null : <DeleteAccountCard />}
          <LegalLinks />
        </VStack>
      )}
    </Screen>
  );
}
