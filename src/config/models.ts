export interface ModelConfig {
  id: string;
  label: string;
  url: string;
  format: 'vrm' | 'fbx' | 'glb';
  rotation?: [number, number, number];
  yOffset?: number;
  zoomAdjust?: number;
}


export const MODELS: ModelConfig[] = [
  {
    id: 'boy1',
    label: 'Boy 1 (VRM)',
    url: '/models/boy1.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 1.0,
    zoomAdjust: 0,
  },
  {
    id: 'girl2',
    label: 'Girl 2 (VRM)',
    url: '/models/girl2.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 1.0,
    zoomAdjust: 0,
  },
  {
    id: 'cute-moth',
    label: 'Cute Moth (VRM)',
    url: '/models/CuteMoth.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: -0.4,
    zoomAdjust: -0.3,
  },
  {
    id: 'juanita',
    label: 'Juanita (VRM)',
    url: '/models/juanita.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0,
    zoomAdjust: -0.2,
  },
  {
    id: 'lady-fawn',
    label: 'Lady Fawn (VRM)',
    url: '/models/lady-fawn.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: -0.7,
    zoomAdjust: 0.1,
  },
  {
    id: 'two-tails',
    label: 'Two Tails (VRM)',
    url: '/models/two-tails.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: -0.8,
    zoomAdjust: -0.1,
  },
  {
    id: 'labrador',
    label: 'Labrador (GLB)',
    url: '/models/labrador_dog.glb',
    format: 'glb',
    rotation: [0, 0, 0],
    yOffset: 0.2,
    zoomAdjust: -0.1,
  },
];
