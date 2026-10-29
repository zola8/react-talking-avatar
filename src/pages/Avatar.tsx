import { useMemo, useRef, useState } from 'react';
import AvatarHeader from '../components/AvatarHeader';
import AvatarStage from '../components/AvatarStage';
import ConversationTranscript from '../components/ConversationTranscript';
import VoiceInput from '../components/VoiceInput';
import { useAzureToken } from '../hooks/useAzureToken';
import { useConversation } from '../hooks/useConversation';
import { useModelConfig } from '../hooks/useModelConfig';
import type { ModelConfig } from '../types/models';
import type { OrbitControlsRef } from '../types/three';


export default function Avatar() {
  const { models, isLoading: modelsLoading, error: modelsError } = useModelConfig();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const controlsRef = useRef<OrbitControlsRef>(null);

  const { token, region } = useAzureToken();

  const selectedModel = useMemo<ModelConfig | null>(
    () => models.find((m) => m.id === selectedModelId) ?? models[0] ?? null,
    [models, selectedModelId],
  );

  const {
    messages,
    status,
    speakingMessageId,
    lipSyncController,
    handleTextSubmit,
    handleCancel,
    handleClearHistory,
  } = useConversation({ selectedModel, token, region });

  const handleRefresh = () => setRefreshCount((c) => c + 1);

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-gray-500">
        Loading avatar models...
      </div>
    );
  }

  if (modelsError || models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-red-500 gap-2">
        <p>Failed to load avatar models.</p>
        <p className="text-xs text-gray-500">{modelsError}</p>
      </div>
    );
  }

  if (!selectedModel) return null;

  return (
    <div className="space-y-6">
      <AvatarHeader
        status={status}
        models={models}
        selectedModelId={selectedModel.id}
        onModelChange={(m) => setSelectedModelId(m.id)}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-[600px]">
          <AvatarStage
            config={selectedModel}
            refreshCount={refreshCount}
            controlsRef={controlsRef}
            status={status}
            lipSyncController={lipSyncController}
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

      <VoiceInput
        onTextSubmit={handleTextSubmit}
        onCancel={handleCancel}
        status={status}
        token={token}
        region={region}
        language={selectedModel.voice.language}
      />
    </div>
  );
}
