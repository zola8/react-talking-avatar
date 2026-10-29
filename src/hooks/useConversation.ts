import { useCallback, useRef, useState } from 'react';
import { speakText, stopSpeaking } from '../services/azureTTS';
import { generateResponse, type ChatMessage } from '../services/llm';
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

const ERROR_MESSAGE = 'Sorry, something went wrong. Please try again.';

function makeMessage(role: 'user' | 'assistant', text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    timestamp: Date.now(),
  };
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

      const response = await generateResponse(history);

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
      setMessages((prev) => [...prev, makeMessage('assistant', ERROR_MESSAGE)]);
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
