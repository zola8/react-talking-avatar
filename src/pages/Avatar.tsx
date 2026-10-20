import { useRef, useState } from 'react';
import AvatarStage from '../components/AvatarStage';
import ConversationTranscript from '../components/ConversationTranscript';
import Icon from '../components/Icon';
import ModelSelector from '../components/ModelSelector';
import StatusPill from '../components/StatusPill';
import VoiceInput from '../components/VoiceInput';
import { MODELS, type ModelConfig } from '../config/models';
import { useAzureToken } from '../hooks/useAzureToken';
import { speakText, stopSpeaking } from '../services/azureTTS';
import { generateMockResponse } from '../services/mockLLM';
import type { ConversationStatus, Message } from '../types/conversation';

export default function Avatar() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const turnIdRef = useRef<string | null>(null);

  // Shared Azure auth token — used for both STT (VoiceInput) and TTS (Avatar)
  const { token, region } = useAzureToken();

  const handleRefresh = () => setRefreshCount((c) => c + 1);

  const handleClearHistory = () => {
    turnIdRef.current = null;        // invalidate any in-flight turn
    stopSpeaking();
    setStatus('idle');
    setSpeakingMessageId(null);
    setMessages([]);
  };

  const handleTextSubmit = async (text: string) => {
    console.log('[Avatar] Received text:', text);

    // Assign a unique ID to this conversation turn so we can cancel it cleanly
    const turnId = crypto.randomUUID();
    turnIdRef.current = turnId;

    // 1. Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStatus('thinking');

    try {
      // 2. Call mock LLM
      const response = await generateMockResponse(text);

      // Check if cancelled during "thinking"
      if (turnIdRef.current !== turnId) {
        console.log('[Avatar] Cancelled during thinking');
        return;
      }

      // 3. Add assistant message
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // 4. Speak via Azure TTS
      if (token) {
        setStatus('speaking');
        setSpeakingMessageId(aiMsg.id);

        await speakText({
          text: response.text,
          token,
          region,
          language: selectedModel.voice.language,
          voiceName: selectedModel.voice.voiceName,
          onError: (err) => console.error('[Avatar] TTS error:', err),
        });

        // Check if cancelled during speaking
        if (turnIdRef.current !== turnId) {
          console.log('[Avatar] Cancelled during speaking');
          return;
        }
      } else {
        console.warn('[Avatar] No token available, skipping TTS');
      }
    } catch (err) {
      console.error('[Avatar] Pipeline error:', err);
    } finally {
      // Only reset state if this turn is still the active one
      if (turnIdRef.current === turnId) {
        setStatus('idle');
        setSpeakingMessageId(null);
        turnIdRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    console.log('[Avatar] Cancelled');
    turnIdRef.current = null;        // invalidate the current turn
    stopSpeaking();
    setStatus('idle');
    setSpeakingMessageId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>
          <div className="mt-2">
            <StatusPill status={status} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector
            selectedId={selectedModel.id}
            onChange={setSelectedModel}
          />
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium flex items-center gap-1.5"
            title="Reset camera view"
          >
            <Icon name="refresh" size={16} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Main: avatar + conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-[600px]">
          <AvatarStage
            config={selectedModel}
            refreshCount={refreshCount}
            controlsRef={controlsRef}
            status={status} 
          />
        </div>
        <div className="lg:col-span-2 h-[600px]">
          <ConversationTranscript
            messages={messages}
            status={status}
            onClearHistory={handleClearHistory}
            speakingMessageId={speakingMessageId}
          />
        </div>
      </div>

      {/* Footer: input */}
      <VoiceInput
        onTextSubmit={handleTextSubmit}
        onCancel={handleCancel}
        status={status}
        token={token}
        region={region}
      />
    </div>
  );
}
