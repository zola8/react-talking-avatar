import type { ConversationStatus } from '../types/conversation';
import Icon from './Icon';

interface StatusPillProps {
  status: ConversationStatus;
}

const STATUS_CONFIG: Record<
  ConversationStatus,
  { color: string; label: string; pulse: boolean; icon: 'mic' | 'refresh' | 'stop' | 'speaker' | 'user' | null }
> = {
  idle: { color: 'bg-gray-400', label: 'Idle', pulse: false, icon: null },
  listening: { color: 'bg-red-500', label: 'Listening', pulse: true, icon: 'mic' },
  transcribing: { color: 'bg-amber-500', label: 'Transcribing', pulse: true, icon: 'refresh' },
  thinking: { color: 'bg-yellow-500', label: 'Thinking', pulse: true, icon: 'refresh' },
  speaking: { color: 'bg-green-500', label: 'Speaking', pulse: true, icon: 'speaker' },
  error: { color: 'bg-red-700', label: 'Error', pulse: false, icon: 'stop' },
};

export default function StatusPill({ status }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span
        className={`w-2 h-2 rounded-full ${cfg.color}${cfg.pulse ? ' animate-pulse' : ''}`}
      />
      {cfg.icon && <Icon name={cfg.icon} size={14} />}
      <span className="font-medium">{cfg.label}</span>
    </div>
  );
}
