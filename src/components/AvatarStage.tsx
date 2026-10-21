import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { Ref } from 'react';
import type { ModelConfig } from '../config/models';
import type { ConversationStatus } from '../types/conversation';
import type { LipSyncController } from '../types/viseme';
import UniversalModel from './UniversalModel';

interface AvatarStageProps {
  config: ModelConfig;
  refreshCount: number;
  faceTextureUrl?: string | null;
  cameraY?: number;
  cameraZ?: number;
  lookAtY?: number;
  controlsRef?: Ref<any>;
  className?: string;
  status?: ConversationStatus;
  lipSyncController?: LipSyncController;
}

export default function AvatarStage({
  config,
  refreshCount,
  faceTextureUrl,
  cameraY = 1.2,
  cameraZ = 3.5,
  lookAtY = 1.2,
  controlsRef,
  className,
  status,
  lipSyncController,
}: AvatarStageProps) {
  const canvasKey = `${config.id}-${refreshCount}`;

  return (
    <div
      className={`w-full h-full bg-gradient-to-b from-stone-100 to-stone-300 rounded-lg overflow-hidden border border-gray-300 shadow-lg ${className ?? ''}`}
    >
      <Canvas
        key={canvasKey}
        camera={{ position: [0, cameraY, cameraZ], fov: 35 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <UniversalModel
          config={config}
          faceTextureUrl={faceTextureUrl}
          status={status}
          lipSyncController={lipSyncController}
        />
        <OrbitControls
          ref={controlsRef}
          target={[0, lookAtY, 0]}
          enablePan={true}
          panSpeed={0.5}
          minDistance={1.5}
          maxDistance={8}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>
    </div>
  );
}
