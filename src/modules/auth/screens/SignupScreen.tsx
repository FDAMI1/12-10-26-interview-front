import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, ShieldCheck, User } from "lucide-react-native";
import { useRegister } from "@modules/auth/hooks/useAuth";
import { signupSchema } from "@modules/auth/auth.validation";
import { apiErrorMessage } from "@api/apiClient";
import { setRememberMe } from "@shared/store/useAuthStore";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { VStack, Banner } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { AuthButton } from "@modules/auth/components/AuthButton";
import { AuthFooterLink } from "@modules/auth/components/AuthFooterLink";
import { SocialSignIn } from "@modules/auth/components/SocialSignIn";
import { authTheme as t } from "@modules/auth/authTheme";

type Nav = { navigate: (s: string) => void };

/** Registering signs the candidate in at once; the email check then happens in the app. */
export default function SignupScreen({ navigation }: { navigation: Nav }) {
  const mut = useRegister();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const submit = handleSubmit(({ confirmPassword: _confirm, ...data }) => {
    if (mut.isPending) return;
    setRememberMe(true);
    mut.mutate(data);
  });

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
          appearance="soft"
          accessibilityLabel="Full name"
          leading={<User size={19} color={t.muted} />}
          placeholder="Full name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        <ControlledTextField
          control={control}
          name="email"
          appearance="soft"
          accessibilityLabel="Email"
          leading={<Mail size={19} color={t.muted} />}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <ControlledTextField
          control={control}
          name="password"
          appearance="soft"
          accessibilityLabel="Password"
          leading={<Lock size={19} color={t.muted} />}
          placeholder="Password (at least 10 characters)"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <ControlledTextField
          control={control}
          name="confirmPassword"
          appearance="soft"
          accessibilityLabel="Confirm password"
          leading={<ShieldCheck size={19} color={t.muted} />}
          placeholder="Confirm password"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
        <AuthButton
          label="Create account"
          onPress={submit}
          loading={mut.isPending}
        />
        <SocialSignIn />
        <AuthFooterLink
          prompt="Already have an account?"
          label="Sign in"
          onPress={() => navigation.navigate("Login")}
        />
      </VStack>
    </AuthLayout>
  );
}
