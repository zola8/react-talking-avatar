import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm';

interface ArmRestPoses {
  upperArmLeft?: { x: number; y: number; z: number };
  upperArmRight?: { x: number; y: number; z: number };
  lowerArmLeft?: { x: number; y: number; z: number };
  lowerArmRight?: { x: number; y: number; z: number };
}

export function useArmRelaxation(vrm: VRM | undefined): void {
  const restPosesRef = useRef<ArmRestPoses>({});

  useEffect(() => {
    if (!vrm?.humanoid) return;

    const getBone = (name: VRMHumanBoneName) => vrm.humanoid?.getNormalizedBoneNode(name);

    const upperArmLeft = getBone('leftUpperArm' as VRMHumanBoneName);
    const upperArmRight = getBone('rightUpperArm' as VRMHumanBoneName);
    const lowerArmLeft = getBone('leftLowerArm' as VRMHumanBoneName);
    const lowerArmRight = getBone('rightLowerArm' as VRMHumanBoneName);

    if (upperArmLeft) {
      restPosesRef.current.upperArmLeft = {
        x: upperArmLeft.rotation.x,
        y: upperArmLeft.rotation.y,
        z: upperArmLeft.rotation.z,
      };
    }
    if (upperArmRight) {
      restPosesRef.current.upperArmRight = {
        x: upperArmRight.rotation.x,
        y: upperArmRight.rotation.y,
        z: upperArmRight.rotation.z,
      };
    }
    if (lowerArmLeft) {
      restPosesRef.current.lowerArmLeft = {
        x: lowerArmLeft.rotation.x,
        y: lowerArmLeft.rotation.y,
        z: lowerArmLeft.rotation.z,
      };
    }
    if (lowerArmRight) {
      restPosesRef.current.lowerArmRight = {
        x: lowerArmRight.rotation.x,
        y: lowerArmRight.rotation.y,
        z: lowerArmRight.rotation.z,
      };
    }
  }, [vrm]);

  useFrame((state) => {
    if (!vrm?.humanoid) return;

    const time = state.clock.elapsedTime;
    const restPoses = restPosesRef.current;
    const getBone = (name: VRMHumanBoneName) => vrm.humanoid?.getNormalizedBoneNode(name);

    // Left upper arm - rotate down from T-pose
    if (restPoses.upperArmLeft) {
      const upperArmLeft = getBone('leftUpperArm' as VRMHumanBoneName);
      if (upperArmLeft) {
        // Add rotation to bring arm down (positive Z rotates arm down for left side)
        const relaxZ = 1.3; // ~75 degrees down from horizontal
        const sway = Math.sin(time * 0.8) * 0.03;
        upperArmLeft.rotation.set(
          restPoses.upperArmLeft.x,
          restPoses.upperArmLeft.y,
          restPoses.upperArmLeft.z + relaxZ + sway
        );
      }
    }

    // Right upper arm - rotate down from T-pose
    if (restPoses.upperArmRight) {
      const upperArmRight = getBone('rightUpperArm' as VRMHumanBoneName);
      if (upperArmRight) {
        // Add rotation to bring arm down (negative Z rotates arm down for right side)
        const relaxZ = -1.3; // ~75 degrees down from horizontal
        const sway = Math.sin(time * 0.8) * -0.03;
        upperArmRight.rotation.set(
          restPoses.upperArmRight.x,
          restPoses.upperArmRight.y,
          restPoses.upperArmRight.z + relaxZ + sway
        );
      }
    }

    // Left lower arm - bend elbow
    if (restPoses.lowerArmLeft) {
      const lowerArmLeft = getBone('leftLowerArm' as VRMHumanBoneName);
      if (lowerArmLeft) {
        // Bend elbow (rotate around X axis for most models)
        lowerArmLeft.rotation.set(
          restPoses.lowerArmLeft.x - 0.4, // Bend elbow
          restPoses.lowerArmLeft.y,
          restPoses.lowerArmLeft.z
        );
      }
    }

    // Right lower arm - bend elbow
    if (restPoses.lowerArmRight) {
      const lowerArmRight = getBone('rightLowerArm' as VRMHumanBoneName);
      if (lowerArmRight) {
        // Bend elbow (rotate around X axis for most models)
        lowerArmRight.rotation.set(
          restPoses.lowerArmRight.x - 0.4, // Bend elbow
          restPoses.lowerArmRight.y,
          restPoses.lowerArmRight.z
        );
      }
    }
  });
}
