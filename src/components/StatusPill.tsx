import type { ConversationStatus } from '../types/conversation';


interface StatusPillProps {
  status: ConversationStatus;
}

const STATUS_CONFIG: Record<ConversationStatus, { color: string; label: string; pulse: boolean }> = {
  idle: { color: 'bg-gray-400', label: 'Idle', pulse: false },
  listening: { color: 'bg-red-500', label: 'Listening', pulse: true },
  transcribing: { color: 'bg-amber-500', label: 'Transcribing', pulse: true },
  thinking: { color: 'bg-yellow-500', label: 'Thinking', pulse: true },
  speaking: { color: 'bg-green-500', label: 'Speaking', pulse: true },
  error: { color: 'bg-red-700', label: 'Error', pulse: false },
};

export default function StatusPill({ status }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span
        className={`w-2 h-2 rounded-full ${cfg.color}${cfg.pulse ? ' animate-pulse' : ''}`}
      />
      <span className="font-medium">{cfg.label}</span>
    </div>
  );
}
