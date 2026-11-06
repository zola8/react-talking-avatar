import { useEffect, useMemo, useRef, useState } from 'react';


export type StreamEventKind =
  | 'text'
  | 'thinking'
  | 'reasoning'
  | 'tool_call'
  | 'tool_result'
  | 'metadata'
  | 'done'
  | 'error';


export interface StreamLogEntry {
  id: string;
  timestamp: number;
  kind: StreamEventKind;
  /** Short headline, e.g. "Calling search_web" or "Thinking…". */
  title: string;
  /** Inline detail (text delta, short summary, error message). */
  detail?: string;
  /** Structured payload, rendered as a collapsible JSON snippet when present. */
  data?: unknown;
}

interface StreamLogProps {
  entries: StreamLogEntry[];
  /**
   * Optional clear handler. NOT rendered as a button — the panel is
   * read-only. Kept in the type so existing wiring in `Avatar.tsx` keeps
   * compiling until the next step rewires it. Will be removed then.
   */
  onClear?: () => void;
  /** Initial collapsed state. Defaults to expanded. */
  defaultCollapsed?: boolean;
  /** Panel body height in px. Defaults to 192 (≈ h-48). */
  height?: number;
}

interface KindStyle {
  /** Short uppercase label for the badge. */
  label: string;
  /** Tailwind classes for the badge pill. */
  badge: string;
  /** Tailwind classes for the entry's left border (width applied separately). */
  border: string;
  /** Tailwind classes for the title text. */
  title: string;
}

const KIND_STYLES: Record<StreamEventKind, KindStyle> = {
  text: { label: 'TEXT', badge: 'bg-gray-100    text-gray-600', border: 'border-l-gray-300', title: 'text-gray-700' },
  thinking: { label: 'THINK', badge: 'bg-purple-100  text-purple-700', border: 'border-l-purple-300', title: 'text-purple-800 italic' },
  reasoning: { label: 'REASON', badge: 'bg-violet-100  text-violet-700', border: 'border-l-violet-300', title: 'text-violet-800 italic' },
  tool_call: { label: 'TOOL', badge: 'bg-indigo-100  text-indigo-700', border: 'border-l-indigo-300', title: 'text-indigo-900' },
  tool_result: { label: 'RESULT', badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-300', title: 'text-emerald-900' },
  metadata: { label: 'META', badge: 'bg-slate-100   text-slate-500', border: 'border-l-slate-300', title: 'text-slate-600' },
  done: { label: 'DONE', badge: 'bg-gray-100    text-gray-500', border: 'border-l-gray-300', title: 'text-gray-600' },
  error: { label: 'ERROR', badge: 'bg-red-100     text-red-700', border: 'border-l-red-400', title: 'text-red-800 font-medium' },
};

export default function StreamLog({
  entries,
  onClear: _onClear,
  defaultCollapsed = false,
  height = 192,
}: StreamLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom when new entries arrive, unless the user scrolled up.
  useEffect(() => {
    if (!scrollRef.current || collapsed || !autoScroll) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries, autoScroll, collapsed]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setAutoScroll(atBottom);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const counts = useMemo(() => countByKind(entries), [entries]);
  const toolCount = counts.tool_call + counts.tool_result;

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Header — view controls only, no mutating actions (read-only panel). */}
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
          {toolCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
              {toolCount} tool
            </span>
          )}
          {counts.error > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              {counts.error} err
            </span>
          )}
        </button>

        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="h-3 w-3"
          />
          auto-scroll
        </label>
      </div>

      {/* Body — read-only log surface. */}
      {!collapsed && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ height }}
          className="overflow-y-auto px-3 py-2 space-y-1 bg-white"
        >
          {entries.length === 0 ? (
            <p className="text-gray-400 italic text-xs px-1 py-2">
              No events yet. Logs from the SSE stream will appear here.
            </p>
          ) : (
            entries.map((entry) => (
              <StreamLogRow
                key={entry.id}
                entry={entry}
                expanded={expandedIds.has(entry.id)}
                onToggleExpand={toggleExpand}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** A single log row. Extracted so the parent map stays readable. */
function StreamLogRow({
  entry,
  expanded,
  onToggleExpand,
}: {
  entry: StreamLogEntry;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  const style = KIND_STYLES[entry.kind];
  const hasData = entry.data != null;

  return (
    <div className={`flex gap-2 px-2 py-1 border-l-2 ${style.border} rounded-r bg-white`}>
      <span className="shrink-0 text-[10px] text-gray-400 tabular-nums mt-0.5">
        {formatTime(entry.timestamp)}
      </span>
      <span
        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide mt-0.5 ${style.badge}`}
      >
        {style.label}
      </span>

      <div className="min-w-0 flex-1">
        <div className={`text-xs break-words ${style.title}`}>
          {entry.title}
          {entry.detail && (
            <span className="text-gray-600 font-normal"> — {entry.detail}</span>
          )}
        </div>

        {hasData && (
          <div className="mt-0.5">
            <button
              type="button"
              onClick={() => onToggleExpand(entry.id)}
              className="text-[10px] text-gray-400 hover:text-gray-700"
            >
              {expanded ? '▼ hide payload' : '▶ show payload'}
            </button>
            {expanded && (
              <pre className="mt-1 text-[10px] text-gray-600 bg-gray-50 border border-gray-100 rounded p-1.5 overflow-x-auto whitespace-pre-wrap break-all">
                {formatData(entry.data)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour12: false });
}

function formatData(data: unknown): string {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/** Tallies entries per kind, used for the header summary badges. */
function countByKind(entries: StreamLogEntry[]): Record<StreamEventKind, number> {
  const tally: Record<StreamEventKind, number> = {
    text: 0, thinking: 0, reasoning: 0, tool_call: 0,
    tool_result: 0, metadata: 0, done: 0, error: 0,
  };
  for (const e of entries) tally[e.kind]++;
  return tally;
}
