import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Lock, Mail } from "lucide-react-native";
import { useLogin } from "@modules/auth/hooks/useAuth";
import { loginSchema } from "@modules/auth/auth.validation";
import { apiErrorMessage } from "@api/apiClient";
import { setRememberMe } from "@shared/store/useAuthStore";
import { ControlledTextField } from "@shared/form/ControlledTextField";
import { Text, VStack, HStack, Banner } from "@shared/ui";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { AuthButton } from "@modules/auth/components/AuthButton";
import { AuthFooterLink } from "@modules/auth/components/AuthFooterLink";
import { SocialSignIn } from "@modules/auth/components/SocialSignIn";
import { authTheme as t } from "@modules/auth/authTheme";

type Nav = { navigate: (s: string) => void };

export default function LoginScreen({ navigation }: { navigation: Nav }) {
  const mut = useLogin();
  const [remember, setRemember] = useState(true);
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const submit = handleSubmit((data) => {
    if (mut.isPending) return;
    setRememberMe(remember);
    mut.mutate(data);
  });
  const toggleRemember = () =>
    setRemember((r) => {
      // Also applies to Google / GitHub sign-in from this screen.
      setRememberMe(!r);
      return !r;
    });

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue">
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
          appearance="soft"
          accessibilityLabel="Email"
          leading={<Mail size={19} color={t.muted} />}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          onSubmitEditing={submit}
        />
        <ControlledTextField
          control={control}
          name="password"
          appearance="soft"
          accessibilityLabel="Password"
          leading={<Lock size={19} color={t.muted} />}
          placeholder="Password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        <HStack justify="space-between" align="center">
          <Pressable
            onPress={toggleRemember}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: remember }}
            accessibilityLabel="Remember me"
            style={styles.remember}
          >
            <View style={[styles.box, remember && styles.boxOn]}>
              {remember ? (
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              ) : null}
            </View>
            <Text variant="body-sm" style={{ color: t.navy }}>
              Remember me
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            hitSlop={8}
            accessibilityRole="link"
          >
            <Text variant="label" style={{ color: t.link }}>
              Forgot password?
            </Text>
          </Pressable>
        </HStack>
        <AuthButton label="Login" onPress={submit} loading={mut.isPending} />
        <SocialSignIn />
        <AuthFooterLink
          prompt="New here?"
          label="Create an account"
          onPress={() => navigation.navigate("Signup")}
        />
      </VStack>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  remember: { flexDirection: "row", alignItems: "center", gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(47,91,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: t.blue, borderColor: t.blue },
});
