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


export interface ModelConfigFile {
  models: ModelConfig[];
}

// Default config URL — can be overridden via env var.
// In dev: /models.json (served from /public)
// In prod: set VITE_MODELS_CONFIG_URL=https://your-cdn.com/models.json

export const MODELS_CONFIG_URL =
  import.meta.env.VITE_MODELS_CONFIG_URL ?? '/models.json';

/**
 * Validate and normalize a parsed JSON config object.
 * Throws if the structure is invalid; applies defaults for optional fields.
 */
export function validateModelConfig(raw: unknown): ModelConfig[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid models config: expected an object');
  }
  const file = raw as Partial<ModelConfigFile>;
  if (!Array.isArray(file.models)) {
    throw new Error('Invalid models config: "models" must be an array');
  }
  if (file.models.length === 0) {
    throw new Error('Invalid models config: "models" is empty');
  }

  return file.models.map((m, i) => {
    if (!m || typeof m !== 'object') {
      throw new Error(`Invalid model at index ${i}: expected an object`);
    }
    if (typeof m.id !== 'string' || !m.id) {
      throw new Error(`Invalid model at index ${i}: missing "id"`);
    }
    if (typeof m.label !== 'string') {
      throw new Error(`Invalid model "${m.id}": missing "label"`);
    }
    if (typeof m.url !== 'string' || !m.url) {
      throw new Error(`Invalid model "${m.id}": missing "url"`);
    }
    if (!['vrm', 'fbx', 'glb'].includes(m.format ?? '')) {
      throw new Error(
        `Invalid model "${m.id}": "format" must be 'vrm', 'fbx', or 'glb'`,
      );
    }
    if (!m.voice || typeof m.voice !== 'object') {
      throw new Error(`Invalid model "${m.id}": missing "voice"`);
    }
    if (typeof m.voice.language !== 'string' || typeof m.voice.voiceName !== 'string') {
      throw new Error(
        `Invalid model "${m.id}": "voice.language" and "voice.voiceName" must be strings`,
      );
    }

    return {
      id: m.id,
      label: m.label,
      url: m.url,
      format: m.format as 'vrm' | 'fbx' | 'glb',
      rotation: m.rotation,
      yOffset: m.yOffset,
      zoomAdjust: m.zoomAdjust,
      voice: {
        language: m.voice.language,
        voiceName: m.voice.voiceName,
      },
    };
  });
}