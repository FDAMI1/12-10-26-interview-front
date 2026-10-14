import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import {
  environment,
  normalizeApiUrl,
  serverChangeAllowed,
  setServerOverride,
} from "@config/env";
import { useAuthStore } from "@shared/store/useAuthStore";
import { palette, radius, shadows } from "@shared/designSystem";
import { Text, VStack, HStack, Button, Banner, TextField } from "@shared/ui";

const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/api\/v1$/, "");

/**
 * Which API the phone app talks to. Shown on the sign-in screen of phone
 * builds only. Saving signs the user out: a session belongs to one server.
 */
export function ServerAddress() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(environment.apiUrl);
  const [state, setState] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  if (!serverChangeAllowed) return null;

  const check = async (url: string) => {
    const res = await fetch(url.replace(/\/api\/v1$/, "") + "/health", {
      signal: AbortSignal.timeout(60_000),
    });
    const body = (await res.json().catch(() => null)) as { success?: boolean } | null;
    return res.ok && !!body?.success;
  };

  const test = async () => {
    const url = normalizeApiUrl(value);
    if (!url) return setState({ tone: "danger", text: "Enter an address starting with https:// or http://" });
    setChecking(true);
    setState(null);
    try {
      setState(
        (await check(url))
          ? { tone: "success", text: "Connected. This server is reachable." }
          : { tone: "danger", text: "That address answered, but it is not this app's server." },
      );
    } catch {
      setState({ tone: "danger", text: "Could not reach that address. Check it and your internet connection." });
    } finally {
      setChecking(false);
    }
  };

  const save = async (url: string | null) => {
    await setServerOverride(url);
    await useAuthStore.getState().logout();
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} accessibilityRole="button">
        <Text variant="caption" tone="tertiary" align="center">
          Server: {host(environment.apiUrl)} · Change
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "center", padding: 20 }}>
          <View
            style={{
              backgroundColor: palette.surface.primary,
              borderRadius: radius.xl,
              padding: 20,
              maxWidth: 480,
              width: "100%",
              alignSelf: "center",
              ...shadows.lg,
            }}
          >
            <VStack gap={12}>
              <Text variant="h3">Server address</Text>
              <Text variant="body-sm" tone="secondary">
                The API this app connects to. Only change it if you were given a
                different address.
              </Text>
              <TextField
                value={value}
                onChangeText={(t) => {
                  setValue(t);
                  setState(null);
                }}
                placeholder="https://your-api.onrender.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {state ? <Banner tone={state.tone} message={state.text} /> : null}
              <HStack gap={8} wrap>
                <Button label="Test" variant="secondary" fullWidth={false} loading={checking} onPress={() => void test()} />
                <Button
                  label="Save"
                  fullWidth={false}
                  disabled={!normalizeApiUrl(value)}
                  onPress={() => void save(normalizeApiUrl(value))}
                />
                <Button label="Cancel" variant="ghost" fullWidth={false} onPress={() => setOpen(false)} />
              </HStack>
              <Button
                label={`Use the built-in address (${host(environment.builtApiUrl)})`}
                variant="ghost"
                size="sm"
                onPress={() => void save(null)}
              />
            </VStack>
          </View>
        </View>
      </Modal>
    </>
  );
}
