import { OrbitControls } from '@react-three/drei';
import {
  CAMERA_DEFAULTS,
  LIGHT_DEFAULTS,
  ORBIT_CONTROLS_DEFAULTS,
} from '../config/constants';
import type { ConversationStatus } from '../types/conversation';
import type { ModelConfig } from '../types/models';
import type { OrbitControlsRef } from '../types/three';
import type { LipSyncController } from '../types/viseme';
import UniversalModel from './UniversalModel';


interface AvatarSceneProps {
  config: ModelConfig;
  lookAtY?: number;
  controlsRef?: React.Ref<OrbitControlsRef>;
  status?: ConversationStatus;
  lipSyncController?: LipSyncController;
}

export default function AvatarScene({
  config,
  lookAtY = CAMERA_DEFAULTS.lookAtY,
  controlsRef,
  status,
  lipSyncController,
}: AvatarSceneProps) {
  return (
    <>
      <ambientLight intensity={LIGHT_DEFAULTS.ambientIntensity} />
      <directionalLight
        position={LIGHT_DEFAULTS.directional.position}
        intensity={LIGHT_DEFAULTS.directional.intensity}
      />
      <UniversalModel
        config={config}
        status={status}
        lipSyncController={lipSyncController}
      />
      <OrbitControls
        ref={controlsRef}
        target={[0, lookAtY, 0]}
        panSpeed={ORBIT_CONTROLS_DEFAULTS.panSpeed}
        minDistance={ORBIT_CONTROLS_DEFAULTS.minDistance}
        maxDistance={ORBIT_CONTROLS_DEFAULTS.maxDistance}
        minPolarAngle={ORBIT_CONTROLS_DEFAULTS.minPolarAngle}
        maxPolarAngle={ORBIT_CONTROLS_DEFAULTS.maxPolarAngle}
      />
    </>
  );
}
