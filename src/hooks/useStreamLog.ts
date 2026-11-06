import { useCallback, useRef, useState } from 'react';
import type { StreamEventKind, StreamLogEntry } from '../components/streamlog/StreamLog';

let counter = 0;


export interface UseStreamLogResult {
  entries: StreamLogEntry[];
  append: (kind: StreamEventKind, title: string, detail?: string, data?: unknown) => StreamLogEntry;
  text: (title: string, detail?: string, data?: unknown) => void;
  thinking: (title: string, detail?: string, data?: unknown) => void;
  reasoning: (title: string, detail?: string, data?: unknown) => void;
  toolCall: (title: string, detail?: string, data?: unknown) => void;
  toolResult: (title: string, detail?: string, data?: unknown) => void;
  metadata: (title: string, detail?: string, data?: unknown) => void;
  done: (title: string, detail?: string, data?: unknown) => void;
  error: (title: string, detail?: string, data?: unknown) => void;
  clear: () => void;
}


export function useStreamLog(maxEntries = 200): UseStreamLogResult {
  const [entries, setEntries] = useState<StreamLogEntry[]>([]);
  const maxRef = useRef(maxEntries);
  maxRef.current = maxEntries;

  const append = useCallback(
    (kind: StreamEventKind, title: string, detail?: string, data?: unknown): StreamLogEntry => {
      const entry: StreamLogEntry = {
        id: `${Date.now()}-${counter++}`,
        timestamp: Date.now(),
        kind,
        title,
        detail,
        data,
      };
      setEntries((prev) =>
        prev.length + 1 <= maxRef.current
          ? [...prev, entry]
          : [...prev.slice(-(maxRef.current - 1)), entry],
      );
      return entry;
    },
    [],
  );

  const make = (kind: StreamEventKind) =>
    useCallback(
      (title: string, detail?: string, data?: unknown) => append(kind, title, detail, data),
      [append],
    );

  return {
    entries,
    append,
    text: make('text'),
    thinking: make('thinking'),
    reasoning: make('reasoning'),
    toolCall: make('tool_call'),
    toolResult: make('tool_result'),
    metadata: make('metadata'),
    done: make('done'),
    error: make('error'),
    clear: useCallback(() => setEntries([]), []),
  };
}
