import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';


interface AnimationState {
  headTiltTarget: number;
  headTiltCurrent: number;
  headTurnTarget: number;
  headTurnCurrent: number;
  lastHeadMoveTime: number;
  isBlinking: boolean;
  blinkProgress: number;
  nextBlinkTime: number;
  blinkLeftPreset?: string;
  blinkRightPreset?: string;
  blinkBothPreset?: string;
  headRestRotation?: { x: number; y: number; z: number };
  neckRestRotation?: { x: number; y: number; z: number };
  hipsRestRotation?: { x: number; y: number; z: number };
  spineRestRotation?: { x: number; y: number; z: number };
  chestRestScale?: { x: number; y: number; z: number };
}

export function useVrmAnimations(vrm: VRM | undefined): void {
  const stateRef = useRef<AnimationState>({
    headTiltTarget: 0,
    headTiltCurrent: 0,
    headTurnTarget: 0,
    headTurnCurrent: 0,
    lastHeadMoveTime: 0,
    isBlinking: false,
    blinkProgress: 0,
    nextBlinkTime: 2 + Math.random() * 3,
  });

  useEffect(() => {
    if (!vrm) return;

    const state = stateRef.current;

    // Capture rest poses
    const head = vrm.humanoid?.getNormalizedBoneNode('head' as VRMHumanBoneName);
    const neck = vrm.humanoid?.getNormalizedBoneNode('neck' as VRMHumanBoneName);
    const hips = vrm.humanoid?.getNormalizedBoneNode('hips' as VRMHumanBoneName);
    const spine = vrm.humanoid?.getNormalizedBoneNode('spine' as VRMHumanBoneName);
    const chest = vrm.humanoid?.getNormalizedBoneNode('chest' as VRMHumanBoneName);

    if (head) state.headRestRotation = { x: head.rotation.x, y: head.rotation.y, z: head.rotation.z };
    if (neck) state.neckRestRotation = { x: neck.rotation.x, y: neck.rotation.y, z: neck.rotation.z };
    if (hips) state.hipsRestRotation = { x: hips.rotation.x, y: hips.rotation.y, z: hips.rotation.z };
    if (spine) state.spineRestRotation = { x: spine.rotation.x, y: spine.rotation.y, z: spine.rotation.z };
    if (chest) state.chestRestScale = { x: chest.scale.x, y: chest.scale.y, z: chest.scale.z };

    // Detect blink expressions
    if (vrm.expressionManager) {
      const expressions = vrm.expressionManager.expressionMap;
      if (expressions['blinkLeft']) state.blinkLeftPreset = 'blinkLeft';
      if (expressions['blinkRight']) state.blinkRightPreset = 'blinkRight';
      if (expressions['blink']) state.blinkBothPreset = 'blink';
      if (!state.blinkLeftPreset && expressions['Blink_L']) state.blinkLeftPreset = 'Blink_L';
      if (!state.blinkRightPreset && expressions['Blink_R']) state.blinkRightPreset = 'Blink_R';
      if (!state.blinkBothPreset && expressions['Blink']) state.blinkBothPreset = 'Blink';

      console.log(`[VRM Animations] Blink presets: L=${state.blinkLeftPreset}, R=${state.blinkRightPreset}, Both=${state.blinkBothPreset}`);
    }

    console.log('[VRM Animations] Initialized');
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm) return;

    // Clamp delta to prevent wild animations after tab switches
    const clampedDelta = Math.min(delta, 0.1);

    vrm.update(clampedDelta);

    const time = state.clock.elapsedTime;
    const animState = stateRef.current;

    // === IDLE BODY ANIMATIONS ===

    if (vrm.humanoid && animState.chestRestScale) {
      const chest = vrm.humanoid.getNormalizedBoneNode('chest' as VRMHumanBoneName);
      if (chest) {
        const breathAmount = Math.sin(time * 1.5) * 0.008;
        chest.scale.set(animState.chestRestScale.x, animState.chestRestScale.y + breathAmount, animState.chestRestScale.z);
      }
    }

    if (vrm.humanoid && animState.hipsRestRotation) {
      const hips = vrm.humanoid.getNormalizedBoneNode('hips' as VRMHumanBoneName);
      if (hips) {
        const swayAmount = Math.sin(time * 0.5) * 0.01;
        hips.rotation.set(animState.hipsRestRotation.x, animState.hipsRestRotation.y, animState.hipsRestRotation.z + swayAmount);
      }
    }

    if (vrm.humanoid && animState.spineRestRotation) {
      const spine = vrm.humanoid.getNormalizedBoneNode('spine' as VRMHumanBoneName);
      if (spine) {
        const spineSway = Math.sin(time * 0.5) * -0.007;
        spine.rotation.set(animState.spineRestRotation.x, animState.spineRestRotation.y, animState.spineRestRotation.z + spineSway);
      }
    }

    if (vrm.humanoid) {
      if (time - animState.lastHeadMoveTime > 3 + Math.random() * 4) {
        animState.headTiltTarget = (Math.random() - 0.5) * 0.1;
        animState.headTurnTarget = (Math.random() - 0.5) * 0.15;
        animState.lastHeadMoveTime = time;
      }

      const lerpSpeed = 1.5 * clampedDelta;
      animState.headTiltCurrent += (animState.headTiltTarget - animState.headTiltCurrent) * lerpSpeed;
      animState.headTurnCurrent += (animState.headTurnTarget - animState.headTurnCurrent) * lerpSpeed;

      const head = vrm.humanoid.getNormalizedBoneNode('head' as VRMHumanBoneName);
      if (head && animState.headRestRotation) {
        head.rotation.set(animState.headRestRotation.x, animState.headRestRotation.y + animState.headTurnCurrent, animState.headRestRotation.z + animState.headTiltCurrent);
      }

      const neck = vrm.humanoid.getNormalizedBoneNode('neck' as VRMHumanBoneName);
      if (neck && animState.neckRestRotation) {
        neck.rotation.set(animState.neckRestRotation.x, animState.neckRestRotation.y + animState.headTurnCurrent * 0.2, animState.neckRestRotation.z + animState.headTiltCurrent * 0.2);
      }
    }

    // === BLINKING ===

    if (vrm.expressionManager) {
      if (!animState.isBlinking && time >= animState.nextBlinkTime) {
        animState.isBlinking = true;
        animState.blinkProgress = 0;
      }

      if (animState.isBlinking) {
        const blinkDuration = 0.15;
        animState.blinkProgress += clampedDelta / blinkDuration;

        let blinkValue = 0;
        if (animState.blinkProgress < 0.5) {
          blinkValue = animState.blinkProgress * 2;
        } else {
          blinkValue = (1 - animState.blinkProgress) * 2;
        }

        if (animState.blinkLeftPreset) vrm.expressionManager.setValue(animState.blinkLeftPreset, blinkValue);
        if (animState.blinkRightPreset) vrm.expressionManager.setValue(animState.blinkRightPreset, blinkValue);
        if (animState.blinkBothPreset) vrm.expressionManager.setValue(animState.blinkBothPreset, blinkValue);

        if (animState.blinkProgress >= 1) {
          animState.isBlinking = false;
          animState.blinkProgress = 0;
          if (animState.blinkLeftPreset) vrm.expressionManager.setValue(animState.blinkLeftPreset, 0);
          if (animState.blinkRightPreset) vrm.expressionManager.setValue(animState.blinkRightPreset, 0);
          if (animState.blinkBothPreset) vrm.expressionManager.setValue(animState.blinkBothPreset, 0);
          animState.nextBlinkTime = time + 3 + Math.random() * 5;
        }
      }
    }
  });
}
