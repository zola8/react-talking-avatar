import type { VRM } from '@pixiv/three-vrm';
import type { Mesh } from 'three';


export interface BlinkTargets {
  left?: { mesh: Mesh; index: number };
  right?: { mesh: Mesh; index: number };
  both?: { mesh: Mesh; index: number };
}


/**
 * Detects available blink morph targets on a VRM model.
 * Handles different naming conventions:
 * - ARKit: eyeBlinkLeft, eyeBlinkRight
 * - VRM standard: blendShape1.blink_L, blendShape1.blink_R
 * - Variations: Blink_L, Blink_R, blink, etc.
 */
export function detectBlinkTargets(vrm: VRM): BlinkTargets {
  const targets: BlinkTargets = {};

  vrm.scene.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.morphTargetDictionary) return;

    const dict = mesh.morphTargetDictionary;

    // Check for left eye blink
    if (!targets.left) {
      const leftNames = ['eyeBlinkLeft', 'blink_L', 'Blink_L', 'blink_l'];
      for (const name of leftNames) {
        if (dict[name] !== undefined) {
          targets.left = { mesh, index: dict[name] };
          console.log(`[Blink] Found left eye: "${name}" on mesh "${mesh.name}"`);
          break;
        }
      }
    }

    // Check for right eye blink
    if (!targets.right) {
      const rightNames = ['eyeBlinkRight', 'blink_R', 'Blink_R', 'blink_r'];
      for (const name of rightNames) {
        if (dict[name] !== undefined) {
          targets.right = { mesh, index: dict[name] };
          console.log(`[Blink] Found right eye: "${name}" on mesh "${mesh.name}"`);
          break;
        }
      }
    }

    // Check for combined blink (some models have a single blink target)
    if (!targets.both) {
      const bothNames = ['blink', 'Blink', 'blink_both'];
      for (const name of bothNames) {
        if (dict[name] !== undefined) {
          targets.both = { mesh, index: dict[name] };
          console.log(`[Blink] Found combined blink: "${name}" on mesh "${mesh.name}"`);
          break;
        }
      }
    }
  });

  return targets;
}

/**
 * Applies a blink value (0-1) to the detected targets
 */
export function applyBlink(targets: BlinkTargets, value: number): void {
  const clampedValue = Math.max(0, Math.min(1, value));

  if (targets.left) {
    if (!targets.left.mesh.morphTargetInfluences) {
      targets.left.mesh.morphTargetInfluences = [];
    }
    targets.left.mesh.morphTargetInfluences[targets.left.index] = clampedValue;
  }

  if (targets.right) {
    if (!targets.right.mesh.morphTargetInfluences) {
      targets.right.mesh.morphTargetInfluences = [];
    }
    targets.right.mesh.morphTargetInfluences[targets.right.index] = clampedValue;
  }

  if (targets.both) {
    if (!targets.both.mesh.morphTargetInfluences) {
      targets.both.mesh.morphTargetInfluences = [];
    }
    targets.both.mesh.morphTargetInfluences[targets.both.index] = clampedValue;
  }
}
