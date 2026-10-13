/**
 * The interviewer's voice, male or female as the candidate chooses. The
 * server speaks each line (ElevenLabs, or Gemini when that is unavailable)
 * and the device's own voice takes over if the server cannot. On the web,
 * SpeechRecognition also turns the spoken answer into text; native answers
 * are typed.
 *
 * ponytail: browser speech only. Native builds fall back to typed answers and
 * silent questions; phase 3 replaces this with the OpenAI Realtime WebRTC
 * session the API already mints tokens for (POST .../realtime-session).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { createAudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { apiClient } from "@api/apiClient";
import { environment } from "@config/env";
import { useAuthStore, isTokenExpired } from "@shared/store/useAuthStore";
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
// Native keeps the choice for the session; web also remembers it on the device.
let chosen: InterviewerVoice | null = null;

export function getVoicePreference(): InterviewerVoice {
  if (chosen) return chosen;
  try {
    if (isWeb && window.localStorage.getItem(VOICE_KEY) === "male") return "male";
  } catch {
    // Storage blocked: the default applies.
  }
  return "female";
}

export function setVoicePreference(voice: InterviewerVoice) {
  chosen = voice;
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

// Bumped by every speak/stop, so audio that arrives late never plays.
let generation = 0;
let stopCurrent: (() => void) | null = null;

/** The device's own voice: the last resort on every platform. */
function speakWithDevice(text: string, voice: InterviewerVoice) {
  if (isWeb) {
    if (!canSpeak()) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = deviceVoice(voice);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
    return;
  }
  // Android and iOS expose no reliable gender for their voices, so the
  // device fallback there is whichever voice the phone is set to.
  Speech.speak(text, { language: "en-US" });
}

async function playOnWeb(path: string) {
  const res = await apiClient.get<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  stopCurrent = () => audio.pause();
  await audio.play();
}

/**
 * Native streams straight from the API with the session token. The player
 * reports nothing useful on a failed request, so "did not start playing in
 * time" is the failure signal.
 */
const NATIVE_START_TIMEOUT_MS = 20_000;
async function playOnNative(path: string) {
  const auth = useAuthStore.getState();
  const token = isTokenExpired(auth.token) ? await auth.refreshSession() : auth.token;
  if (!token) throw new Error("no session");
  const player = createAudioPlayer({
    uri: environment.apiUrl + path,
    headers: { Authorization: `Bearer ${token}` },
  });
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    player.remove();
  };
  stopCurrent = release;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("audio did not start")), NATIVE_START_TIMEOUT_MS);
    player.addListener("playbackStatusUpdate", (status) => {
      if (status.playing) {
        clearTimeout(timer);
        resolve();
      }
      if (status.didJustFinish) release();
    });
    player.play();
  }).catch((err) => {
    release();
    throw err;
  });
}

/**
 * Reads an interviewer line aloud. `path` is the API route that returns the
 * line as audio (ElevenLabs, or Gemini when that is unavailable - the server
 * decides). If the request fails for any reason - no credits, offline,
 * autoplay blocked - the device's own voice reads it instead: a question must
 * never go unheard because a voice service is down.
 */
export function speak(text: string, voice: InterviewerVoice = "female", path?: string) {
  stopSpeaking();
  const mine = generation;
  if (!path) return speakWithDevice(text, voice);
  (isWeb ? playOnWeb(path) : playOnNative(path)).then(
    () => {
      // Stopped while loading: silence what has just started.
      if (mine !== generation) stopCurrent?.();
    },
    () => {
      if (mine === generation) speakWithDevice(text, voice);
    },
  );
}

export function stopSpeaking() {
  generation++;
  stopCurrent?.();
  stopCurrent = null;
  if (isWeb) {
    if (canSpeak()) window.speechSynthesis.cancel();
  } else void Speech.stop();
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
