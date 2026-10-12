import React from "react";
import { Pressable } from "react-native";
import { Text, HStack } from "@shared/ui";

interface Props {
  prompt: string;
  label: string;
  onPress: () => void;
}

/** "New here? Create an account" - the line under every auth form. */
export function AuthFooterLink({ prompt, label, onPress }: Props) {
  return (
    <HStack justify="center" align="center" gap={5} style={{ marginTop: 8 }}>
      <Text variant="body-sm" tone="tertiary">
        {prompt}
      </Text>
      <Pressable onPress={onPress} hitSlop={6} accessibilityRole="link">
        <Text variant="label" tone="link">
          {label}
        </Text>
      </Pressable>
    </HStack>
  );
}
