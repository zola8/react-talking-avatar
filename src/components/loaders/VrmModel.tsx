import { useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import { useAutoFit } from '../../utils/modelNormalizer';
import { inspectModel } from '../../utils/modelInspector';
import type { ModelConfig } from '../../config/models';


interface VrmModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}


export default function VrmModel({ config, faceTextureUrl }: VrmModelProps) {
  const gltf = useLoader(GLTFLoader, config.url, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  // Falls back to plain GLTF scene if file has no VRM block
  const vrm = gltf.userData.vrm as VRM | undefined;
  const scene = vrm?.scene ?? gltf.scene;

  useAutoFit(scene);

  useEffect(() => {
    inspectModel(scene, vrm ? 'VRM' : 'GLTF (no VRM block found)');
    return () => (vrm ? VRMUtils.deepDispose(vrm.scene) : undefined);
  }, [scene, vrm]);

  useFrame((_, delta) => vrm?.update(delta));

  // Apply rotation from config
  const rotation = config.rotation ?? [0, 0, 0];

  return (
    <group rotation={rotation}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
