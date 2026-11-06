import { useCallback, useRef, useState } from 'react';
import { speakText, stopSpeaking } from '../services/azureTTS';
import { streamChat } from '../services/llm';
import { parseChatStream } from '../services/sse';
import { ChatError, type ChatStreamRequest } from '../types/chat';
import type { ConversationStatus, UIMessage } from '../types/conversation';
import type { ModelConfig } from '../types/models';
import {
  createLipSyncController,
  deactivateLipSyncController,
  type LipSyncController,
} from '../types/viseme';
import { useChatSession } from './useChatSession';
import { useStreamLog, type UseStreamLogResult } from './useStreamLog';


interface UseConversationParams {
  selectedModel: ModelConfig | null;
  token: string | null;
  region: string;
}

export interface UseConversationResult {
  messages: UIMessage[];
  status: ConversationStatus;
  speakingMessageId: string | null;
  ttsError: string | null;
  lipSyncController: LipSyncController;
  streamLog: UseStreamLogResult;
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
      case 'timeout': return 'The response took too long. Please try again.';
      case 'network': return 'Network error. Please check your connection.';
      case 'rate_limited': return 'Too many requests. Please wait a moment and try again.';
      case 'unauthorized': return 'Authentication failed. Please reload the page.';
      case 'server_error': return 'The server had an error. Please try again shortly.';
      case 'bad_request': return 'The request was invalid. Please try rephrasing.';
      case 'parse': return 'Received an invalid response. Please try again.';
      default: return err.message || 'Something went wrong. Please try again.';
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
  const [ttsError, setTtsError] = useState<string | null>(null);

  const chatSession = useChatSession(selectedModel?.id ?? '');
  const streamLog = useStreamLog();

  const abortRef = useRef<AbortController | null>(null);
  const lipSyncControllerRef = useRef<LipSyncController>(createLipSyncController());

  const resetPipelineState = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopSpeaking();
    deactivateLipSyncController(lipSyncControllerRef.current);
    setStatus('idle');
    setSpeakingMessageId(null);
  }, []);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!selectedModel) return;

    // TODO ----- const agentId = selectedModel.id;
    const agentId = 'echo';
    const controller = new AbortController();
    abortRef.current = controller;

    // Add the user's message immediately and flip to "thinking".
    const userMsg = makeMessage('user', text);
    setMessages((prev) => [...prev, userMsg]);
    setStatus('thinking');
    setTtsError(null);

    // Allocate the sequential, retry-safe client message id.
    const clientMessageId = chatSession.allocateMessageId();
    const request: ChatStreamRequest = {
      agentId,
      conversationId: chatSession.conversationId,
      clientMessageId,
      content: text,
    };
    streamLog.metadata(
      'Request sent',
      `${agentId} · conv ${chatSession.conversationId} · msg ${clientMessageId}`,
      request,
    );

    // Stream the response, accumulating deltas and capturing the final text.
    let assembled = '';
    let finalContent: string | null = null;
    let streamErrorMessage: string | null = null;

    try {
      const response = await streamChat(request, controller.signal);

      for await (const event of parseChatStream(response, controller.signal)) {
        if (abortRef.current !== controller) return; // cancelled

        switch (event.type) {
          case 'meta':
            streamLog.metadata('Conversation', `id ${event.conversationId}`);
            break;
          case 'delta':
            assembled += event.content;
            if (event.content) streamLog.text(event.content);
            break;
          case 'final':
            finalContent = event.content;
            streamLog.text(event.content, 'final');
            break;
          case 'done':
            streamLog.done('Stream complete');
            break;
          case 'error':
            streamErrorMessage = event.message;
            streamLog.error('Stream error', event.message);
            break;
        }

        if (streamErrorMessage) break; // terminal — stop consuming
      }
    } catch (err) {
      if (abortRef.current !== controller) return; // cancelled, swallow
      streamLog.error(
        'Request failed',
        err instanceof Error ? err.message : String(err),
        err,
      );
      const errorText = formatChatError(err);
      setMessages((prev) => [...prev, makeMessage('assistant', errorText)]);
      return;
    }

    // A backend-sent `error` event: surface it as an assistant message and stop.
    if (streamErrorMessage) {
      setMessages((prev) => [...prev, makeMessage('assistant', streamErrorMessage)]);
      setStatus('idle');
      abortRef.current = null;
      return;
    }

    if (abortRef.current !== controller) return; // cancelled mid-stream

    // Prefer the explicit `final` event; fall back to assembled deltas.
    const assistantText = finalContent ?? assembled;
    if (!assistantText) {
      streamLog.metadata('Empty response', 'No content received');
      setStatus('idle');
      abortRef.current = null;
      return;
    }

    const aiMsg = makeMessage('assistant', assistantText);
    setMessages((prev) => [...prev, aiMsg]);

    // TTS pipeline (unchanged from the JSON era — speaks the final text).
    if (token) {
      setStatus('speaking');
      setSpeakingMessageId(aiMsg.id);

      await speakText({
        text: assistantText,
        token,
        region,
        language: selectedModel.voice.language,
        voiceName: selectedModel.voice.voiceName,
        lipSyncController: lipSyncControllerRef.current,
        onError: (err) => {
          streamLog.error('TTS failed', err);
          setTtsError(err);
        },
      });

      if (abortRef.current !== controller) return; // cancelled during speaking
    }

    // Clean up only if we're still the active turn.
    if (abortRef.current === controller) {
      setStatus('idle');
      setSpeakingMessageId(null);
      abortRef.current = null;
    }
  }, [selectedModel, token, region, chatSession, streamLog]);

  const handleClearHistory = useCallback(() => {
    resetPipelineState();
    setMessages([]);
    streamLog.clear();
    // Note: chatSession counter is intentionally NOT reset — re-using "1"
    // would collide with the cached previous message on the backend.
  }, [resetPipelineState, streamLog]);

  return {
    messages,
    status,
    speakingMessageId,
    ttsError,
    lipSyncController: lipSyncControllerRef.current,
    streamLog,
    handleTextSubmit,
    handleCancel: resetPipelineState,
    handleClearHistory,
  };
}
