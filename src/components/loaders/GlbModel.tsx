import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DEFAULT_ROTATION, DEFAULT_Y_OFFSET } from '../../config/constants';
import type { ConversationStatus } from '../../types/conversation';
import type { ModelConfig } from '../../types/models';
import { disposeObject } from '../../utils/modelDisposer';
import { useAutoFit } from '../../utils/modelNormalizer';


interface GlbModelProps {
  config: ModelConfig;
  status?: ConversationStatus;
}

export default function GlbModel({ config, status }: GlbModelProps) {
  // status is accepted but unused — GLB models have no humanoid bones to animate.
  // Kept in props for interface consistency with VRM/FBX loaders.
  void status;

  const gltf = useLoader(GLTFLoader, config.url);
  const scene = gltf.scene;

  const zoomAdjust = config.zoomAdjust ?? 0;
  const targetHeight = Math.max(0.2, 1.6 * (1 + zoomAdjust));

  useAutoFit(scene, targetHeight);

  useEffect(() => {
    return () => disposeObject(scene);
  }, [scene]);

  const rotation = config.rotation ?? DEFAULT_ROTATION;
  const yOffset = config.yOffset ?? DEFAULT_Y_OFFSET;

  return (
    <group rotation={rotation} position={[0, yOffset, 0]}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
