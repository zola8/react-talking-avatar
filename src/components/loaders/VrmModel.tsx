import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DEFAULT_MODEL_HEIGHT, DEFAULT_ROTATION, DEFAULT_Y_OFFSET, MIN_MODEL_HEIGHT } from '../../config/constants';
import { useArmRelaxation } from '../../hooks/useArmRelaxation';
import { useBlinkAnimation } from '../../hooks/useBlinkAnimation';
import { useHeadAnimation } from '../../hooks/useHeadAnimation';
import { useIdleBodyAnimation } from '../../hooks/useIdleBodyAnimation';
import { useLipSync } from '../../hooks/useLipSync';
import { useResetToTPose } from '../../hooks/useResetToTPose';
import type { ConversationStatus } from '../../types/conversation';
import type { ModelConfig } from '../../types/models';
import type { LipSyncController } from '../../types/viseme';
import { useAutoFit } from '../../utils/modelNormalizer';


function computeTargetHeight(zoomAdjust: number | undefined): number {
  const adjust = zoomAdjust ?? 0;
  return Math.max(MIN_MODEL_HEIGHT, DEFAULT_MODEL_HEIGHT * (1 + adjust));
}


const dummyController: LipSyncController = {
  events: [],
  audioStartTime: null,
  audioEndTime: null,
  nextEventIndex: 0,
  active: false,
};

interface VrmModelProps {
  config: ModelConfig;
  status?: ConversationStatus;
  lipSyncController?: LipSyncController;
}

export default function VrmModel({
  config,
  status,
  lipSyncController,
}: VrmModelProps) {
  const gltf = useLoader(GLTFLoader, config.url, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  const vrm = gltf.userData.vrm as VRM | undefined;
  const scene = vrm?.scene ?? gltf.scene;

  const targetHeight = computeTargetHeight(config.zoomAdjust);

  useResetToTPose(vrm);
  useIdleBodyAnimation(vrm);
  useArmRelaxation(vrm);
  useHeadAnimation(vrm, status);
  useBlinkAnimation(vrm);
  useLipSync(vrm, lipSyncController ?? dummyController);
  useAutoFit(scene, targetHeight, vrm);

  useEffect(() => {
    // inspectModel(scene, vrm ? 'VRM' : 'GLTF (no VRM block found)', config.label);
    return () => (vrm ? VRMUtils.deepDispose(vrm.scene) : undefined);
  }, [scene, vrm]);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    vrm?.update(clampedDelta);
  });

  const rotation = config.rotation ?? DEFAULT_ROTATION;
  const yOffset = config.yOffset ?? DEFAULT_Y_OFFSET;

  return (
    <group rotation={rotation} position={[0, yOffset, 0]}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}
