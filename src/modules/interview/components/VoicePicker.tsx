import React from "react";
import { Platform } from "react-native";
import { InterviewerVoice } from "@modules/interview/voice";
import { ChipsRow, Text, VStack } from "@shared/ui";

const CHIPS = [
  { key: "female", label: "Female voice" },
  { key: "male", label: "Male voice" },
];

interface Props {
  value: InterviewerVoice;
  onChange: (voice: InterviewerVoice) => void;
}

/** Who reads the questions aloud. Hidden on native, where nothing is spoken yet. */
export function VoicePicker({ value, onChange }: Props) {
  if (Platform.OS !== "web") return null;
  return (
    <VStack gap={4}>
      <Text variant="label" tone="secondary">
        Interviewer voice
      </Text>
      <ChipsRow
        chips={CHIPS}
        active={value}
        onChange={(k) => onChange(k as InterviewerVoice)}
      />
    </VStack>
  );
}
