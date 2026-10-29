export type ModelFormat = 'vrm' | 'fbx' | 'glb';


export interface ModelConfig {
  id: string;
  label: string;
  url: string;
  format: ModelFormat;
  rotation?: [number, number, number];
  yOffset?: number;
  zoomAdjust?: number;
  voice: {
    language: string;
    voiceName: string;
  };
}


export interface ModelConfigFile {
  models: ModelConfig[];
}
