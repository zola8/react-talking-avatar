import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm';


export interface BonePose {
  x: number;
  y: number;
  z: number;
}

export interface ScalePose {
  x: number;
  y: number;
  z: number;
}

export interface RestPoses {
  head?: BonePose;
  neck?: BonePose;
  hips?: BonePose;
  spine?: BonePose;
  chest?: ScalePose;
  upperArmLeft?: BonePose;
  upperArmRight?: BonePose;
  lowerArmLeft?: BonePose;
  lowerArmRight?: BonePose;
}

export function captureRestPoses(vrm: VRM): RestPoses {
  const poses: RestPoses = {};

  if (!vrm.humanoid) return poses;

  const getBone = (name: VRMHumanBoneName) => vrm.humanoid?.getNormalizedBoneNode(name);

  const head = getBone('head' as VRMHumanBoneName);
  const neck = getBone('neck' as VRMHumanBoneName);
  const hips = getBone('hips' as VRMHumanBoneName);
  const spine = getBone('spine' as VRMHumanBoneName);
  const chest = getBone('chest' as VRMHumanBoneName);
  const upperArmLeft = getBone('leftUpperArm' as VRMHumanBoneName);
  const upperArmRight = getBone('rightUpperArm' as VRMHumanBoneName);
  const lowerArmLeft = getBone('leftLowerArm' as VRMHumanBoneName);
  const lowerArmRight = getBone('rightLowerArm' as VRMHumanBoneName);

  if (head) poses.head = { x: head.rotation.x, y: head.rotation.y, z: head.rotation.z };
  if (neck) poses.neck = { x: neck.rotation.x, y: neck.rotation.y, z: neck.rotation.z };
  if (hips) poses.hips = { x: hips.rotation.x, y: hips.rotation.y, z: hips.rotation.z };
  if (spine) poses.spine = { x: spine.rotation.x, y: spine.rotation.y, z: spine.rotation.z };
  if (chest) poses.chest = { x: chest.scale.x, y: chest.scale.y, z: chest.scale.z };
  if (upperArmLeft) poses.upperArmLeft = { x: upperArmLeft.rotation.x, y: upperArmLeft.rotation.y, z: upperArmLeft.rotation.z };
  if (upperArmRight) poses.upperArmRight = { x: upperArmRight.rotation.x, y: upperArmRight.rotation.y, z: upperArmRight.rotation.z };
  if (lowerArmLeft) poses.lowerArmLeft = { x: lowerArmLeft.rotation.x, y: lowerArmLeft.rotation.y, z: lowerArmLeft.rotation.z };
  if (lowerArmRight) poses.lowerArmRight = { x: lowerArmRight.rotation.x, y: lowerArmRight.rotation.y, z: lowerArmRight.rotation.z };

  return poses;
}
