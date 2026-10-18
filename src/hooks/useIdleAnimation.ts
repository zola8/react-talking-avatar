import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';


interface AnimationState {
  headTiltTarget: number;
  headTiltCurrent: number;
  headTurnTarget: number;
  headTurnCurrent: number;
  lastHeadMoveTime: number;
  // Store rest pose rotations
  headRestRotation?: { x: number; y: number; z: number };
  neckRestRotation?: { x: number; y: number; z: number };
  hipsRestRotation?: { x: number; y: number; z: number };
  spineRestRotation?: { x: number; y: number; z: number };
  chestRestScale?: { x: number; y: number; z: number };
}


export function useIdleAnimation(vrm: VRM | undefined): void {
  const stateRef = useRef<AnimationState>({
    headTiltTarget: 0,
    headTiltCurrent: 0,
    headTurnTarget: 0,
    headTurnCurrent: 0,
    lastHeadMoveTime: 0,
  });

  // Capture rest pose when VRM loads
  useEffect(() => {
    if (vrm && vrm.humanoid) {
      const head = vrm.humanoid.getNormalizedBoneNode('head' as VRMHumanBoneName);
      const neck = vrm.humanoid.getNormalizedBoneNode('neck' as VRMHumanBoneName);
      const hips = vrm.humanoid.getNormalizedBoneNode('hips' as VRMHumanBoneName);
      const spine = vrm.humanoid.getNormalizedBoneNode('spine' as VRMHumanBoneName);
      const chest = vrm.humanoid.getNormalizedBoneNode('chest' as VRMHumanBoneName);

      if (head) {
        stateRef.current.headRestRotation = {
          x: head.rotation.x,
          y: head.rotation.y,
          z: head.rotation.z,
        };
      }
      if (neck) {
        stateRef.current.neckRestRotation = {
          x: neck.rotation.x,
          y: neck.rotation.y,
          z: neck.rotation.z,
        };
      }
      if (hips) {
        stateRef.current.hipsRestRotation = {
          x: hips.rotation.x,
          y: hips.rotation.y,
          z: hips.rotation.z,
        };
      }
      if (spine) {
        stateRef.current.spineRestRotation = {
          x: spine.rotation.x,
          y: spine.rotation.y,
          z: spine.rotation.z,
        };
      }
      if (chest) {
        stateRef.current.chestRestScale = {
          x: chest.scale.x,
          y: chest.scale.y,
          z: chest.scale.z,
        };
      }

      console.log('[Idle Animation] Rest pose captured');
    }
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm || !vrm.humanoid) return;

    const time = state.clock.elapsedTime;
    const animState = stateRef.current;

    // Get bone nodes
    const hips = vrm.humanoid.getNormalizedBoneNode('hips' as VRMHumanBoneName);
    const spine = vrm.humanoid.getNormalizedBoneNode('spine' as VRMHumanBoneName);
    const chest = vrm.humanoid.getNormalizedBoneNode('chest' as VRMHumanBoneName);
    const neck = vrm.humanoid.getNormalizedBoneNode('neck' as VRMHumanBoneName);
    const head = vrm.humanoid.getNormalizedBoneNode('head' as VRMHumanBoneName);

    // === CONTINUOUS ANIMATIONS ===

    // Breathing - subtle chest expansion (1.5 Hz cycle)
    if (chest && animState.chestRestScale) {
      const breathAmount = Math.sin(time * 1.5) * 0.008;
      chest.scale.set(
        animState.chestRestScale.x,
        animState.chestRestScale.y + breathAmount,
        animState.chestRestScale.z
      );
    }

    // Idle sway - gentle body rotation (0.5 Hz cycle)
    if (hips && animState.hipsRestRotation) {
      const swayAmount = Math.sin(time * 0.5) * 0.01;
      hips.rotation.set(
        animState.hipsRestRotation.x,
        animState.hipsRestRotation.y,
        animState.hipsRestRotation.z + swayAmount
      );
    }

    // Spine counter-rotation for natural feel
    if (spine && animState.spineRestRotation) {
      const spineSway = Math.sin(time * 0.5) * -0.007;
      spine.rotation.set(
        animState.spineRestRotation.x,
        animState.spineRestRotation.y,
        animState.spineRestRotation.z + spineSway
      );
    }

    // === RANDOM HEAD MOVEMENTS ===

    // Trigger new head movement every 3-7 seconds
    if (time - animState.lastHeadMoveTime > 3 + Math.random() * 4) {
      animState.headTiltTarget = (Math.random() - 0.5) * 0.1; // -0.1 to 0.1 radians (reduced)
      animState.headTurnTarget = (Math.random() - 0.5) * 0.15; // -0.15 to 0.15 radians (reduced)
      animState.lastHeadMoveTime = time;
    }

    // Smooth interpolation toward targets (slower, smoother)
    const lerpSpeed = 1.5 * delta;
    animState.headTiltCurrent += (animState.headTiltTarget - animState.headTiltCurrent) * lerpSpeed;
    animState.headTurnCurrent += (animState.headTurnTarget - animState.headTurnCurrent) * lerpSpeed;

    // Apply head movements as additions to rest pose
    if (head && animState.headRestRotation) {
      head.rotation.set(
        animState.headRestRotation.x,
        animState.headRestRotation.y + animState.headTurnCurrent,
        animState.headRestRotation.z + animState.headTiltCurrent
      );
    }

    // Neck follows head slightly
    if (neck && animState.neckRestRotation) {
      neck.rotation.set(
        animState.neckRestRotation.x,
        animState.neckRestRotation.y + animState.headTurnCurrent * 0.2,
        animState.neckRestRotation.z + animState.headTiltCurrent * 0.2
      );
    }
  });
}
