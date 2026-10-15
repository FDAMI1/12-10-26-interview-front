import React, { useState } from "react";
import { Platform, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@modules/auth/api/authApi";
import { useGoogleSignIn } from "@modules/auth/hooks/useAuth";
import { GoogleSignInButton } from "@modules/auth/components/GoogleSignInButton";
import { apiErrorMessage } from "@api/apiClient";
import { palette } from "@shared/designSystem";
import { Banner, HStack, Text, VStack } from "@shared/ui";

/**
 * "or" + Continue with Google, for the sign-in and sign-up screens. Shown only
 * when the API has Google client ids configured (and, on a phone, an Android
 * or iOS one), so an unconfigured server shows the plain form as before.
 */
export function ContinueWithGoogle() {
  const providers = useQuery({
    queryKey: ["auth-providers"],
    queryFn: authApi.providers,
    staleTime: 5 * 60_000,
  });
  const signIn = useGoogleSignIn();
  const [problem, setProblem] = useState<string | null>(null);

  const google = providers.data?.google;
  const nativeReady =
    Platform.OS === "web" ||
    Boolean(
      Platform.OS === "ios" ? google?.iosClientId : google?.androidClientId,
    );
  if (!google?.webClientId || !nativeReady) return null;

  const line = (
    <View
      style={{ flex: 1, height: 1, backgroundColor: palette.border.subtle }}
    />
  );
  return (
    <VStack gap={12}>
      <HStack gap={10} align="center">
        {line}
        <Text variant="caption" tone="tertiary">
          or
        </Text>
        {line}
      </HStack>
      {problem || signIn.isError ? (
        <Banner
          tone="danger"
          message={
            problem ?? apiErrorMessage(signIn.error, "Google sign-in failed")
          }
        />
      ) : null}
      <GoogleSignInButton
        webClientId={google.webClientId}
        busy={signIn.isPending}
        onIdToken={(idToken) => {
          setProblem(null);
          signIn.mutate(idToken);
        }}
        onError={setProblem}
      />
    </VStack>
  );
}
