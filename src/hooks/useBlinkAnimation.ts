import type { VRM } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';


interface BlinkState {
  isBlinking: boolean;
  progress: number;
  nextBlinkTime: number;
  leftPreset?: string;
  rightPreset?: string;
  bothPreset?: string;
}


export function useBlinkAnimation(vrm: VRM | undefined): void {
  const stateRef = useRef<BlinkState>({
    isBlinking: false,
    progress: 0,
    nextBlinkTime: 2 + Math.random() * 3,
  });

  useEffect(() => {
    if (!vrm?.expressionManager) return;

    const state = stateRef.current;
    const expressions = vrm.expressionManager.expressionMap;

    // Detect blink presets
    if (expressions['blinkLeft']) state.leftPreset = 'blinkLeft';
    if (expressions['blinkRight']) state.rightPreset = 'blinkRight';
    if (expressions['blink']) state.bothPreset = 'blink';
    if (!state.leftPreset && expressions['Blink_L']) state.leftPreset = 'Blink_L';
    if (!state.rightPreset && expressions['Blink_R']) state.rightPreset = 'Blink_R';
    if (!state.bothPreset && expressions['Blink']) state.bothPreset = 'Blink';

    const hasBlinks = state.leftPreset || state.rightPreset || state.bothPreset;
    console.log(`[Blink] Presets: L=${state.leftPreset}, R=${state.rightPreset}, Both=${state.bothPreset}`);
    console.log(`[Blink] ${hasBlinks ? 'Enabled' : 'No blink expressions found'}`);
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm?.expressionManager) return;

    const time = state.clock.elapsedTime;
    const blinkState = stateRef.current;

    // Start new blink
    if (!blinkState.isBlinking && time >= blinkState.nextBlinkTime) {
      blinkState.isBlinking = true;
      blinkState.progress = 0;
    }

    // Animate blink
    if (blinkState.isBlinking) {
      // FIX: Use delta parameter instead of state.clock.getDelta()
      const clampedDelta = Math.min(delta, 0.1);
      const blinkDuration = 0.15;
      blinkState.progress += clampedDelta / blinkDuration;

      let blinkValue = 0;
      if (blinkState.progress < 0.5) {
        blinkValue = blinkState.progress * 2;
      } else {
        blinkValue = (1 - blinkState.progress) * 2;
      }

      if (blinkState.leftPreset) vrm.expressionManager.setValue(blinkState.leftPreset, blinkValue);
      if (blinkState.rightPreset) vrm.expressionManager.setValue(blinkState.rightPreset, blinkValue);
      if (blinkState.bothPreset) vrm.expressionManager.setValue(blinkState.bothPreset, blinkValue);

      // Complete
      if (blinkState.progress >= 1) {
        blinkState.isBlinking = false;
        blinkState.progress = 0;
        if (blinkState.leftPreset) vrm.expressionManager.setValue(blinkState.leftPreset, 0);
        if (blinkState.rightPreset) vrm.expressionManager.setValue(blinkState.rightPreset, 0);
        if (blinkState.bothPreset) vrm.expressionManager.setValue(blinkState.bothPreset, 0);
        blinkState.nextBlinkTime = time + 3 + Math.random() * 5;
      }
    }
  });
}
