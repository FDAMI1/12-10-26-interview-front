import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@modules/auth/hooks/useAuth";
import { signupSchema } from "@modules/auth/auth.validation";
import { apiErrorMessage } from "@api/apiClient";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { VStack, Button, Banner } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { AuthFooterLink } from "@modules/auth/components/AuthFooterLink";

type Nav = { navigate: (s: string) => void };

export default function SignupScreen({ navigation }: { navigation: Nav }) {
  const mut = useRegister();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { displayName: "", email: "", password: "" },
  });
  const submit = handleSubmit((data) => mut.mutate(data));

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your first interview is free"
    >
      <VStack gap={16}>
        {mut.isError ? (
          <Banner tone="danger" message={apiErrorMessage(mut.error)} />
        ) : null}
        <ControlledTextField
          control={control}
          name="displayName"
          label="Full name"
          placeholder="Your name"
          autoCapitalize="words"
        />
        <ControlledTextField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ControlledTextField
          control={control}
          name="password"
          label="Password"
          placeholder="At least 10 characters"
          secureTextEntry
          onSubmitEditing={submit}
        />
        <Button
          label="Create account"
          onPress={submit}
          loading={mut.isPending}
          size="lg"
        />
        <AuthFooterLink
          prompt="Already have an account?"
          label="Sign in"
          onPress={() => navigation.navigate("Login")}
        />
      </VStack>
    </AuthLayout>
  );
}
