import React, { useEffect, useRef } from "react";
import { TextInput, StyleSheet, View } from "react-native";
import { Mic, MicOff } from "lucide-react-native";
import { useSpeechRecognition } from "@modules/interview/voice";
import { palette, radius } from "@shared/designSystem";
import { Card, Text, VStack, HStack, Button, Banner } from "@shared/ui";

export const INTRODUCTION_MAX = 3000;

interface Props {
  value: string;
  onChange: (text: string) => void;
}

/**
 * "Tell us about yourself": typed, dictated, or both. Each finished spoken
 * phrase is appended once, after what is already there; the phrase still
 * being recognised shows below the box and never enters it until final.
 */
export function IntroductionField({ value, onChange }: Props) {
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const mic = useSpeechRecognition((text) => {
    const cur = valueRef.current.trimEnd();
    const next = (cur ? `${cur} ${text}` : text).slice(0, INTRODUCTION_MAX);
    valueRef.current = next;
    onChange(next);
  });

  return (
    <Card>
      <VStack gap={10}>
        <Text variant="h3">Tell Us About Yourself</Text>
        <Text variant="body-sm" tone="secondary">
          Introduce yourself and describe your professional background. Include
          your current or target role, total experience, technologies you know,
          previous responsibilities, projects you have completed, and your
          career goals.
        </Text>
        <View style={[styles.wrap, mic.listening && styles.wrapListening]}>
          <TextInput
            value={value}
            onChangeText={(t) => onChange(t.slice(0, INTRODUCTION_MAX))}
            multiline
            maxLength={INTRODUCTION_MAX}
            placeholder="Tell us about yourself, your role, total experience, responsibilities, technical skills, and projects..."
            placeholderTextColor={palette.text.tertiary}
            accessibilityLabel="Tell us about yourself"
            style={styles.input}
          />
          {mic.supported ? (
            <Button
              label={mic.listening ? "Stop" : "Speak"}
              variant={mic.listening ? "primary" : "secondary"}
              size="sm"
              fullWidth={false}
              icon={
                mic.listening ? (
                  <MicOff size={16} color="#FFFFFF" />
                ) : (
                  <Mic size={16} color={palette.text.primary} />
                )
              }
              onPress={() => (mic.listening ? void mic.stop() : mic.start())}
            />
          ) : null}
        </View>
        {mic.interim ? (
          <Text variant="body-sm" tone="tertiary">
            {mic.interim}…
          </Text>
        ) : null}
        <HStack justify="space-between" align="center" gap={8}>
          <Text variant="caption" tone="tertiary">
            {mic.listening
              ? "Listening. Speak naturally; press Stop when you have finished. You can edit the text."
              : mic.supported
                ? "Type, or press Speak and talk. You can edit what was recognised."
                : "Type your introduction."}
          </Text>
          <Text variant="caption" tone="tertiary">
            {value.length}/{INTRODUCTION_MAX}
          </Text>
        </HStack>
        {mic.problem ? (
          <Banner
            tone="warning"
            title={
              mic.problem === "blocked"
                ? "Microphone access is blocked"
                : "No microphone was found"
            }
            message={
              mic.problem === "blocked"
                ? "Allow the microphone for this site in your browser's address bar, then press Speak again. You can also type your introduction."
                : "Connect a microphone and press Speak again, or type your introduction."
            }
          />
        ) : null}
      </VStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: palette.border.strong,
    borderRadius: radius.md,
    padding: 10,
    gap: 8,
    alignItems: "flex-end",
  },
  wrapListening: { borderColor: palette.border.focus },
  input: {
    alignSelf: "stretch",
    minHeight: 140,
    maxHeight: 320,
    fontSize: 14,
    lineHeight: 20,
    color: palette.text.primary,
    textAlignVertical: "top",
  },
});
