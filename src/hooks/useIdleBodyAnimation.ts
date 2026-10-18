import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm';
import type { RestPoses } from '../utils/restPoseCapture';
import { captureRestPoses } from '../utils/restPoseCapture';


export function useIdleBodyAnimation(vrm: VRM | undefined): void {
  const restPosesRef = useRef<RestPoses>({});

  useEffect(() => {
    if (vrm) {
      restPosesRef.current = captureRestPoses(vrm);
    }
  }, [vrm]);

  useFrame((state) => {
    if (!vrm?.humanoid) return;

    const time = state.clock.elapsedTime;
    const restPoses = restPosesRef.current;
    const getBone = (name: VRMHumanBoneName) => vrm.humanoid?.getNormalizedBoneNode(name);

    // Breathing
    if (restPoses.chest) {
      const chest = getBone('chest' as VRMHumanBoneName);
      if (chest) {
        const breathAmount = Math.sin(time * 1.5) * 0.008;
        chest.scale.set(restPoses.chest.x, restPoses.chest.y + breathAmount, restPoses.chest.z);
      }
    }

    // Body sway
    if (restPoses.hips) {
      const hips = getBone('hips' as VRMHumanBoneName);
      if (hips) {
        const swayAmount = Math.sin(time * 0.5) * 0.01;
        hips.rotation.set(restPoses.hips.x, restPoses.hips.y, restPoses.hips.z + swayAmount);
      }
    }

    // Spine counter-rotation
    if (restPoses.spine) {
      const spine = getBone('spine' as VRMHumanBoneName);
      if (spine) {
        const spineSway = Math.sin(time * 0.5) * -0.007;
        spine.rotation.set(restPoses.spine.x, restPoses.spine.y, restPoses.spine.z + spineSway);
      }
    }
  });
}
