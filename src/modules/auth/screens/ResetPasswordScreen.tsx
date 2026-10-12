import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPassword } from "@modules/auth/hooks/useAuth";
import { resetPasswordSchema } from "@modules/auth/auth.validation";
import { apiErrorMessage } from "@api/apiClient";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { VStack, Button, Banner } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { AuthFooterLink } from "@modules/auth/components/AuthFooterLink";

interface Props {
  navigation: { navigate: (s: string) => void };
  route: { params?: { email?: string } };
}

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const mut = useResetPassword();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: route.params?.email ?? "", code: "", password: "" },
  });
  const submit = handleSubmit((data) => mut.mutate(data));

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter the code from your email"
    >
      <VStack gap={16}>
        {mut.isError ? (
          <Banner tone="danger" message={apiErrorMessage(mut.error)} />
        ) : null}
        {mut.isSuccess ? (
          <Banner
            tone="success"
            message="Password updated. Sign in with your new password."
          />
        ) : null}
        <ControlledTextField
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ControlledTextField
          control={control}
          name="code"
          label="Reset code"
          placeholder="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
        />
        <ControlledTextField
          control={control}
          name="password"
          label="New password"
          placeholder="At least 10 characters"
          secureTextEntry
          onSubmitEditing={submit}
        />
        <Button
          label="Update password"
          onPress={submit}
          loading={mut.isPending}
          size="lg"
        />
        <AuthFooterLink
          prompt="Done?"
          label="Back to sign in"
          onPress={() => navigation.navigate("Login")}
        />
      </VStack>
    </AuthLayout>
  );
}
