export interface ModelConfig {
  id: string;
  label: string;
  url: string;
  format: 'vrm' | 'fbx' | 'glb';
  rotation?: [number, number, number];
  yOffset?: number;
  zoomAdjust?: number;
  voice: {
    language: string;
    voiceName: string;
  };
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
    voice: {
      language: 'en-US',
      voiceName: 'en-US-DavisNeural',
    },
  },
  {
    id: 'girl2',
    label: 'Girl 2 (VRM)',
    url: '/models/girl2.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 1.0,
    zoomAdjust: 0,
    voice: {
      language: 'en-US',
      voiceName: 'en-US-AriaNeural',
    },
  },
  {
    id: 'cute-moth',
    label: 'Cute Moth (VRM)',
    url: '/models/CuteMoth.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: -1.4,
    zoomAdjust: -0.3,
    voice: {
      language: 'en-US',
      voiceName: 'en-US-JennyNeural',
    },
  },
  {
    id: 'juanita',
    label: 'Juanita (VRM)',
    url: '/models/juanita.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: 0,
    zoomAdjust: -0.2,
    voice: {
      language: 'en-US',
      voiceName: 'en-US-AriaNeural',
    },
  },
  {
    id: 'lady-fawn',
    label: 'Lady Fawn (VRM)',
    url: '/models/lady-fawn.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: -0.7,
    zoomAdjust: 0.1,
    voice: {
      language: 'en-US',
      voiceName: 'en-US-MichelleNeural',
    },
  },
  {
    id: 'two-tails',
    label: 'Two Tails (VRM)',
    url: '/models/two-tails.vrm',
    format: 'vrm',
    rotation: [0, Math.PI, 0],
    yOffset: -0.2,
    zoomAdjust: -0.1,
    voice: {
      language: 'en-US',
      voiceName: 'en-US-DavisNeural',
    },
  },
  {
    id: 'labrador',
    label: 'Labrador (GLB)',
    url: '/models/labrador_dog.glb',
    format: 'glb',
    rotation: [0, 0, 0],
    yOffset: 0.2,
    zoomAdjust: -0.1,
    voice: {
      language: 'en-US',
      voiceName: 'en-US-DavisNeural',
    },
  },
];
