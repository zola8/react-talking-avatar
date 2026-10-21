import type { VRM } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { type LipSyncController, resolveViseme } from '../types/viseme';

const MOUTH_PRESETS = ['aa', 'ih', 'ou', 'ee', 'oh', 'a', 'i', 'u', 'e', 'o'];

const END_BUFFER_MS = 200;


export function useLipSync(
  vrm: VRM | undefined,
  controller: LipSyncController,
): void {
  const availablePresetsRef = useRef<Set<string>>(new Set());
  const targetsRef = useRef<Record<string, number>>({});
  const currentRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!vrm?.expressionManager) return;
    const expressions = vrm.expressionManager.expressionMap;
    const available = new Set<string>();
    for (const preset of MOUTH_PRESETS) {
      if (expressions[preset]) {
        available.add(preset);
      }
    }
    availablePresetsRef.current = available;
    console.log('[useLipSync] Available mouth presets:', Array.from(available));
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm?.expressionManager) return;

    const available = availablePresetsRef.current;
    if (available.size === 0) return;

    const audioStartTime = controller.audioStartTime;
    const audioEndTime = controller.audioEndTime;

    // Are we currently in a "speaking" window?
    // (audioStartTime set AND either audioEndTime not yet reached OR not yet known)
    let inSpeakingWindow = false;
    let elapsedMs = 0;

    if (audioStartTime !== null) {
      elapsedMs = performance.now() - audioStartTime;

      if (controller.active) {
        if (audioEndTime === null) {
          // Synthesis complete callback hasn't fired yet — still in early phase
          inSpeakingWindow = true;
        } else if (elapsedMs < audioEndTime + END_BUFFER_MS) {
          // Audio is still playing
          inSpeakingWindow = true;
        } else {
          // Audio has finished — deactivate
          controller.active = false;
        }
      }
    }

    if (inSpeakingWindow) {
      // Apply all due events
      while (controller.nextEventIndex < controller.events.length) {
        const event = controller.events[controller.nextEventIndex];
        if (event.offsetMs > elapsedMs) break;

        // Reset all targets to 0, then set the new one
        for (const key in targetsRef.current) {
          targetsRef.current[key] = 0;
        }

        const mapping = resolveViseme(event.visemeId, available);
        if (mapping) {
          targetsRef.current[mapping.preset] = mapping.intensity;
        }

        controller.nextEventIndex++;
      }
    } else {
      // Decay all targets to 0
      for (const key in targetsRef.current) {
        targetsRef.current[key] = 0;
      }
    }

    // Smooth interpolation toward targets
    const lerpFactor = Math.min(1, delta * 12);

    for (const preset of available) {
      const target = targetsRef.current[preset] ?? 0;
      const current = currentRef.current[preset] ?? 0;
      const newValue = current + (target - current) * lerpFactor;

      if (Math.abs(newValue - current) > 0.001) {
        currentRef.current[preset] = newValue;
        vrm.expressionManager!.setValue(preset, newValue);
      }
    }
  });
}
