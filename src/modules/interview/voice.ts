/**
 * The interviewer's voice, male (the default) or female as the candidate
 * chooses. The server speaks each line (ElevenLabs, or Gemini when that is
 * unavailable) and the device's own voice takes over if the server cannot. On
 * the web, SpeechRecognition also turns the spoken answer into text; native
 * answers are typed.
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

export interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onsoundstart: (() => void) | null;
}

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

function recognitionCtor(): (new () => RecognitionLike) | null {
  if (!isWeb) return null;
  const w = window as unknown as Record<string, unknown>;
  return ((w.SpeechRecognition || w.webkitSpeechRecognition) ?? null) as
    (new () => RecognitionLike) | null;
}

export const canSpeak = () => isWeb && "speechSynthesis" in window;

export type InterviewerVoice = "female" | "male";
const VOICE_KEY = "interviewer-voice";
const DEFAULT_VOICE: InterviewerVoice = "male";

/** The candidate's chosen interviewer voice; remembered on this device. */
// Native keeps the choice for the session; web also remembers it on the device.
let chosen: InterviewerVoice | null = null;

export function getVoicePreference(): InterviewerVoice {
  if (chosen) return chosen;
  try {
    const saved = isWeb ? window.localStorage.getItem(VOICE_KEY) : null;
    if (saved === "male" || saved === "female") return saved;
  } catch {
    // Storage blocked: the default applies.
  }
  return DEFAULT_VOICE;
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
  const want =
    voice === "male"
      ? /\b(male|david|mark|george|guy|daniel|ravi)\b/i
      : /\b(female|zira|samantha|aria|jenny|susan|heera|hazel)\b/i;
  const english = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith("en"));
  return english.find((v) => want.test(v.name)) ?? null;
}

// How long the server voice may take to start before the device voice reads the line.
const SERVER_VOICE_WAIT_MS = 2500;

// Bumped by every speak/stop, so audio that arrives late never plays.
let generation = 0;
let stopCurrent: (() => void) | null = null;

/** The device's own voice: the last resort on every platform. */
function speakWithDevice(
  text: string,
  voice: InterviewerVoice,
  done: () => void,
) {
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
  Speech.speak(text, {
    language: "en-US",
    onDone: done,
    onStopped: done,
    onError: done,
  });
}

/** The browser refused to play sound without a tap (autoplay policy). */
class AutoplayBlocked extends Error {}

async function playOnWeb(
  path: string,
  done: () => void,
  canStart: () => boolean,
) {
  const res = await apiClient.get<Blob>(path, { responseType: "blob" });
  // Arrived after the device voice already took over: stay silent.
  if (!canStart()) return;
  const url = URL.createObjectURL(res.data);
  const audio = new Audio(url);
  audio.onended = () => {
    URL.revokeObjectURL(url);
    done();
  };
  stopCurrent = () => audio.pause();
  try {
    await audio.play();
  } catch (err) {
    if ((err as { name?: string })?.name === "NotAllowedError")
      throw new AutoplayBlocked();
    throw err;
  }
}

/**
 * Native streams straight from the API with the session token. The player
 * reports nothing useful on a failed request, so "did not start playing in
 * time" is the failure signal.
 */
