import { Suspense } from 'react';
import type { ModelConfig } from '../config/models';
import FbxModel from './loaders/FbxModel';
import VrmModel from './loaders/VrmModel';


interface UniversalModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}


export default function UniversalModel({ config, faceTextureUrl }: UniversalModelProps) {
  // Pipeline is wired; applying texture to face mesh is a future step
  if (faceTextureUrl) {
    console.log(`[UniversalModel] Face texture received: ${faceTextureUrl}`);
  }

  return (
    <Suspense fallback={null}>
      {config.format === 'fbx' ? (
        <FbxModel config={config} faceTextureUrl={faceTextureUrl} />
      ) : (
        <VrmModel config={config} faceTextureUrl={faceTextureUrl} />
      )}
    </Suspense>
  );
}
