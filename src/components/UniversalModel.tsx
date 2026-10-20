import { Suspense } from 'react';
import type { ModelConfig } from '../config/models';
import type { ConversationStatus } from '../types/conversation';
import FbxModel from './loaders/FbxModel';
import GlbModel from './loaders/GlbModel';
import VrmModel from './loaders/VrmModel';

interface UniversalModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
  status?: ConversationStatus;
}

export default function UniversalModel({ config, faceTextureUrl, status }: UniversalModelProps) {
  if (faceTextureUrl) {
    console.log(`[UniversalModel] Face texture received: ${faceTextureUrl}`);
  }

  return (
    <Suspense fallback={null}>
      {config.format === 'fbx' ? (
        <FbxModel config={config} faceTextureUrl={faceTextureUrl} status={status} />
      ) : config.format === 'glb' ? (
        <GlbModel config={config} faceTextureUrl={faceTextureUrl} status={status} />
      ) : (
        <VrmModel config={config} faceTextureUrl={faceTextureUrl} status={status} />
      )}
    </Suspense>
  );
}
