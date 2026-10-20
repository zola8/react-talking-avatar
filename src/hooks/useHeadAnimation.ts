import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import type { ConversationStatus } from '../types/conversation';


interface HeadState {
  // turn/tilt
  tiltTarget: number;
  tiltCurrent: number;
  turnTarget: number;
  turnCurrent: number;
  lastMoveTime: number;
  // nodding
  nodNextTime: number;          // when to trigger the next nod
  nodStartTime: number;         // when the current nod started
  nodDuration: number;          // how long the current nod lasts
  nodAmplitude: number;         // how deep the nod is (radians)
  isNodding: boolean;
}

export function useHeadAnimation(
  vrm: VRM | undefined,
  status?: ConversationStatus,
): void {
  const stateRef = useRef<HeadState>({
    tiltTarget: 0,
    tiltCurrent: 0,
    turnTarget: 0,
    turnCurrent: 0,
    lastMoveTime: 0,
    nodNextTime: 2 + Math.random() * 3,
    nodStartTime: 0,
    nodDuration: 0,
    nodAmplitude: 0,
    isNodding: false,
  });

  // Apply initial pose in useLayoutEffect so first paint shows the head at rest.
  useLayoutEffect(() => {
    if (!vrm?.humanoid) return;
    const head = vrm.humanoid.getNormalizedBoneNode('head' as VRMHumanBoneName);
    const neck = vrm.humanoid.getNormalizedBoneNode('neck' as VRMHumanBoneName);
    if (head) head.rotation.set(0, 0, 0);
    if (neck) neck.rotation.set(0, 0, 0);
    vrm.update(0);
    vrm.scene.updateMatrixWorld(true);
  }, [vrm]);

  useFrame((state, delta) => {
    if (!vrm?.humanoid) return;

    const clampedDelta = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;
    const headState = stateRef.current;
    const getBone = (name: VRMHumanBoneName) => vrm.humanoid?.getNormalizedBoneNode(name);

    // 1. Random head turn (existing behavior)

    if (time - headState.lastMoveTime > 3 + Math.random() * 4) {
      headState.tiltTarget = (Math.random() - 0.5) * 0.1;
      headState.turnTarget = (Math.random() - 0.5) * 0.15;
      headState.lastMoveTime = time;
    }

    const lerpSpeed = 1.5 * clampedDelta;
    headState.tiltCurrent += (headState.tiltTarget - headState.tiltCurrent) * lerpSpeed;
    headState.turnCurrent += (headState.turnTarget - headState.turnCurrent) * lerpSpeed;

    // 2. Nodding

    // Different cadence/amplitude depending on what the avatar is doing:
    //   - idle / listening: gentle nod every 4-8s, small amplitude
    //   - speaking: stronger nod every 3-5s, larger amplitude
    //   - thinking: no nodding (looks weird while "thinking")

    const isSpeaking = status === 'speaking';
    const isThinking = status === 'thinking';
    const nodAllowed = !isThinking;

    if (nodAllowed && !headState.isNodding && time >= headState.nodNextTime) {
      // Trigger a new nod
      headState.isNodding = true;
      headState.nodStartTime = time;
      headState.nodDuration = isSpeaking ? 0.8 + Math.random() * 0.4 : 0.6 + Math.random() * 0.3;
      headState.nodAmplitude = isSpeaking ? 0.08 + Math.random() * 0.04 : 0.04 + Math.random() * 0.02;
    }

    let nodOffset = 0;
    if (headState.isNodding) {
      const elapsed = time - headState.nodStartTime;
      if (elapsed >= headState.nodDuration) {
        headState.isNodding = false;
        // Schedule next nod
        headState.nodNextTime =
          time + (isSpeaking ? 3 + Math.random() * 2 : 4 + Math.random() * 4);
      } else {
        // Smooth single nod: sin curve from 0 - peak - 0 over the duration.
        // Multiply by 1 at the start, smoothly return to 0 at the end.
        const progress = elapsed / headState.nodDuration;
        // Use sin(π * progress) so it goes 0 - 1 - 0
        nodOffset = Math.sin(Math.PI * progress) * headState.nodAmplitude;
      }
    } else if (nodAllowed) {
      // Make sure nodNextTime is set if it wasn't (e.g. right after init)
      if (headState.nodNextTime < time) {
        headState.nodNextTime = time + (isSpeaking ? 3 + Math.random() * 2 : 4 + Math.random() * 4);
      }
    }

    // 3. Apply to head + neck

    // X rotation = pitch (nod up/down). Negative X tilts head down (nod).
    // Y rotation = yaw (turn left/right).
    // Z rotation = roll (tilt ear-to-shoulder).
    
    const head = getBone('head' as VRMHumanBoneName);
    if (head) {
      head.rotation.set(
        -nodOffset,                              //  pitch (nod)
        headState.turnCurrent,                   //  yaw (turn)
        headState.tiltCurrent,                    //  roll (tilt)
      );
    }

    // Neck follows head with reduced intensity
    const neck = getBone('neck' as VRMHumanBoneName);
    if (neck) {
      neck.rotation.set(
        -nodOffset * 0.3,                        //  pitch (nod, reduced)
        headState.turnCurrent * 0.2,             //  yaw (reduced)
        headState.tiltCurrent * 0.2,              //  roll (reduced)
      );
    }
  });
}
