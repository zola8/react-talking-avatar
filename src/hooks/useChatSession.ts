import { useRef, useState } from 'react';
import type { AgentId, ClientMessageId, ConversationId } from '../types/chat';


export interface ChatSession {
  readonly agentId: AgentId;
  readonly conversationId: ConversationId;
  readonly currentMessageId: ClientMessageId | null;
  allocateMessageId: () => ClientMessageId;
  reset: () => void;
}

const INITIAL_MESSAGE_COUNTER = 0;
const INITIAL_CONVERSATION_ID: ConversationId = '1';

export function useChatSession(agentId: AgentId): ChatSession {
  const conversationRef = useRef<ConversationId>(INITIAL_CONVERSATION_ID);

  const counterRef = useRef<number>(INITIAL_MESSAGE_COUNTER);
  const [currentMessageId, setCurrentMessageId] = useState<ClientMessageId | null>(null);

  const allocateMessageId = (): ClientMessageId => {
    counterRef.current += 1;
    const next = String(counterRef.current);
    setCurrentMessageId(next);
    return next;
  };

  const reset = (): void => {
    counterRef.current = INITIAL_MESSAGE_COUNTER;
    setCurrentMessageId(null);
  };

  return {
    agentId,
    conversationId: conversationRef.current,
    currentMessageId,
    allocateMessageId,
    reset,
  };
}
