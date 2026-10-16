import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { stopSpeaking, useSpeechRecognition } from "@modules/interview/voice";

/**
 * One candidate turn, as a state machine:
 *   waiting_for_candidate  mic off; a typed answer is sent by hand
 *   listening              mic on, words arriving, the silence clock running
 *   finalizing_transcript  silence reached: the recogniser flushes its last words
 *   evaluating_answer      the answer is with the server, exactly once
 *   interviewer_speaking   the reply is being read; the mic opens when it ends
 */
export type TurnState =
  | "waiting_for_candidate"
  | "listening"
  | "finalizing_transcript"
  | "evaluating_answer"
  | "interviewer_speaking";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";
const TICK_MS = 250;
// ponytail: fixed RMS threshold for "someone is talking"; a per-device
// calibration pass if quiet rooms or noisy ones prove to need one.
const VOICE_RMS = 0.02;
// Sound alone (no words recognised) can hold the clock open for at most this
// many silence windows, so a fan or traffic never leaves an answer unsent.
const SOUND_ONLY_WINDOWS = 2;

/**
 * Local voice activity: the microphone level, measured on the device, so the
 * silence clock follows the candidate's voice and not the speech service's
 * network lag. Web only; releases the microphone when `active` goes false.
 */
function useVoiceActivity(active: boolean, onVoice: () => void) {
  const sink = useRef(onVoice);
  useEffect(() => {
    sink.current = onVoice;
  });
  useEffect(() => {
    const Ctx = isWeb
      ? (window as unknown as { AudioContext?: typeof AudioContext })
          .AudioContext
      : undefined;
    if (!active || !Ctx || !navigator.mediaDevices?.getUserMedia) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        timer = setInterval(() => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) {
            const d = (v - 128) / 128;
            sum += d * d;
          }
          if (Math.sqrt(sum / buf.length) > VOICE_RMS) sink.current();
        }, 100);
      })
      // No level meter: the recogniser's own events keep the clock instead.
      .catch(() => undefined);
    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
      void ctx?.close().catch(() => undefined);
    };
  }, [active]);
}

interface Options {
  /** The round is live; everything stops when it is not. */
  live: boolean;
  /** Identifies the round, so a new round starts with a clean turn. */
  roundKey: string | null;
  silenceLimitMs: number;
  /** Sends the finished answer. Resolving means it was accepted. */
  send: (text: string, interrupted: boolean) => Promise<unknown>;
}

/**
 * Hands-free answering. Dictated words are appended once each; the answer is
 * sent once the candidate has been quiet for `silenceLimitMs`, after the
 * recogniser has flushed its last words, and only once per turn. Typing takes
 * over from dictation: a typed answer waits for Send.
 */
