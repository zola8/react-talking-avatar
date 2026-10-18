import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { RestPoses } from '../utils/restPoseCapture';
import { captureRestPoses } from '../utils/restPoseCapture';


interface HeadState {
  tiltTarget: number;
  tiltCurrent: number;
  turnTarget: number;
  turnCurrent: number;
  lastMoveTime: number;
}


export function useHeadAnimation(vrm: VRM | undefined): void {
  const restPosesRef = useRef<RestPoses>({});
  const stateRef = useRef<HeadState>({
    tiltTarget: 0,
    tiltCurrent: 0,
    turnTarget: 0,
    turnCurrent: 0,
    lastMoveTime: 0,
  });

  useEffect(() => {
    if (vrm) {
      restPosesRef.current = captureRestPoses(vrm);
    }
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm?.humanoid) return;

    const clampedDelta = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;
    const restPoses = restPosesRef.current;
    const headState = stateRef.current;
    const getBone = (name: VRMHumanBoneName) => vrm.humanoid?.getNormalizedBoneNode(name);

    if (!restPoses.head) return;

    // Trigger new head movement every 3-7 seconds
    if (time - headState.lastMoveTime > 3 + Math.random() * 4) {
      headState.tiltTarget = (Math.random() - 0.5) * 0.1;
      headState.turnTarget = (Math.random() - 0.5) * 0.15;
      headState.lastMoveTime = time;
    }

    // Smooth interpolation
    const lerpSpeed = 1.5 * clampedDelta;
    headState.tiltCurrent += (headState.tiltTarget - headState.tiltCurrent) * lerpSpeed;
    headState.turnCurrent += (headState.turnTarget - headState.turnCurrent) * lerpSpeed;

    // Apply to head
    const head = getBone('head' as VRMHumanBoneName);
    if (head) {
      head.rotation.set(
        restPoses.head.x,
        restPoses.head.y + headState.turnCurrent,
        restPoses.head.z + headState.tiltCurrent
      );
    }

    // Neck follows
    if (restPoses.neck) {
      const neck = getBone('neck' as VRMHumanBoneName);
      if (neck) {
        neck.rotation.set(
          restPoses.neck.x,
          restPoses.neck.y + headState.turnCurrent * 0.2,
          restPoses.neck.z + headState.tiltCurrent * 0.2
        );
      }
    }
  });
}
