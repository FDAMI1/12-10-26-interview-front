import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@modules/auth/hooks/useAuth";
import { forgotPasswordSchema } from "@modules/auth/auth.validation";
import { apiErrorMessage } from "@api/apiClient";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { VStack, Button, Banner } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { AuthFooterLink } from "@modules/auth/components/AuthFooterLink";

type Nav = { navigate: (s: string, p?: object) => void };

export default function ForgotPasswordScreen({
  navigation,
}: {
  navigation: Nav;
}) {
  const mut = useForgotPassword();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });
  const submit = handleSubmit((data) =>
    mut.mutate(data, {
      onSuccess: () =>
        navigation.navigate("ResetPassword", { email: data.email.trim() }),
    }),
  );

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a 6-digit code"
    >
      <VStack gap={16}>
        {mut.isError ? (
          <Banner tone="danger" message={apiErrorMessage(mut.error)} />
        ) : null}
        <ControlledTextField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onSubmitEditing={submit}
        />
        <Button
          label="Send code"
          onPress={submit}
          loading={mut.isPending}
          size="lg"
        />
        <AuthFooterLink
          prompt="Remembered it?"
          label="Sign in"
          onPress={() => navigation.navigate("Login")}
        />
      </VStack>
    </AuthLayout>
  );
}
