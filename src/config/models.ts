export interface ModelConfig {
  id: string;
  label: string;
  url: string;
  format: 'vrm' | 'fbx';
  // Rotation fix per model (in radians)
  // VRM typically needs [0, Math.PI, 0] to face camera
  // FBX from Blender often needs [-Math.PI/2, 0, 0] to stand up
  rotation?: [number, number, number];
}


export const MODELS: ModelConfig[] = [
  {
    id: 'ch03',
    label: 'Ch03 (FBX)',
    url: '/models/Ch03_nonPBR.fbx',
    format: 'fbx',
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    id: 'ch46',
    label: 'Ch46 (FBX)',
    url: '/models/Ch46_nonPBR.fbx',
    format: 'fbx',
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    id: 'claire',
    label: 'Claire (FBX)',
    url: '/models/claire.fbx',
    format: 'fbx',
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    id: 'cute-moth',
    label: 'Cute Moth (VRM)',
    url: '/models/CuteMoth.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'boy1',
    label: 'Boy 1 (VRM)',
    url: '/models/boy1.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'girl2',
    label: 'Girl 2 (VRM)',
    url: '/models/girl2.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'juanita',
    label: 'Juanita (VRM)',
    url: '/models/juanita.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'lady-fawn',
    label: 'Lady Fawn (VRM)',
    url: '/models/lady-fawn.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'lil-shark',
    label: 'Lil Shark (VRM)',
    url: '/models/LilShark.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'mushy',
    label: 'Mushy (VRM)',
    url: '/models/mushy.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
  {
    id: 'two-tails',
    label: 'Two Tails (VRM)',
    url: '/models/two-tails.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
  },
];
