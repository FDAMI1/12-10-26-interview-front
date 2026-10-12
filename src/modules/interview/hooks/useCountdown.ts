import { useEffect, useState } from "react";

const left = (deadlineMs: number) =>
  Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));

/**
 * Seconds until `deadlineMs`, or null before the first tick. Display only -
 * the server decides when a round is over.
 */
export function useCountdown(deadlineMs: number | null) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (deadlineMs == null) return;
    const tick = () => setSeconds(left(deadlineMs));
    const first = setTimeout(tick, 0);
    const handle = setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(handle);
      setSeconds(null);
    };
  }, [deadlineMs]);

  return seconds;
}
