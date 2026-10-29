import type { ConversationStatus } from '../types/conversation';
import type { ModelConfig } from '../types/models';
import Icon from './Icon';
import ModelSelector from './ModelSelector';
import StatusPill from './StatusPill';


interface AvatarHeaderProps {
  status: ConversationStatus;
  models: ModelConfig[];
  selectedModelId: string;
  onModelChange: (model: ModelConfig) => void;
  onRefresh: () => void;
}

export default function AvatarHeader({
  status,
  models,
  selectedModelId,
  onModelChange,
  onRefresh,
}: AvatarHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-800">The Avatar</h1>
        <StatusPill status={status} />
      </div>

      <div className="flex items-center gap-3">
        <ModelSelector
          models={models}
          selectedId={selectedModelId}
          onChange={onModelChange}
        />
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium flex items-center gap-1.5"
          title="Reset camera view"
        >
          <Icon name="refresh" size={16} />
          <span>Reset View</span>
        </button>
      </div>
    </div>
  );
}
