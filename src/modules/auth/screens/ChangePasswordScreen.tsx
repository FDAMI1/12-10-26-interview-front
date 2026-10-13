import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@modules/auth/api/authApi";
import { AuthLayout } from "@modules/auth/components/AuthLayout";
import { apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
import { VStack, Button, Banner, TextField } from "@shared/ui";

/**
 * Shown instead of the app while the account still has the temporary password
 * an admin issued. The server refuses everything else until it is changed.
 */
export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const change = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: (user) => useAuthStore.getState().updateUser(user),
  });
  const tooShort = next.length > 0 && next.length < 10;

  return (
    <AuthLayout
      title="Choose your password"
      subtitle="You signed in with a temporary password. Set your own to continue."
    >
      <VStack gap={16}>
        {change.isError ? (
          <Banner tone="danger" message={apiErrorMessage(change.error)} />
        ) : null}
        <TextField
          label="Temporary password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          autoCapitalize="none"
          placeholder="The password you were given"
        />
        <TextField
          label="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 10 characters"
          error={tooShort ? "At least 10 characters" : undefined}
        />
        <Button
          label="Save and continue"
          size="lg"
          disabled={!current || next.length < 10}
          loading={change.isPending}
          onPress={() => change.mutate()}
        />
        <Button
          label="Sign out"
          variant="ghost"
          onPress={() => void useAuthStore.getState().logout()}
        />
      </VStack>
    </AuthLayout>
  );
}
