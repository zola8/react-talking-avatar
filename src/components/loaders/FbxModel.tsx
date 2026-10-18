import { useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import type { ModelConfig } from '../../config/models';
import { disposeObject } from '../../utils/modelDisposer';
import { inspectModel } from '../../utils/modelInspector';
import { useAutoFit } from '../../utils/modelNormalizer';


interface FbxModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}


export default function FbxModel({ config, faceTextureUrl }: FbxModelProps) {
  const scene = useLoader(FBXLoader, config.url);

  useAutoFit(scene);

  useEffect(() => {
    inspectModel(scene, 'FBX');
    return () => disposeObject(scene);
  }, [scene]);

  // Apply rotation from config
  const rotation = config.rotation ?? [0, 0, 0];

  return (
    <group rotation={rotation}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
