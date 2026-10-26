import { useRef, useState } from 'react';
import AvatarStage from '../components/AvatarStage';
import ConversationTranscript from '../components/ConversationTranscript';
import Icon from '../components/Icon';
import ModelSelector from '../components/ModelSelector';
import StatusPill from '../components/StatusPill';
import VoiceInput from '../components/VoiceInput';
import type { ModelConfig } from '../config/models';
import { useAzureToken } from '../hooks/useAzureToken';
import { useModelConfig } from '../hooks/useModelConfig';
import { speakText, stopSpeaking } from '../services/azureTTS';
import { generateMockResponse } from '../services/mockLLM';
import type { ConversationStatus, Message } from '../types/conversation';
import {
  createLipSyncController,
  deactivateLipSyncController,
  type LipSyncController,
} from '../types/viseme';

export default function Avatar() {
  const { models, isLoading: modelsLoading, error: modelsError } = useModelConfig();
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const turnIdRef = useRef<string | null>(null);
  const lipSyncControllerRef = useRef<LipSyncController>(createLipSyncController());

  const { token, region } = useAzureToken();

  // Auto-select first model once config loads
  if (models.length > 0 && selectedModel === null) {
    setSelectedModel(models[0]);
  }

  const handleRefresh = () => setRefreshCount((c) => c + 1);

  const handleClearHistory = () => {
    turnIdRef.current = null;
    stopSpeaking();
    deactivateLipSyncController(lipSyncControllerRef.current);
    setStatus('idle');
    setSpeakingMessageId(null);
    setMessages([]);
  };

  const handleTextSubmit = async (text: string) => {
    if (!selectedModel) return;
    console.log('[Avatar] Received text:', text);

    const turnId = crypto.randomUUID();
    turnIdRef.current = turnId;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStatus('thinking');

    try {
      const response = await generateMockResponse(text);

      if (turnIdRef.current !== turnId) {
        console.log('[Avatar] Cancelled during thinking');
        return;
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.text,
        timestamp: Date.now(),
      };
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
    } finally {
      if (turnIdRef.current === turnId) {
        setStatus('idle');
        setSpeakingMessageId(null);
        turnIdRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    console.log('[Avatar] Cancelled');
    turnIdRef.current = null;
    stopSpeaking();
    deactivateLipSyncController(lipSyncControllerRef.current);
    setStatus('idle');
    setSpeakingMessageId(null);
  };

  // Loading state
  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-gray-500">
        Loading avatar models...
      </div>
    );
  }

  // Error state
  if (modelsError || models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-red-500 gap-2">
        <p>Failed to load avatar models.</p>
        <p className="text-xs text-gray-500">{modelsError}</p>
      </div>
    );
  }

  // Safety — selectedModel should be set by the auto-select above
  if (!selectedModel) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>
          <StatusPill status={status} />
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector
            models={models}
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
            lipSyncController={lipSyncControllerRef.current}
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
