import React from "react";
import { Pressable } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react-native";
import { useLogin } from "@modules/auth/hooks/useAuth";
import { loginSchema } from "@modules/auth/auth.validation";
import { apiErrorMessage } from "@api/apiClient";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { palette } from "@shared/designSystem";
import { Text, VStack, Button, Banner } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { AuthFooterLink } from "@modules/auth/components/AuthFooterLink";
import { ContinueWithGoogle } from "@modules/auth/components/ContinueWithGoogle";

type Nav = { navigate: (s: string) => void };

export default function LoginScreen({ navigation }: { navigation: Nav }) {
  const mut = useLogin();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const submit = handleSubmit((data) => mut.mutate(data));

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue practising">
      <VStack gap={16}>
        {mut.isError ? (
          <Banner
            tone="danger"
            message={apiErrorMessage(mut.error, "Invalid email or password")}
          />
        ) : null}
        <ControlledTextField
          control={control}
          name="email"
          label="Email"
          leading={<Mail size={18} color={palette.text.tertiary} />}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onSubmitEditing={submit}
        />
        <ControlledTextField
          control={control}
          name="password"
          label="Password"
          leading={<Lock size={18} color={palette.text.tertiary} />}
          placeholder="Your password"
          secureTextEntry
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          hitSlop={6}
          accessibilityRole="link"
        >
          <Text variant="label" tone="link" align="right">
            Forgot password?
          </Text>
        </Pressable>
        <Button
          label="Sign in"
          onPress={submit}
          loading={mut.isPending}
          size="lg"
        />
        <ContinueWithGoogle />
        <AuthFooterLink
          prompt="New here?"
          label="Create an account"
          onPress={() => navigation.navigate("Signup")}
        />
      </VStack>
    </AuthLayout>
  );
}
