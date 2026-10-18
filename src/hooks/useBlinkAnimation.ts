import type { VRM } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { applyBlink, detectBlinkTargets, type BlinkTargets } from '../utils/blinkDetector';


interface BlinkState {
  targets: BlinkTargets;
  isBlinking: boolean;
  blinkProgress: number;
  nextBlinkTime: number;
}


export function useBlinkAnimation(vrm: VRM | undefined): void {
  const stateRef = useRef<BlinkState>({
    targets: {},
    isBlinking: false,
    blinkProgress: 0,
    nextBlinkTime: 0,
  });

  // Detect blink targets when VRM loads
  useEffect(() => {
    if (vrm) {
      const targets = detectBlinkTargets(vrm);
      stateRef.current.targets = targets;
      stateRef.current.nextBlinkTime = 2 + Math.random() * 3; // First blink in 2-5 seconds

      const hasTargets = targets.left || targets.right || targets.both;
      console.log(`[Blink Animation] ${hasTargets ? 'Initialized' : 'No blink targets found'}`);
    }
  }, [vrm]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const blinkState = stateRef.current;

    // Skip if no blink targets detected
    if (!blinkState.targets.left && !blinkState.targets.right && !blinkState.targets.both) {
      return;
    }

    // Start a new blink
    if (!blinkState.isBlinking && time >= blinkState.nextBlinkTime) {
      blinkState.isBlinking = true;
      blinkState.blinkProgress = 0;
    }

    // Animate the blink
    if (blinkState.isBlinking) {
      // Blink duration: 0.15 seconds (fast and natural)
      const blinkDuration = 0.15;
      blinkState.blinkProgress += 1 / (60 * blinkDuration); // Assuming 60fps

      // Smooth blink curve: ease in and out
      let blinkValue = 0;
      if (blinkState.blinkProgress < 0.5) {
        // Closing: ease in
        blinkValue = blinkState.blinkProgress * 2;
      } else {
        // Opening: ease out
        blinkValue = (1 - blinkState.blinkProgress) * 2;
      }

      applyBlink(blinkState.targets, blinkValue);

      // Blink complete
      if (blinkState.blinkProgress >= 1) {
        blinkState.isBlinking = false;
        blinkState.blinkProgress = 0;
        applyBlink(blinkState.targets, 0); // Ensure fully open
        // Next blink in 3-8 seconds
        blinkState.nextBlinkTime = time + 3 + Math.random() * 5;
      }
    }
  });
}
