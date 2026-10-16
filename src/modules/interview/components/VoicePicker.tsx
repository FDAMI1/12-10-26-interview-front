import React from "react";
import { interviewApi } from "@modules/interview/api/interviewApi";
import { InterviewerVoice, speak } from "@modules/interview/voice";
import { ChipsRow, Text, VStack } from "@shared/ui";

// Male first: it is the voice every interview starts with unless changed.
const CHIPS = [
  { key: "male", label: "Male voice" },
  { key: "female", label: "Female voice" },
];

interface Props {
  value: InterviewerVoice;
  onChange: (voice: InterviewerVoice) => void;
  /** The server can speak (see Interview.voiceEnabled); otherwise the device voice samples. */
  sampleFromServer: boolean;
}

const SAMPLE =
  "Hello, I will be your interviewer today. Take your time with each answer.";

/** Who reads the questions aloud. Choosing a voice plays a short sample of it. */
export function VoicePicker({ value, onChange, sampleFromServer }: Props) {
  return (
    <VStack gap={4}>
      <Text variant="label" tone="secondary">
        Interviewer voice
      </Text>
      <ChipsRow
        chips={CHIPS}
        active={value}
        onChange={(k) => {
          const voice = k as InterviewerVoice;
          onChange(voice);
          // Let them hear what they picked.
          speak(SAMPLE, voice, {
            path: sampleFromServer
              ? interviewApi.voiceSamplePath(voice)
              : undefined,
          });
        }}
      />
    </VStack>
  );
}
