import { useEffect, useRef } from 'react';
import type { Message } from '../types/conversation';


interface ConversationTranscriptProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ConversationTranscript({ messages, isLoading }: ConversationTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
            className={`p-2 rounded-lg text-sm leading-relaxed ${m.role === 'user'
                ? 'bg-stone-100 text-stone-800 ml-8'
                : 'bg-blue-50 text-blue-900 mr-8'
              }`}
          >
            <span className="block text-xs uppercase tracking-wide opacity-60 mb-1">
              {m.role}
            </span>
            {m.text}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
