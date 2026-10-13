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
  onerror: ((e: { error?: string }) => void) | null;
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
function speakWithDevice(text: string, voice: InterviewerVoice, done: () => void) {
  if (isWeb) {
    if (!canSpeak()) return done();
    const u = new SpeechSynthesisUtterance(text);
    const v = deviceVoice(voice);
    if (v) u.voice = v;
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
    return;
  }
  // Android and iOS expose no reliable gender for their voices, so the
  // device fallback there is whichever voice the phone is set to.
  Speech.speak(text, { language: "en-US", onDone: done, onStopped: done, onError: done });
}

async function playOnWeb(path: string, done: () => void) {
  const res = await apiClient.get<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const audio = new Audio(url);
  audio.onended = () => {
    URL.revokeObjectURL(url);
    done();
  };
  stopCurrent = () => audio.pause();
  await audio.play();
}

/**
 * Native streams straight from the API with the session token. The player
 * reports nothing useful on a failed request, so "did not start playing in
 * time" is the failure signal.
 */
const NATIVE_START_TIMEOUT_MS = 20_000;
async function playOnNative(path: string, done: () => void) {
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
      if (status.didJustFinish) {
        release();
        done();
      }
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
 *
 * `onDone` fires once when the line has finished (or could not be spoken at
 * all), and never if it was cut short by `stopSpeaking`. The room uses it to
 * open the microphone only after the interviewer stops talking, so the mic
 * does not transcribe the interviewer's own voice from the speakers.
 */
export function speak(
  text: string,
  voice: InterviewerVoice = "female",
  path?: string,
  onDone?: () => void,
) {
  stopSpeaking();
  const mine = generation;
  let finished = false;
  const done = () => {
    if (finished || mine !== generation) return;
    finished = true;
    clearTimeout(safety);
    onDone?.();
  };
  // Some browsers silently refuse to speak (autoplay rules) and never report
  // an end. Roughly the time the line would take to say, then carry on.
  const safety = setTimeout(done, Math.min(45_000, 4000 + text.length * 90));
  if (!path) return speakWithDevice(text, voice, done);
  (isWeb ? playOnWeb(path, done) : playOnNative(path, done)).then(
    () => {
      // Stopped while loading: silence what has just started.
      if (mine !== generation) stopCurrent?.();
    },
    () => {
      if (mine === generation) speakWithDevice(text, voice, done);
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

export type MicProblem = "blocked" | "unavailable" | null;

/**
 * Dictation. `onFinalText` receives each finished phrase; `onActivity` fires
 * on every sound the recogniser hears, finished or not, so the caller can
 * tell "still talking" from "has stopped".
 *
 * While listening is wanted the recogniser is restarted whenever the browser
 * ends it by itself (Chrome does after a stretch of silence), so a thinking
 * pause does not turn the microphone off. A refused permission is not
 * retried - it is reported as `problem` so the screen can say so.
 */
export function useSpeechRecognition(
  onFinalText: (text: string) => void,
  onActivity?: () => void,
) {
  const supported = recognitionCtor() !== null;
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<MicProblem>(null);
  const rec = useRef<RecognitionLike | null>(null);
  const wanted = useRef(false);
  const sink = useRef({ onFinalText, onActivity });
  useEffect(() => {
    sink.current = { onFinalText, onActivity };
  });

  const stop = useCallback(() => {
    wanted.current = false;
    const r = rec.current;
    rec.current = null;
    if (r) {
      r.onend = null;
      r.stop();
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || rec.current) return;
    wanted.current = true;
    const open = () => {
      if (!wanted.current) return;
      const r = new Ctor();
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      r.onresult = (e) => {
        sink.current.onActivity?.();
        for (let i = e.resultIndex; i < e.results.length; i++)
          if (e.results[i].isFinal) {
            const text = e.results[i][0].transcript.trim();
            if (text) sink.current.onFinalText(text);
          }
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          wanted.current = false;
          setProblem("blocked");
        } else if (e.error === "audio-capture") {
          wanted.current = false;
          setProblem("unavailable");
        }
        // "no-speech", "aborted" and "network" end the session; onend decides whether to reopen.
      };
      r.onend = () => {
        rec.current = null;
        if (wanted.current) return void setTimeout(open, 250);
        setListening(false);
      };
      rec.current = r;
      try {
        r.start();
        setProblem(null);
        setListening(true);
      } catch {
        rec.current = null;
        wanted.current = false;
        setListening(false);
      }
    };
    open();
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, listening, problem, start, stop };
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
