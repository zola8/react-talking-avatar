import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import type { VRMHumanBoneName } from '@pixiv/three-vrm';


export function useArmRelaxation(vrm: VRM | undefined): void {
  const readyRef = useRef(false);

  useEffect(() => {
    if (!vrm?.humanoid) return;

    const bones: VRMHumanBoneName[] = [
      'leftUpperArm', 'rightUpperArm',
      'leftLowerArm', 'rightLowerArm',
      'leftShoulder', 'rightShoulder',
    ];
    bones.forEach((b) => {
      const node = vrm.humanoid!.getNormalizedBoneNode(b);
      if (node) node.rotation.set(0, 0, 0);
    });

    readyRef.current = true;
  }, [vrm]);

  useFrame((state) => {
    if (!vrm?.humanoid || !readyRef.current) return;

    const time = state.clock.elapsedTime;
    const getBone = (n: VRMHumanBoneName) => vrm.humanoid!.getNormalizedBoneNode(n);

    const swayL = Math.sin(time * 0.8) * 0.03;
    const swayR = Math.sin(time * 0.8) * -0.03;

    // Upper arms — lifted 10% more (1.1 → 1.0)
    const ual = getBone('leftUpperArm');
    if (ual) ual.rotation.set(0, 0, 1.0 + swayL);
    const uar = getBone('rightUpperArm');
    if (uar) uar.rotation.set(0, 0, -1.0 + swayR);

    // Lower arms (elbows)
    const lal = getBone('leftLowerArm');
    if (lal) lal.rotation.set(0, 0, 0.25);
    const lar = getBone('rightLowerArm');
    if (lar) lar.rotation.set(0, 0, -0.25);

    // Shoulders — keep as-is
    const lsh = getBone('leftShoulder');
    if (lsh) lsh.rotation.set(0, 0, 0.1);
    const rsh = getBone('rightShoulder');
    if (rsh) rsh.rotation.set(0, 0, -0.1);
  });
}
