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

  useAutoFit(scene);

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
