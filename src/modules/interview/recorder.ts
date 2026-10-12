/**
 * Round audio recording - web only.
 *
 * The browser records the candidate's microphone for the length of a round and
 * uploads it straight to private storage with a one-destination ticket from
 * the API; the audio never passes through our server.
 *
 * ponytail: native (Android/iOS) records nothing yet - `recordingSupported`
 * is false there and the UI says so. Add expo-audio capture when the mobile
 * build needs recordings.
 * ponytail: one continuous take per round. A page reload mid-round starts a
 * new take and the earlier part is lost; chunked upload if that matters.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { interviewApi } from "@modules/interview/api/interviewApi";

type Recorder = {
  state: string;
  mimeType: string;
  start: (timesliceMs?: number) => void;
  stop: () => void;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
};
type RecorderCtor = new (stream: MediaStream, opts?: { audioBitsPerSecond?: number }) => Recorder;

const recorderCtor = (): RecorderCtor | undefined =>
  Platform.OS === "web"
    ? (globalThis as unknown as { MediaRecorder?: RecorderCtor }).MediaRecorder
    : undefined;

export const recordingSupported = (): boolean =>
  !!recorderCtor() && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

export type RecordingState = "off" | "recording" | "blocked";

/**
 * Records while `active` is true. `stop()` ends the take and resolves with the
 * audio (null when nothing was captured). A change of `key` starts a new take.
 */
export function useRoundRecorder(active: boolean, key: string | null) {
  const [state, setState] = useState<RecordingState>("off");
  const session = useRef<{ recorder: Recorder; stream: MediaStream; chunks: Blob[] } | null>(null);

  const stop = useCallback((): Promise<Blob | null> => {
    const s = session.current;
    session.current = null;
    setState("off");
    if (!s) return Promise.resolve(null);
    return new Promise((resolve) => {
      const finish = () => {
        s.stream.getTracks().forEach((t) => t.stop());
        resolve(
          s.chunks.length
            ? new Blob(s.chunks, { type: s.recorder.mimeType || "audio/webm" })
            : null,
        );
      };
      if (s.recorder.state === "inactive") return finish();
      s.recorder.onstop = finish;
      s.recorder.stop();
    });
  }, []);

  useEffect(() => {
    const Ctor = recorderCtor();
    if (!active || !key || !Ctor || !recordingSupported()) return;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        // 32 kbps mono speech: about 2.4 MB for a ten-minute round.
        const recorder = new Ctor(stream, { audioBitsPerSecond: 32_000 });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        recorder.start(5000);
        session.current = { recorder, stream, chunks };
        setState("recording");
      })
      .catch(() => setState("blocked"));
    return () => {
      cancelled = true;
      void stop();
    };
  }, [active, key, stop]);

  return { state, stop };
}

/** Uploads a finished take and tells the API to verify it. Resolves false on any failure. */
export async function uploadRoundRecording(
  interviewId: string,
  roundId: string,
  audio: Blob,
): Promise<boolean> {
  try {
    const ticket = await interviewApi.recordingUploadTicket(interviewId, roundId);
    const form = new FormData();
    for (const [k, v] of Object.entries(ticket.fields)) form.append(k, String(v));
    form.append("file", audio, "round.webm");
    const res = await fetch(ticket.uploadUrl, { method: "POST", body: form });
    if (!res.ok) return false;
    // The audio is stored; only the API still has to verify it. Worth retrying.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await interviewApi.confirmRecording(interviewId, roundId);
        return true;
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    return false;
  } catch {
    return false;
  }
}
