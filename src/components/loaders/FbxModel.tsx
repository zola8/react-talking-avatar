import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { ModelConfig } from '../../config/models';
import type { ConversationStatus } from '../../types/conversation';
import { disposeObject } from '../../utils/modelDisposer';
import { useAutoFit } from '../../utils/modelNormalizer';

interface FbxModelProps {
  config: ModelConfig;
  status?: ConversationStatus;
}

export default function FbxModel({ config, status }: FbxModelProps) {
  // FBX might have a skeleton, but we don't currently animate it.
  // Kept in props for interface consistency.
  
  void status;

  const scene = useLoader(FBXLoader, config.url);

  useAutoFit(scene);

  useEffect(() => {
    return () => disposeObject(scene);
  }, [scene]);

  const rotation = config.rotation ?? [0, 0, 0];
  const yOffset = config.yOffset ?? 0;

  return (
    <group rotation={rotation} position={[0, yOffset, 0]}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
