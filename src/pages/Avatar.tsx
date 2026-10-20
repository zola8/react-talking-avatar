import { useRef, useState } from 'react';
import AvatarStage from '../components/AvatarStage';
import ConversationTranscript from '../components/ConversationTranscript';
import ModelSelector from '../components/ModelSelector';
import StatusPill from '../components/StatusPill';
import VoiceInput from '../components/VoiceInput';
import { MODELS, type ModelConfig } from '../config/models';
import type { ConversationStatus, Message } from '../types/conversation';


export default function Avatar() {
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODELS[0]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const controlsRef = useRef<any>(null);

  const handleRefresh = () => {
    setRefreshCount((c) => c + 1);
  };

  const handleInputSubmit = async (text: string, audioBlob?: Blob) => {
    console.log('[Avatar] Received:', { text, hasAudio: !!audioBlob });

    // Add user message to transcript
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Transition to "thinking" state
    setStatus('thinking');

    // PLACEHOLDER: simulate a delayed response. Will be replaced in step 2
    // with the real Azure STT + LLM + Azure TTS pipeline.
    setTimeout(() => {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `You said: "${text}"`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStatus('idle');
    }, 1200);
  };

  const isLoading = status === 'thinking' || status === 'transcribing';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>
          <StatusPill status={status} />
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector
            selectedId={selectedModel.id}
            onChange={setSelectedModel}
          />
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium"
            title="Reset camera view"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Main: avatar + conversation side-by-side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-[600px]">
          <AvatarStage
            config={selectedModel}
            refreshCount={refreshCount}
            controlsRef={controlsRef}
          />
        </div>
        <div className="lg:col-span-2 h-[600px]">
          <ConversationTranscript messages={messages} isLoading={isLoading} />
        </div>
      </div>

      {/* Footer: input */}
      <VoiceInput onSubmit={handleInputSubmit} disabled={isLoading} />
    </div>
  );
}
