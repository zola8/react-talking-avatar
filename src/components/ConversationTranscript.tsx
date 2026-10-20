import { useEffect, useRef } from 'react';
import type { ConversationStatus, Message } from '../types/conversation';
import Icon from './Icon';


interface ConversationTranscriptProps {
  messages: Message[];
  status: ConversationStatus;
}

const LOADING_TEXT: Partial<Record<ConversationStatus, string>> = {
  transcribing: 'Transcribing your audio...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
};

export default function ConversationTranscript({ messages, status }: ConversationTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading =
    status === 'transcribing' || status === 'thinking' || status === 'speaking';
  const loadingText = LOADING_TEXT[status] ?? 'Loading...';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 h-full flex flex-col">
      <div className="flex justify-between items-start gap-3 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Conversation
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto text-gray-800 space-y-3 pr-1"
      >
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-gray-400 italic">
            Start a conversation by typing or speaking below.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 items-start ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-stone-200 text-stone-700' : 'bg-blue-100 text-blue-700'
                }`}
            >
              <Icon name={m.role === 'user' ? 'user' : 'bot'} size={16} />
            </div>
            <div
              className={`p-2 rounded-lg text-sm leading-relaxed max-w-[80%] ${m.role === 'user'
                  ? 'bg-stone-100 text-stone-800'
                  : 'bg-blue-50 text-blue-900'
                }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">{loadingText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
