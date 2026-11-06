import { useEffect, useRef, useState } from 'react';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'sse';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  /** Optional structured payload (SSE event data, error object, etc.). */
  data?: unknown;
}

interface StreamLogProps {
  entries: LogEntry[];
  onClear?: () => void;
  /** Initial collapsed state. Defaults to expanded. */
  defaultCollapsed?: boolean;
  /** Panel height in px. Defaults to 192 (h-48). */
  height?: number;
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: 'text-gray-600',
  success: 'text-emerald-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
  sse: 'text-indigo-600',
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  info: 'INFO',
  success: ' OK ',
  warn: 'WARN',
  error: 'ERR ',
  sse: ' SSE ',
};

export default function StreamLog({
  entries,
  onClear,
  defaultCollapsed = false,
  height = 192,
}: StreamLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new entries arrive, unless the user scrolled up.
  useEffect(() => {
    if (scrollRef.current && autoScroll && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll, collapsed]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setAutoScroll(atBottom);
  };

  const errorCount = entries.filter((e) => e.level === 'error').length;
  const sseCount = entries.filter((e) => e.level === 'sse').length;

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 select-none"
          aria-expanded={!collapsed}
        >
          <span
            className={`inline-block transition-transform text-[10px] ${collapsed ? '' : 'rotate-90'}`}
          >
            ▶
          </span>
          Stream Log
          <span className="text-xs text-gray-400">({entries.length})</span>
          {sseCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
              {sseCount} sse
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              {errorCount} err
            </span>
          )}
        </button>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-3 w-3"
            />
            auto-scroll
          </label>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={entries.length === 0}
              className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ height }}
          className="overflow-y-auto px-4 py-2 font-mono text-xs leading-5 bg-white"
        >
          {entries.length === 0 ? (
            <p className="text-gray-400 italic">No events yet. Logs from the SSE stream will appear here.</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex gap-2">
                <span className="shrink-0 text-gray-400 tabular-nums">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={`shrink-0 font-semibold ${LEVEL_STYLES[e.level]}`}>
                  [{LEVEL_LABEL[e.level]}]
                </span>
                <span className="text-gray-800 break-all whitespace-pre-wrap">
                  {e.message}
                  {e.data != null && (
                    <span className="text-gray-400">
                      {' '}
                      {typeof e.data === 'string' ? e.data : JSON.stringify(e.data)}
                    </span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
