import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm';
import { useEffect, useRef } from 'react';
import { TextureLoader, SRGBColorSpace } from 'three';


interface AvatarModelProps {
  url: string;
  faceTextureUrl?: string | null;
}


export default function AvatarModel({ url, faceTextureUrl }: AvatarModelProps) {
  // 1. Load the GLTF file and register the VRM plugin
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  // 2. The VRM instance is safely attached to gltf.userData.vrm by the plugin
  const vrm = gltf.userData.vrm as VRM | undefined;
  const vrmRef = useRef<VRM | null>(null);

  useEffect(() => {
    if (vrm) {
      vrmRef.current = vrm;

      // VRM models face -Z by default. Rotate 180 degrees to face the camera.
      vrm.scene.rotation.y = Math.PI;

      // DEBUG: Print material names to console so we know what to target for the photo
      vrm.scene.traverse((object: any) => {
        if (object.isMesh && object.material) {
          console.log('Found 3D Material:', object.material.name || 'Unnamed');
        }
      });
    }

    // Cleanup function to prevent memory leaks on unmount
    return () => {
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene);
      }
    };
  }, [vrm]);

  // 3. Apply custom photo texture to the face if provided
  useEffect(() => {
    if (vrm && faceTextureUrl) {
      const texture = new TextureLoader().load(faceTextureUrl);
      texture.colorSpace = SRGBColorSpace; // Ensures colors look correct

      vrm.scene.traverse((object: any) => {
        if (object.isMesh && object.material) {
          const matName = (object.material.name || '').toLowerCase();
          // Target materials that are likely the face
          if (matName.includes('face') || matName.includes('skin')) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m: any) => {
                m.map = texture;
                m.needsUpdate = true;
              });
            } else {
              object.material.map = texture;
              object.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }, [vrm, faceTextureUrl]);

  // 4. Update the VRM model every frame (required for physics and blendshapes)
  useFrame((state, delta) => {
    if (vrmRef.current) {
      vrmRef.current.update(delta);
    }
  });

  if (!vrm) return null;

  // dispose={null} tells React Three Fiber that we handle cleanup manually in the useEffect
  return <primitive object={vrm.scene} dispose={null} />;
}
