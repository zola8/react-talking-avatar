import { Canvas } from '@react-three/fiber';
import { CAMERA_DEFAULTS } from '../config/constants';
import type { ConversationStatus } from '../types/conversation';
import type { ModelConfig } from '../types/models';
import type { OrbitControlsRef } from '../types/three';
import type { LipSyncController } from '../types/viseme';
import AvatarScene from './AvatarScene';


interface AvatarStageProps {
  config: ModelConfig;
  refreshCount: number;
  cameraY?: number;
  cameraZ?: number;
  lookAtY?: number;
  controlsRef?: React.Ref<OrbitControlsRef>;
  className?: string;
  status?: ConversationStatus;
  lipSyncController?: LipSyncController;
}

export default function AvatarStage({
  config,
  refreshCount,
  cameraY,
  cameraZ,
  lookAtY,
  controlsRef,
  className,
  status,
  lipSyncController,
}: AvatarStageProps) {
  const canvasKey = `${config.id}-${refreshCount}`;
  const cameraPosition: [number, number, number] = [
    0,
    cameraY ?? CAMERA_DEFAULTS.y,
    cameraZ ?? CAMERA_DEFAULTS.z,
  ];

  return (
    <div
      className={`w-full h-full bg-gradient-to-b from-stone-100 to-stone-300 rounded-lg overflow-hidden border border-gray-300 shadow-lg ${className ?? ''}`}
    >
      <Canvas
        key={canvasKey}
        camera={{ position: cameraPosition, fov: CAMERA_DEFAULTS.fov }}
      >
        <AvatarScene
          config={config}
          lookAtY={lookAtY}
          controlsRef={controlsRef}
          status={status}
          lipSyncController={lipSyncController}
        />
      </Canvas>
    </div>
  );
}
