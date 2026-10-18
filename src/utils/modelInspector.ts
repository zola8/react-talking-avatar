import type { Object3D, Mesh } from 'three';


export function inspectModel(root: Object3D, label: string): void {
  console.group(`[Model Inspector] ${label}`);
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const morphs = mesh.morphTargetDictionary
      ? Object.keys(mesh.morphTargetDictionary).join(', ')
      : 'none';

    console.log(
      `Mesh: "${mesh.name}" | Materials: [${mats.map((m) => m?.name || 'unnamed').join(', ')}] | MorphTargets: ${morphs}`
    );
  });
  console.groupEnd();
}
