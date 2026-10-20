import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { ModelConfig } from '../../config/models';
import { disposeObject } from '../../utils/modelDisposer';
import { useAutoFit } from '../../utils/modelNormalizer';


interface FbxModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}


export default function FbxModel({ config, faceTextureUrl }: FbxModelProps) {
  const scene = useLoader(FBXLoader, config.url);

  useAutoFit(scene);

  useEffect(() => {
    // inspectModel(scene, 'FBX', config.label);
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
