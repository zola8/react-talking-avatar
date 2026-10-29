import { Suspense } from 'react';
import type { ConversationStatus } from '../types/conversation';
import type { ModelConfig } from '../types/models';
import type { LipSyncController } from '../types/viseme';
import FbxModel from './loaders/FbxModel';
import GlbModel from './loaders/GlbModel';
import VrmModel from './loaders/VrmModel';

interface UniversalModelProps {
  config: ModelConfig;
  status?: ConversationStatus;
  lipSyncController?: LipSyncController;
}

export default function UniversalModel({
  config,
  status,
  lipSyncController,
}: UniversalModelProps) {
  return (
    <Suspense fallback={null}>
      {config.format === 'fbx' ? (
        <FbxModel config={config} status={status} />
      ) : config.format === 'glb' ? (
        <GlbModel config={config} status={status} />
      ) : (
        <VrmModel
          config={config}
          status={status}
          lipSyncController={lipSyncController}
        />
      )}
    </Suspense>
  );
}
