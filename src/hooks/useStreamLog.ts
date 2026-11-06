import { useCallback, useRef, useState } from 'react';
import type { LogEntry, LogLevel } from '../components/StreamLog';

let counter = 0;

export interface UseStreamLogResult {
  entries: LogEntry[];
  /** Append a single log entry. Returns the created entry. */
  append: (level: LogLevel, message: string, data?: unknown) => LogEntry;
  /** Convenience helpers for the common levels. */
  info: (message: string, data?: unknown) => void;
  success: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  /** Append a parsed SSE event. The `data` is shown as JSON. */
  sse: (message: string, data?: unknown) => void;
  /** Remove all entries. */
  clear: () => void;
}



export function useStreamLog(maxEntries = 200): UseStreamLogResult {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const maxRef = useRef(maxEntries);
  maxRef.current = maxEntries;

  const append = useCallback(
    (level: LogLevel, message: string, data?: unknown): LogEntry => {
      const entry: LogEntry = {
        id: `${Date.now()}-${counter++}`,
        timestamp: Date.now(),
        level,
        message,
        data,
      };
      setEntries((prev) => {
        const next = prev.length + 1 > maxRef.current
          ? [...prev.slice(-(maxRef.current - 1)), entry]
          : [...prev, entry];
        return next;
      });
      return entry;
    },
    [],
  );

  const make = (level: LogLevel) =>
    (message: string, data?: unknown) => append(level, message, data);

  return {
    entries,
    append,
    info: make('info'),
    success: make('success'),
    warn: make('warn'),
    error: make('error'),
    sse: make('sse'),
    clear: useCallback(() => setEntries([]), []),
  };
}
