import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect } from 'react';


export function useArmRelaxation(vrm: VRM | undefined): void {
  useLayoutEffect(() => {
    if (!vrm?.humanoid) return;
    const getBone = (n: VRMHumanBoneName) => vrm.humanoid!.getNormalizedBoneNode(n);

    const ual = getBone('leftUpperArm');
    if (ual) ual.rotation.set(0, 0, 1.0);
    const uar = getBone('rightUpperArm');
    if (uar) uar.rotation.set(0, 0, -1.0);

    const lal = getBone('leftLowerArm');
    if (lal) lal.rotation.set(0, 0, 0.25);
    const lar = getBone('rightLowerArm');
    if (lar) lar.rotation.set(0, 0, -0.25);

    const lsh = getBone('leftShoulder');
    if (lsh) lsh.rotation.set(0, 0, 0.1);
    const rsh = getBone('rightShoulder');
    if (rsh) rsh.rotation.set(0, 0, -0.1);

    vrm.update(0);
    vrm.scene.updateMatrixWorld(true);
  }, [vrm]);

  useFrame((state) => {
    if (!vrm?.humanoid) return;
    const time = state.clock.elapsedTime;
    const getBone = (n: VRMHumanBoneName) => vrm.humanoid!.getNormalizedBoneNode(n);

    const swayL = Math.sin(time * 0.8) * 0.03;
    const swayR = Math.sin(time * 0.8) * -0.03;

    const ual = getBone('leftUpperArm');
    if (ual) ual.rotation.set(0, 0, 1.0 + swayL);
    const uar = getBone('rightUpperArm');
    if (uar) uar.rotation.set(0, 0, -1.0 + swayR);

    const lal = getBone('leftLowerArm');
    if (lal) lal.rotation.set(0, 0, 0.25);
    const lar = getBone('rightLowerArm');
    if (lar) lar.rotation.set(0, 0, -0.25);

    const lsh = getBone('leftShoulder');
    if (lsh) lsh.rotation.set(0, 0, 0.1);
    const rsh = getBone('rightShoulder');
    if (rsh) rsh.rotation.set(0, 0, -0.1);
  });
}
