import { useLayoutEffect } from 'react';
import { Box3, Vector3, type Object3D } from 'three';


/**
 * Normalises ANY model so it is always ~targetHeight units tall with feet at y=0.
 */
export function useAutoFit(object: Object3D, targetHeight = 1.6): void {
  useLayoutEffect(() => {
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    if (size.y <= 0) return;

    const scale = targetHeight / size.y;
    object.scale.setScalar(scale);
    object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  }, [object, targetHeight]);
}
