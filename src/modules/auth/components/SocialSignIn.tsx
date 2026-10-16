import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useQuery } from "@tanstack/react-query";
import { authApi, OAuthProvider } from "@modules/auth/api/authApi";
import { useOAuthExchange } from "@modules/auth/hooks/useAuth";
import { GoogleMark } from "@modules/auth/components/GoogleMark";
import { GitHubMark } from "@modules/auth/components/GitHubMark";
import { environment } from "@config/env";
import { apiErrorMessage } from "@api/apiClient";
import { authTheme } from "@modules/auth/authTheme";
import { Banner, HStack, Text, VStack } from "@shared/ui";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";
const APP_RETURN = "aiinterview://oauth";
const LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
};

const startUrl = (provider: OAuthProvider, client: "web" | "app") =>
  `${environment.apiUrl}/auth/oauth/${provider}/start?client=${client}`;

/** `oauth` (one-time code) or `oauth_error` from the address the API sent us back to. */
function readReturn(fragment: string) {
  const p = new URLSearchParams(fragment.replace(/^#/, ""));
  return { code: p.get("oauth"), error: p.get("oauth_error") };
}

/**
 * Web: back from the provider, the API put the one-time code (or the reason it
 * failed) in the fragment. Read once when the page loads and wiped from the
 * address bar at once, so it can be used at most once and is never bookmarked.
 */
let arrival: { code: string | null; error: string | null } | null = null;
if (isWeb && window.location.hash.includes("oauth")) {
  arrival = readReturn(window.location.hash);
  window.history.replaceState(null, "", window.location.pathname);
}

/**
 * "or continue with" + Google and GitHub, on the sign-in and sign-up screens.
 * The provider's own page signs the person in; the API then hands back a
 * one-time code that is traded here for a session. On the web that happens
 * by leaving for the provider and returning to /login; on a phone, in an
 * in-app browser tab that returns through the app's own link.
 */
/** True when the page has just come back from Google / GitHub with a sign-in to finish. */
export const hasPendingOAuthReturn = () => Boolean(arrival?.code);

interface Props {
  /** The returning sign-in could not be completed; the message says why. */
  onReturnFailed?: (message: string) => void;
}

export function SocialSignIn({ onReturnFailed }: Props = {}) {
  const providers = useQuery({
    queryKey: ["auth-providers"],
    queryFn: authApi.providers,
    staleTime: 5 * 60_000,
  });
  const exchange = useOAuthExchange();
  const [problem, setProblem] = useState<string | null>(arrival?.error ?? null);
  const [opening, setOpening] = useState<OAuthProvider | null>(null);

  // Finish a web sign-in that has just come back from the provider.
  useEffect(() => {
    const code = arrival?.code;
    arrival = null;
    if (code)
      exchange.mutate(code, {
        onError: (e) =>
          onReturnFailed?.(
            apiErrorMessage(
              e,
              "Sign-in could not be completed. Please try again.",
            ),
          ),
      });
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async (provider: OAuthProvider) => {
    setProblem(null);
    if (providers.data && !providers.data[provider])
      return setProblem(`${LABEL[provider]} sign-in isn't available yet.`);
    if (isWeb) return void window.location.assign(startUrl(provider, "web"));
    setOpening(provider);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        startUrl(provider, "app"),
        APP_RETURN,
      );
      if (result.type !== "success") return; // closed by the person
      const { code, error } = readReturn(result.url.split("#")[1] || "");
      if (error) setProblem(error);
      else if (code) exchange.mutate(code);
    } catch {
      setProblem(
        `${LABEL[provider]} sign-in could not open. Please try again.`,
      );
    } finally {
      setOpening(null);
    }
  };

  // Only providers this server actually has keys for are offered.
  const offered = (Object.keys(LABEL) as OAuthProvider[]).filter(
    (p) => providers.data?.[p],
  );
  // A message from a provider round trip is still shown even if the list has not loaded.
  if (!offered.length && !problem && !exchange.isError) return null;

  const busy = exchange.isPending;
  const line = <View style={styles.line} />;
  return (
    <VStack gap={14}>
      <HStack gap={12} align="center">
        {line}
        <Text variant="caption" style={styles.or}>
          OR CONTINUE WITH
        </Text>
        {line}
      </HStack>
      {problem || exchange.isError ? (
        <Banner
          tone="danger"
          message={problem ?? apiErrorMessage(exchange.error, "Sign-in failed")}
        />
      ) : null}
      <HStack gap={12}>
        {offered.map((p) => {
          const waiting = opening === p || (busy && opening === null);
          return (
            <Pressable
              key={p}
              onPress={() => void start(p)}
              disabled={busy || opening !== null}
              accessibilityRole="button"
              accessibilityLabel={`Continue with ${LABEL[p]}`}
              accessibilityState={{
                busy: waiting,
                disabled: busy || opening !== null,
              }}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              {waiting ? (
                <ActivityIndicator color={authTheme.blue} size="small" />
              ) : p === "google" ? (
                <GoogleMark size={20} />
              ) : (
                <GitHubMark size={20} />
              )}
              <Text variant="label" style={styles.label}>
                {LABEL[p]}
              </Text>
            </Pressable>
          );
        })}
      </HStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  line: { flex: 1, height: 1, backgroundColor: "rgba(47,91,255,0.25)" },
  or: { color: authTheme.muted, letterSpacing: 2.2 },
  // Equal-width buttons side by side, icon and provider name, as in the reference design.
  button: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "#DCE3F5",
    shadowColor: authTheme.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pressed: { backgroundColor: "#F3F6FF", transform: [{ scale: 0.98 }] },
  label: { color: authTheme.navy, fontSize: 15 },
});
