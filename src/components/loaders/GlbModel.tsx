import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelConfig } from '../../config/models';
import { disposeObject } from '../../utils/modelDisposer';
import { inspectModel } from '../../utils/modelInspector';
import { useAutoFit } from '../../utils/modelNormalizer';


interface GlbModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}

export default function GlbModel({ config, faceTextureUrl }: GlbModelProps) {
  const gltf = useLoader(GLTFLoader, config.url);
  const scene = gltf.scene;

  const zoomAdjust = config.zoomAdjust ?? 0;
  const targetHeight = Math.max(0.2, 1.6 * (1 + zoomAdjust));

  // No third arg → useAutoFit falls back to geometry bbox (fine for GLB, no humanoid)
  useAutoFit(scene, targetHeight);

  useEffect(() => {
    inspectModel(scene, 'GLB', config.label);
    return () => disposeObject(scene);
  }, [scene, config.label]);

  const rotation = config.rotation ?? [0, 0, 0];
  const yOffset = config.yOffset ?? 0;

  return (
    <group rotation={rotation} position={[0, yOffset, 0]}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
