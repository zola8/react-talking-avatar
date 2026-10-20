import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a tuple of [schedule, cancel].
 * - schedule(fn, delay) → starts a timeout; returns the timer id
 * - cancel() → cancels the pending timeout (no-op if none)
 *
 * On unmount, any pending timeout is cancelled automatically.
 */
export function useCancellableTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fn();
    }, delay);
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => () => cancel(), [cancel]);

  return { schedule, cancel };
}
