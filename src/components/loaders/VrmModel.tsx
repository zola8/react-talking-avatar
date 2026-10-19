import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelConfig } from '../../config/models';
import { useArmRelaxation } from '../../hooks/useArmRelaxation';
import { useBlinkAnimation } from '../../hooks/useBlinkAnimation';
import { useHeadAnimation } from '../../hooks/useHeadAnimation';
import { useIdleBodyAnimation } from '../../hooks/useIdleBodyAnimation';
import { inspectModel } from '../../utils/modelInspector';
import { computeTargetHeight, useAutoFit } from '../../utils/modelNormalizer';


interface VrmModelProps {
  config: ModelConfig;
  faceTextureUrl?: string | null;
}

export default function VrmModel({ config, faceTextureUrl }: VrmModelProps) {
  const gltf = useLoader(GLTFLoader, config.url, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  const vrm = gltf.userData.vrm as VRM | undefined;
  const scene = vrm?.scene ?? gltf.scene;

  useAutoFit(scene, computeTargetHeight(config.zoomAdjust ?? 0));

  useIdleBodyAnimation(vrm);
  useArmRelaxation(vrm);
  useHeadAnimation(vrm);
  useBlinkAnimation(vrm);

  useEffect(() => {
    inspectModel(scene, vrm ? 'VRM' : 'GLTF (no VRM block found)', config.label);
    return () => (vrm ? VRMUtils.deepDispose(vrm.scene) : undefined);
  }, [scene, vrm, config.label]);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    vrm?.update(clampedDelta);
  });

  const rotation = config.rotation ?? [0, 0, 0];
  const yOffset = config.yOffset ?? 0;

  return (
    <group rotation={rotation} position={[0, yOffset, 0]}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
