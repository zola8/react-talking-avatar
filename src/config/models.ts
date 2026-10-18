export interface ModelConfig {
  id: string;
  label: string;
  url: string;
  format: 'vrm' | 'fbx';
  // Rotation fix per model (in radians)
  rotation?: [number, number, number];
  // Vertical offset to adjust model position
  yOffset?: number;
  // Camera zoom adjustment (positive = zoom in, negative = zoom out)
  zoomAdjust?: number;
}


export const MODELS: ModelConfig[] = [
  {
    id: 'boy1',
    label: 'Boy 1 (VRM)',
    url: '/models/boy1.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.05,
    zoomAdjust: 0,
  },
  {
    id: 'girl2',
    label: 'Girl 2 (VRM)',
    url: '/models/girl2.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.05,
    zoomAdjust: 0,
  },
  {
    id: 'cute-moth',
    label: 'Cute Moth (VRM)',
    url: '/models/CuteMoth.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.1,
    zoomAdjust: -0.3,
  },
  {
    id: 'juanita',
    label: 'Juanita (VRM)',
    url: '/models/juanita.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.05,
    zoomAdjust: 0.2,
  },
  {
    id: 'lady-fawn',
    label: 'Lady Fawn (VRM)',
    url: '/models/lady-fawn.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.05,
    zoomAdjust: 0,
  },
  {
    id: 'lil-shark',
    label: 'Lil Shark (VRM)',
    url: '/models/LilShark.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.1,
    zoomAdjust: 0.3,
  },
  {
    id: 'two-tails',
    label: 'Two Tails (VRM)',
    url: '/models/two-tails.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0.1,
    zoomAdjust: 0.3,
  },
];
