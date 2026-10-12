/**
 * Voice on the web. The interviewer speaks in an ElevenLabs voice (male or
 * female, the candidate's choice) when the server has a key, and in the
 * browser's own SpeechSynthesis voice otherwise. SpeechRecognition turns the
 * spoken answer into text.
 *
 * ponytail: browser speech only. Native builds fall back to typed answers and
 * silent questions; phase 3 replaces this with the OpenAI Realtime WebRTC
 * session the API already mints tokens for (POST .../realtime-session).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { DeviceCheckResult } from "@modules/interview/types";

interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

function recognitionCtor(): (new () => RecognitionLike) | null {
  if (!isWeb) return null;
  const w = window as unknown as Record<string, unknown>;
  return ((w.SpeechRecognition || w.webkitSpeechRecognition) ??
    null) as (new () => RecognitionLike) | null;
}

export const canSpeak = () => isWeb && "speechSynthesis" in window;

export type InterviewerVoice = "female" | "male";
const VOICE_KEY = "interviewer-voice";

/** The candidate's chosen interviewer voice; remembered on this device. */
export function getVoicePreference(): InterviewerVoice {
  try {
    if (isWeb && window.localStorage.getItem(VOICE_KEY) === "male") return "male";
  } catch {
    // Storage blocked: the default applies.
  }
  return "female";
}

export function setVoicePreference(voice: InterviewerVoice) {
  try {
    if (isWeb) window.localStorage.setItem(VOICE_KEY, voice);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}

/** The device's own voice of the wanted gender, when it names one. */
function deviceVoice(voice: InterviewerVoice) {
  const want = voice === "male" ? /\b(male|david|mark|george|guy|daniel|ravi)\b/i : /\b(female|zira|samantha|aria|jenny|susan|heera|hazel)\b/i;
  const english = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  return english.find((v) => want.test(v.name)) ?? null;
}

let playing: HTMLAudioElement | null = null;
// Bumped by every speak/stop, so audio that arrives late never plays.
let generation = 0;

function speakWithDevice(text: string, voice: InterviewerVoice) {
  if (!canSpeak()) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = deviceVoice(voice);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

/**
 * Reads an interviewer line aloud. With `fetchAudio` it plays the server's
 * studio voice and falls back to the device voice if that fails for any
 * reason (no credits left, offline, autoplay blocked) - a question must never
 * go unheard because a voice service is down.
 *
 * ponytail: web only. Native builds stay silent until an audio player
 * (expo-audio) is added.
 */
export function speak(text: string, voice: InterviewerVoice = "female", fetchAudio?: () => Promise<Blob>) {
  stopSpeaking();
  const mine = generation;
  if (!isWeb) return;
  if (!fetchAudio) return speakWithDevice(text, voice);
  fetchAudio()
    .then(async (blob) => {
      if (mine !== generation) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      playing = audio;
      await audio.play();
    })
    .catch(() => {
      if (mine === generation) speakWithDevice(text, voice);
    });
}

export function stopSpeaking() {
  generation++;
  if (playing) {
    playing.pause();
    playing = null;
  }
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Dictation into `onFinalText`, one finished phrase at a time. */
export function useSpeechRecognition(onFinalText: (text: string) => void) {
  const supported = recognitionCtor() !== null;
  const [listening, setListening] = useState(false);
  const rec = useRef<RecognitionLike | null>(null);
  const sink = useRef(onFinalText);
  useEffect(() => {
    sink.current = onFinalText;
  });

  const stop = useCallback(() => {
    rec.current?.stop();
    rec.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || rec.current) return;
    stopSpeaking();
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) sink.current(e.results[i][0].transcript.trim());
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
    };
    r.onerror = r.onend;
    rec.current = r;
    r.start();
    setListening(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, start, stop };
}

/**
 * Checks what this build actually uses. On native the answer is typed, so the
 * microphone and playback are not exercised and are reported as passing.
 */
export async function runDeviceCheck(
  ping: () => Promise<unknown>,
): Promise<DeviceCheckResult> {
  const network = await ping().then(
    () => true,
    () => false,
  );
  if (!isWeb)
    return {
      microphone: true,
      audioPlayback: true,
      network,
      browserSupported: true,
    };

  const browserSupported = Boolean(navigator.mediaDevices?.getUserMedia);
  let microphone = false;
  if (browserSupported) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      microphone = true;
    } catch {
      microphone = false;
    }
  }
  return { microphone, audioPlayback: canSpeak(), network, browserSupported };
}
