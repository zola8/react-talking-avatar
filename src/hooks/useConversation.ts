import { useCallback, useRef, useState } from 'react';
import { DUMMY_USER_ID } from '../config/constants';
import { speakText, stopSpeaking } from '../services/azureTTS';
import { generateResponse } from '../services/llm';
import { ChatError, type ChatMessage, type ChatRequest } from '../types/chat';
import type { ConversationStatus, UIMessage } from '../types/conversation';
import type { ModelConfig } from '../types/models';
import {
  createLipSyncController,
  deactivateLipSyncController,
  type LipSyncController,
} from '../types/viseme';

interface UseConversationParams {
  selectedModel: ModelConfig | null;
  token: string | null;
  region: string;
}

export interface UseConversationResult {
  messages: UIMessage[];
  status: ConversationStatus;
  speakingMessageId: string | null;
  lipSyncController: LipSyncController;
  handleTextSubmit: (text: string) => Promise<void>;
  handleCancel: () => void;
  handleClearHistory: () => void;
}

function makeMessage(role: 'user' | 'assistant', text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    timestamp: Date.now(),
  };
}

function formatChatError(err: unknown): string {
  if (err instanceof ChatError) {
    switch (err.code) {
      case 'timeout':
        return 'The response took too long. Please try again.';
      case 'network':
        return 'Network error. Please check your connection.';
      case 'rate_limited':
        return 'Too many requests. Please wait a moment and try again.';
      case 'unauthorized':
        return 'Authentication failed. Please reload the page.';
      case 'server_error':
        return 'The server had an error. Please try again shortly.';
      case 'bad_request':
        return 'The request was invalid. Please try rephrasing.';
      case 'parse':
        return 'Received an invalid response. Please try again.';
      default:
        return err.message || 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

export function useConversation({
  selectedModel,
  token,
  region,
}: UseConversationParams): UseConversationResult {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const turnIdRef = useRef<string | null>(null);
  const lipSyncControllerRef = useRef<LipSyncController>(createLipSyncController());

  const resetPipelineState = useCallback(() => {
    turnIdRef.current = null;
    stopSpeaking();
    deactivateLipSyncController(lipSyncControllerRef.current);
    setStatus('idle');
    setSpeakingMessageId(null);
  }, []);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!selectedModel) return;
    console.log('[Avatar] Received text:', text);

    const turnId = crypto.randomUUID();
    turnIdRef.current = turnId;

    const userMsg = makeMessage('user', text);
    setMessages((prev) => [...prev, userMsg]);
    setStatus('thinking');

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      history.push({ role: 'user', content: text });

      const request: ChatRequest = {
        userId: DUMMY_USER_ID,
        messages: history,
      };

      const response = await generateResponse(request);

      if (turnIdRef.current !== turnId) {
        console.log('[Avatar] Cancelled during thinking');
        return;
      }

      const aiMsg = makeMessage('assistant', response.text);
      setMessages((prev) => [...prev, aiMsg]);

      if (token) {
        setStatus('speaking');
        setSpeakingMessageId(aiMsg.id);

        await speakText({
          text: response.text,
          token,
          region,
          language: selectedModel.voice.language,
          voiceName: selectedModel.voice.voiceName,
          lipSyncController: lipSyncControllerRef.current,
          onError: (err) => console.error('[Avatar] TTS error:', err),
        });

        if (turnIdRef.current !== turnId) {
          console.log('[Avatar] Cancelled during speaking');
          return;
        }
      }
    } catch (err) {
      console.error('[Avatar] Pipeline error:', err);
      const errorText = formatChatError(err);
      setMessages((prev) => [...prev, makeMessage('assistant', errorText)]);
    } finally {
      if (turnIdRef.current === turnId) {
        setStatus('idle');
        setSpeakingMessageId(null);
        turnIdRef.current = null;
      }
    }
  }, [selectedModel, token, region, messages]);

  const handleClearHistory = useCallback(() => {
    resetPipelineState();
    setMessages([]);
  }, [resetPipelineState]);

  return {
    messages,
    status,
    speakingMessageId,
    lipSyncController: lipSyncControllerRef.current,
    handleTextSubmit,
    handleCancel: resetPipelineState,
    handleClearHistory,
  };
}
