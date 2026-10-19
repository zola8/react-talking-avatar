import { useLayoutEffect } from 'react';
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';


const BONES_TO_RESET: VRMHumanBoneName[] = [
  'head', 'neck',
  'chest', 'spine', 'upperChest', 'hips',
  'leftUpperArm', 'rightUpperArm',
  'leftLowerArm', 'rightLowerArm',
  'leftShoulder', 'rightShoulder',
];

export function useResetToTPose(vrm: VRM | undefined): void {
  useLayoutEffect(() => {
    if (!vrm?.humanoid) return;

    BONES_TO_RESET.forEach((b) => {
      const node = vrm.humanoid!.getNormalizedBoneNode(b);
      if (node) {
        node.rotation.set(0, 0, 0);
        node.scale.set(1, 1, 1);
      }
    });

    vrm.update(0);
    vrm.scene.updateMatrixWorld(true);
  }, [vrm]);
}