const NATIVE_START_TIMEOUT_MS = 20_000;
async function playOnNative(path: string, done: () => void) {
  const auth = useAuthStore.getState();
  const token = isTokenExpired(auth.token)
    ? await auth.refreshSession()
    : auth.token;
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
    const timer = setTimeout(
      () => reject(new Error("audio did not start")),
      NATIVE_START_TIMEOUT_MS,
    );
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

export interface SpeakOptions {
  /** The API route that returns the line as audio; without it the device voice reads it. */
  path?: string;
  /** Fires once when the line has finished (or could not be spoken), never if cut short. */
  onDone?: () => void;
  /**
   * The browser would not play sound without a tap. Nothing is said and
   * `onDone` does not fire: the caller shows one button that calls `speak`
   * again from the tap.
   */
  onBlocked?: () => void;
}

/**
 * Reads an interviewer line aloud. If the server voice fails for any reason -
 * no credits, offline - the device's own voice reads it instead: a question
 * must never go unheard because a voice service is down. The one exception is
 * the browser's autoplay rule, which blocks every voice alike and is reported
 * through `onBlocked`.
 *
 * The room opens the microphone from `onDone`, after the interviewer stops
 * talking, so the mic never transcribes the interviewer's own voice.
 */
export function speak(
  text: string,
  voice: InterviewerVoice,
  { path, onDone, onBlocked }: SpeakOptions = {},
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
  // Some browsers silently refuse to speak and never report an end. Roughly
  // the time the line would take to say, then carry on.
  const safety = setTimeout(done, Math.min(45_000, 4000 + text.length * 90));
  if (!path) return speakWithDevice(text, voice, done);
  // A slow server voice would keep the candidate waiting in silence: after a
  // short wait the device voice reads the line instead.
  let gaveUp = false;
  const waitTimer = setTimeout(() => {
    if (mine !== generation || finished) return;
    gaveUp = true;
    stopCurrent?.();
    speakWithDevice(text, voice, done);
  }, SERVER_VOICE_WAIT_MS);
  const canStart = () => mine === generation && !gaveUp;
  (isWeb ? playOnWeb(path, done, canStart) : playOnNative(path, done)).then(
    () => {
      clearTimeout(waitTimer);
      // Stopped, or replaced by the device voice, while loading: silence it.
      if (!canStart()) stopCurrent?.();
    },
    (err) => {
      clearTimeout(waitTimer);
      if (!canStart()) return;
      if (err instanceof AutoplayBlocked && onBlocked) {
        finished = true;
        clearTimeout(safety);
        return onBlocked();
      }
      speakWithDevice(text, voice, done);
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
 * One recogniser session's results, by result index. Chrome re-delivers
 * already-final segments (always on Android, and on desktop after its own
 * restart) with `resultIndex` 0, so a segment counts once per index: the same
 * words at the same index are the same event, the same words at a new index
 * are the candidate repeating themselves.
 */
export function mergeRecognition(
  committed: Map<number, string>,
  e: RecognitionResultEvent,
): { fresh: string[]; interim: string } {
  const fresh: string[] = [];
  let interim = "";
  for (let i = e.resultIndex; i < e.results.length; i++) {
    const text = e.results[i][0].transcript.trim();
    if (!e.results[i].isFinal) {
      if (text) interim = interim ? `${interim} ${text}` : text;
      continue;
    }
    if (!text || committed.get(i) === text) continue;
    committed.set(i, text);
    fresh.push(text);
  }
  return { fresh, interim };
}

// A stop() that never reports its end is given up on after this long.
const STOP_FLUSH_MS = 1500;

/**
 * Dictation. `onFinalText` receives each finished phrase once; `onActivity`
 * fires on every sound or result the recogniser reports, so the caller can
 * tell "still talking" from "has stopped". `interim` is the phrase being
 * recognised right now, replaced (never appended) as it changes.
 *
 * While listening is wanted the recogniser is restarted whenever the browser
 * ends it by itself (Chrome does after a stretch of silence), so a thinking
 * pause does not turn the microphone off. `stop()` resolves once the browser
 * has flushed its last result, so nothing said is lost. A refused permission
 * is not retried - it is reported as `problem` so the screen can say so.
 */
export function useSpeechRecognition(
  onFinalText: (text: string) => void,
  onActivity?: () => void,
) {
  const supported = recognitionCtor() !== null;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [problem, setProblem] = useState<MicProblem>(null);
  const rec = useRef<RecognitionLike | null>(null);
  const wanted = useRef(false);
  const sink = useRef({ onFinalText, onActivity });
  useEffect(() => {
    sink.current = { onFinalText, onActivity };
  });

  const stop = useCallback((): Promise<void> => {
    wanted.current = false;
    setListening(false);
    const r = rec.current;
    rec.current = null;
    if (!r) return Promise.resolve();
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(cap);
        setInterim("");
        resolve();
      };
      // Chrome delivers the final result for what was just said, then ends.
      const cap = setTimeout(finish, STOP_FLUSH_MS);
      r.onend = finish;
      try {
        r.stop();
      } catch {
        finish();
      }
    });
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || rec.current) return;
    wanted.current = true;
    const open = () => {
      // Stopped meanwhile, or another session already opened: never two at once.
      if (!wanted.current || rec.current) return;
      const r = new Ctor();
      const committed = new Map<number, string>();
      let pending = "";
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      // Speech and results count as activity; mere sound (a fan, traffic)
      // does not, or a noisy room would never reach the silence that sends.
      const heard = () => sink.current.onActivity?.();
      r.onaudiostart = () => setListening(true);
      r.onsoundstart = null;
      r.onspeechstart = heard;
      r.onresult = (e) => {
        heard();
        const { fresh, interim: now } = mergeRecognition(committed, e);
        pending = now;
        setInterim(now);
        for (const text of fresh) sink.current.onFinalText(text);
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
        if (rec.current === r) rec.current = null;
        // Words still interim when the browser ended are the candidate's too.
        if (pending) {
          sink.current.onFinalText(pending);
          pending = "";
          setInterim("");
        }
        if (wanted.current) return void setTimeout(open, 250);
        setListening(false);
      };
      rec.current = r;
      try {
        r.start();
        setProblem(null);
      } catch {
        rec.current = null;
        wanted.current = false;
        setListening(false);
      }
    };
    open();
  }, []);

  useEffect(() => () => void stop(), [stop]);

  return { supported, listening, interim, problem, start, stop };
}

export type MicOutcome = "granted" | "denied" | "none" | "unsupported";

/** Asks for the microphone once and releases it at once; says why if refused. */
export async function requestMicrophone(): Promise<MicOutcome> {
  if (!isWeb) return "granted";
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return name === "NotFoundError" || name === "DevicesNotFoundError"
      ? "none"
      : "denied";
  }
}

/**
 * Checks what this build actually uses. On native the answer is typed, so the
 * microphone and playback are not exercised and are reported as passing.
 */
export async function runDeviceCheck(
  ping: () => Promise<unknown>,
): Promise<DeviceCheckResult & { micOutcome: MicOutcome }> {
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
      micOutcome: "granted",
    };
  const micOutcome = await requestMicrophone();
  return {
    microphone: micOutcome === "granted",
    audioPlayback: canSpeak(),
    network,
    browserSupported: micOutcome !== "unsupported",
    micOutcome,
  };
}
