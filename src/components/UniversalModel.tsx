import { Suspense } from 'react';
import VrmModel from './loaders/VrmModel';
import FbxModel from './loaders/FbxModel';
import GlbModel from './loaders/GlbModel';
import type { ModelConfig } from '../config/models';


interface UniversalModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}


export default function UniversalModel({ config, faceTextureUrl }: UniversalModelProps) {
  if (faceTextureUrl) {
    console.log(`[UniversalModel] Face texture received: ${faceTextureUrl}`);
  }

  return (
    <Suspense fallback={null}>
      {config.format === 'fbx' ? (
        <FbxModel config={config} faceTextureUrl={faceTextureUrl} />
      ) : config.format === 'glb' ? (
        <GlbModel config={config} faceTextureUrl={faceTextureUrl} />
      ) : (
        <VrmModel config={config} faceTextureUrl={faceTextureUrl} />
      )}
    </Suspense>
  );
}
