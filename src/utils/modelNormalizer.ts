import { useLayoutEffect } from 'react';
import { Box3, Vector3, type Object3D } from 'three';
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';

// Bones that define the model's silhouette. Sampling their world positions
// gives us a bbox that reflects the POSED skeleton (relaxed arms, head tilt,
// etc.), not the bind-pose bbox stored in the geometry (which always reflects
// the original T/A-pose and can be much larger for models with raised arms,
// wings, hair, etc.).
const BBOX_BONES: VRMHumanBoneName[] = [
  'head', 'neck', 'chest', 'spine', 'upperChest', 'hips',
  'leftUpperArm', 'rightUpperArm',
  'leftLowerArm', 'rightLowerArm',
  'leftHand', 'rightHand',
  'leftShoulder', 'rightShoulder',
  'leftUpperLeg', 'rightUpperLeg',
  'leftLowerLeg', 'rightLowerLeg',
  'leftFoot', 'rightFoot',
];

function computePosedBbox(vrm: VRM, padding = 0.15): Box3 {
  const bbox = new Box3();
  const tmp = new Vector3();
  BBOX_BONES.forEach((name) => {
    const bone = vrm.humanoid.getNormalizedBoneNode(name);
    if (bone) {
      bone.getWorldPosition(tmp);
      bbox.expandByPoint(tmp);
    }
  });
  // Pad to account for mesh surface, hair, clothes extending past bones
  bbox.expandByScalar(padding);
  return bbox;
}

export function useAutoFit(object: Object3D, targetHeight = 1.6, vrm?: VRM): void {
  useLayoutEffect(() => {
    // Reset any scale/position from previous mount — useLoader caches by URL,
    // so we may receive an already-scaled scene on refresh.
    object.scale.setScalar(1);
    object.position.set(0, 0, 0);
    object.updateMatrixWorld(true);

    let box: Box3;
    if (vrm?.humanoid) {
      // VRM: use posed skeleton bbox (reflects relaxed pose, accessories, etc.)
      box = computePosedBbox(vrm);
    } else {
      // Non-VRM (GLB): use geometry bbox
      box = new Box3().setFromObject(object);
    }

    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    if (size.y <= 0) return;

    const scale = targetHeight / size.y;
    object.scale.setScalar(scale);
    object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    console.log('[AutoFit] posed size:', size.toArray());
    console.log('[AutoFit] scale:', scale, 'position:', object.position.toArray());
  }, [object, targetHeight, vrm]);
}
