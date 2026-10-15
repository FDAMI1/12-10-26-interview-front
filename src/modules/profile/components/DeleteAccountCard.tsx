import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@modules/profile/api/profileApi";
import { apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
import {
  Card,
  Text,
  VStack,
  Button,
  Banner,
  TextField,
  ConfirmDialog,
} from "@shared/ui";

/**
 * Permanent account deletion, confirmed with the password and a second
 * prompt. Required by Google Play for any app that lets people sign up.
 */
export function DeleteAccountCard() {
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  // A Google-only account has no password: it confirms by typing its email.
  const hasPassword = useAuthStore((s) => s.user?.hasPassword !== false);
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () =>
      profileApi.deleteAccount(
        hasPassword ? { password } : { confirmEmail: password },
      ),
    onSettled: () => setConfirming(false),
    onSuccess: async () => {
      qc.clear();
      await useAuthStore.getState().logout();
    },
  });

  return (
    <Card>
      <VStack gap={12}>
        <Text variant="h3">Delete account</Text>
        <Text variant="body-sm" tone="secondary">
          This permanently deletes your profile, every interview you have
          taken with its transcript and scores, and your workspace
          memberships. It cannot be undone.
        </Text>
        <TextField
          label={hasPassword ? "Your password" : "Your email address"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={hasPassword}
          keyboardType={hasPassword ? "default" : "email-address"}
          placeholder={
            hasPassword
              ? "Enter your password to confirm"
              : "Type your email to confirm"
          }
          autoCapitalize="none"
        />
        {remove.isError ? (
          <Banner tone="danger" message={apiErrorMessage(remove.error)} />
        ) : null}
        <Button
          label="Delete my account"
          variant="destructive"
          fullWidth={false}
          disabled={!password}
          onPress={() => setConfirming(true)}
        />
      </VStack>
      <ConfirmDialog
        visible={confirming}
        title="Delete your account?"
        message="Your interviews, transcripts and scores will be deleted for good."
        confirmLabel="Delete account"
        cancelLabel="Keep my account"
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => remove.mutate()}
      />
    </Card>
  );
}
