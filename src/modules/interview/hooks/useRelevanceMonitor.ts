import { MutableRefObject, useEffect, useRef } from "react";

// Enough words for the AI to judge, and not a check on every phrase.
const MIN_WORDS = 15;
const MIN_NEW_WORDS = 10;
const MIN_GAP_MS = 6000;
const TICK_MS = 2000;
// One verdict over a half-finished answer is not evidence enough to cut in:
// the answer must still be off the question when checked again.
const VERDICTS_TO_INTERRUPT = 2;

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

interface Options {
  /** Only while the candidate is speaking an answer and nothing is being sent. */
  enabled: boolean;
  /** The answer as transcribed so far. */
  draftRef: MutableRefObject<string>;
  /** Asks the server whether to cut in now. */
  check: (text: string) => Promise<boolean>;
  /** Called when the server says the answer has left the question. */
  onOffTopic: () => void;
}

/**
 * Live relevance check (web, relevance.mode "realtime"): every few seconds,
 * once the spoken answer has grown, the server judges it so far. One check
 * at a time; a verdict that arrives after the answer was sent or replaced is
 * ignored, so a slow reply can never cut into the next answer. The
 * interviewer cuts in only after two off-topic verdicts in a row: a sustained
 * drift, never one partial sentence.
 */
export function useRelevanceMonitor({
  enabled,
  draftRef,
  check,
  onOffTopic,
}: Options) {
  const sink = useRef({ check, onOffTopic });
  useEffect(() => {
    sink.current = { check, onOffTopic };
  });
  const last = useRef({ at: 0, words: 0 });
  const offTopicRun = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) {
      offTopicRun.current = 0;
      return;
    }
    const tick = setInterval(() => {
      const text = draftRef.current;
      const words = wordCount(text);
      // A new answer starts the count again.
      if (words < last.current.words) {
        last.current = { at: 0, words: 0 };
        offTopicRun.current = 0;
      }
      if (
        inFlight.current ||
        words < MIN_WORDS ||
        words - last.current.words < MIN_NEW_WORDS ||
        Date.now() - last.current.at < MIN_GAP_MS
      )
        return;
      last.current = { at: Date.now(), words };
      inFlight.current = true;
      sink.current
        .check(text)
        .then((offTopic) => {
          if (!draftRef.current.startsWith(text)) return;
          offTopicRun.current = offTopic ? offTopicRun.current + 1 : 0;
          if (offTopicRun.current >= VERDICTS_TO_INTERRUPT) {
            offTopicRun.current = 0;
            sink.current.onOffTopic();
          }
        })
        // A failed check never interrupts anyone.
        .catch(() => undefined)
        .finally(() => {
          inFlight.current = false;
        });
    }, TICK_MS);
    return () => clearInterval(tick);
  }, [enabled, draftRef]);
}
