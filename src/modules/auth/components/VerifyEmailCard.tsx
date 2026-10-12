import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyCodeSchema } from "@modules/auth/auth.validation";
import {
  useVerifyEmail,
  useResendVerification,
} from "@modules/auth/hooks/useAuth";
import { apiErrorMessage } from "@api/apiClient";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { useAuthStore } from "@shared/store/useAuthStore";
import { Banner, Button, HStack, VStack } from "@shared/ui";

/** Shown until the account's email is verified; renders nothing afterwards. */
export function VerifyEmailCard() {
  const user = useAuthStore((s) => s.user);
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  if (!user || user.emailVerified) return null;

  return (
    <Banner
      tone="warning"
      title="Verify your email to start an interview"
      message={`We sent a 6-digit code to ${user.email}.`}
    >
      <VStack gap={10} style={{ marginTop: 10 }}>
        <ControlledTextField
          control={control}
          name="code"
          placeholder="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          accessibilityLabel="Verification code"
        />
        {verify.isError ? (
          <Banner tone="danger" message={apiErrorMessage(verify.error)} />
        ) : null}
        {resend.isSuccess ? (
          <Banner tone="success" message="A new code is on its way." />
        ) : null}
        <HStack gap={8}>
          <Button
            label="Verify"
            size="sm"
            fullWidth={false}
            loading={verify.isPending}
            onPress={handleSubmit((d) => verify.mutate(d.code))}
          />
          <Button
            label="Resend code"
            size="sm"
            variant="ghost"
            fullWidth={false}
            loading={resend.isPending}
            onPress={() => resend.mutate()}
          />
        </HStack>
      </VStack>
    </Banner>
  );
}
