export const MODELS_CONFIG_URL =
  import.meta.env.VITE_MODELS_CONFIG_URL ?? '/models.json';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export const CHAT_TIMEOUT_MS = 30_000;

export const DUMMY_USER_ID = 'demo-user-1';

export const AZURE_TOKEN_PATH = '/azure/token';
export const AZURE_TOKEN_TIMEOUT_MS = 10_000;

export const DEFAULT_ROTATION: [number, number, number] = [0, 0, 0];
export const DEFAULT_Y_OFFSET = 0;

export const DEFAULT_MODEL_HEIGHT = 1.6;
export const MIN_MODEL_HEIGHT = 0.2;

export function computeTargetHeight(zoomAdjust: number | undefined): number {
  const adjust = zoomAdjust ?? 0;
  return Math.max(MIN_MODEL_HEIGHT, DEFAULT_MODEL_HEIGHT * (1 + adjust));
}

export const CAMERA_DEFAULTS = {
  y: 1.2,
  z: 3.5,
  fov: 35,
  lookAtY: 1.2,
};

export const LIGHT_DEFAULTS = {
  ambientIntensity: 0.7,
  directional: {
    position: [5, 8, 5] as [number, number, number],
    intensity: 1.2,
  },
};

export const ORBIT_CONTROLS_DEFAULTS = {
  panSpeed: 0.5,
  minDistance: 1.5,
  maxDistance: 8,
  minPolarAngle: 0.2,
  maxPolarAngle: Math.PI / 2 + 0.1,
};