export function useVoiceTurn({
  live,
  roundKey,
  silenceLimitMs,
  send,
}: Options) {
  // State is stored with the round it belongs to and read back only for that
  // round: a new round (or the round ending) starts clean without a reset.
  const scope = `${roundKey ?? ""}:${live}`;
  const [stored, setStored] = useState({
    scope,
    state: "waiting_for_candidate" as TurnState,
    draft: "",
  });
  const state: TurnState =
    stored.scope === scope ? stored.state : "waiting_for_candidate";
  const draft = stored.scope === scope ? stored.draft : "";
  const stateRef = useRef<TurnState>("waiting_for_candidate");
  const go = useCallback(
    (next: TurnState) => {
      stateRef.current = next;
      setStored((s) => ({
        scope,
        state: next,
        draft: s.scope === scope ? s.draft : "",
      }));
    },
    [scope],
  );
  // Bumped whenever the turn is reset; async work compares against it before acting.
  const turn = useRef(0);

  const draftRef = useRef("");
  const setDraft = useCallback(
    (text: string) => {
      draftRef.current = text;
      setStored((s) => ({
        scope,
        state: s.scope === scope ? s.state : "waiting_for_candidate",
        draft: text,
      }));
    },
    [scope],
  );
  // True once this answer contains dictated words. Typing clears it, so an
  // answer being edited by hand is never sent out from under the candidate.
  const dictated = useRef(false);
  const lastWords = useRef(0);
  const lastVoice = useRef(0);
  const [silentMs, setSilentMs] = useState(0);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  const mic = useSpeechRecognition(
    (text) => {
      // Words flushed by stop() arrive while finalizing; they belong to this answer.
      const s = stateRef.current;
      if (s !== "listening" && s !== "finalizing_transcript") return;
      dictated.current = true;
      lastWords.current = Date.now();
      setDraft(draftRef.current ? `${draftRef.current} ${text}` : text);
    },
    () => {
      lastWords.current = Date.now();
    },
  );
  useVoiceActivity(live && state === "listening", () => {
    lastVoice.current = Date.now();
  });

  const startListening = useCallback(() => {
    if (!live || !mic.supported) return;
    stopSpeaking();
    const now = Date.now();
    lastWords.current = now;
    lastVoice.current = now;
    go("listening");
    mic.start();
  }, [live, mic, go]);

  /** The candidate wants to look at the answer first: nothing is sent by itself. */
  const stopListening = useCallback(() => {
    dictated.current = false;
    setSilentMs(0);
    void mic.stop();
    if (stateRef.current === "listening") go("waiting_for_candidate");
  }, [mic, go]);

  /**
   * Finishes the turn: flushes the recogniser, then sends what is in the box
   * exactly once. A second call while one is under way does nothing, and a
   * reset (new round, unmount) makes a pending one a no-op.
   */
  const submit = useCallback(
    async (interrupted = false) => {
      const from = stateRef.current;
      if (from !== "listening" && from !== "waiting_for_candidate") return;
      const mine = turn.current;
      dictated.current = false;
      setSilentMs(0);
      if (from === "listening") {
        go("finalizing_transcript");
        await mic.stop();
        if (mine !== turn.current) return;
      }
      const text = draftRef.current.trim();
      if (!text) return go("waiting_for_candidate");
      go("evaluating_answer");
      try {
        await sendRef.current(text, interrupted);
        if (mine !== turn.current) return;
        setDraft("");
        // The reply's audio moves the state on; until then the mic stays shut.
        go("interviewer_speaking");
      } catch {
        // The text is still in the box; the candidate can send it again.
        if (mine === turn.current) go("waiting_for_candidate");
      }
    },
    [mic, go, setDraft],
  );

  /** The interviewer's line is being read: no answer is taken meanwhile. */
  const interviewerSpeaking = useCallback(() => {
    void mic.stop();
    go("interviewer_speaking");
  }, [mic, go]);

  // A new round, or the round ending: pending async work sees a new turn
  // number and drops out, the working refs start clean, the mic is released.
  const { stop: stopMic } = mic;
  useEffect(() => {
    turn.current += 1;
    dictated.current = false;
    draftRef.current = "";
    stateRef.current = "waiting_for_candidate";
    void stopMic();
    return () => {
      turn.current += 1;
    };
  }, [scope, stopMic]);

  // The silence clock: runs only for a dictated answer while listening, and
  // restarts on the candidate's voice (locally measured) or on new words.
  useEffect(() => {
    if (!live) return;
    const tick = setInterval(() => {
      if (
        stateRef.current !== "listening" ||
        !dictated.current ||
        !draftRef.current.trim()
      )
        return setSilentMs(0);
      const soundCap = lastWords.current + SOUND_ONLY_WINDOWS * silenceLimitMs;
      const last = Math.max(
        lastWords.current,
        Math.min(lastVoice.current, soundCap),
      );
      const idle = Date.now() - last;
      setSilentMs(idle);
      if (idle >= silenceLimitMs) void submit();
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [live, silenceLimitMs, submit]);

  return {
    state,
    draft,
    draftRef,
    interim: mic.interim,
    silentMs,
    micSupported: mic.supported,
    micProblem: mic.problem,
    /** Typing takes over from dictation: nothing is sent until Send is pressed. */
    type: (text: string) => {
      dictated.current = false;
      setDraft(text);
    },
    startListening,
    stopListening,
    submit,
    interviewerSpeaking,
  };
}
