import type { Material, Mesh, Object3D, Texture } from 'three';


export function disposeObject(root: Object3D): void {
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;

    mesh.geometry.dispose();

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m: Material | Material[] | null | undefined) => {
      if (!m) return;

      // Handle both single material and material array
      const materials = Array.isArray(m) ? m : [m];
      materials.forEach((mat) => {
        if (!mat) return;

        // Dispose of all texture maps
        const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'] as const;
        textureProps.forEach((prop) => {
          const texture = (mat as any)[prop] as Texture | undefined;
          if (texture) texture.dispose();
        });

        mat.dispose();
      });
    });
  });
}
