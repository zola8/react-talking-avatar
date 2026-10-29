import type { ModelConfig, ModelConfigFile, ModelFormat } from '../types/models';


const VALID_FORMATS = new Set<string>(['vrm', 'fbx', 'glb']);


function validateModelEntry(
  m: Partial<ModelConfig> | undefined,
  index: number,
): ModelConfig {
  if (!m || typeof m !== 'object') {
    throw new Error(`Invalid model at index ${index}: expected an object`);
  }
  if (typeof m.id !== 'string' || !m.id) {
    throw new Error(`Invalid model at index ${index}: missing "id"`);
  }
  if (typeof m.label !== 'string') {
    throw new Error(`Invalid model "${m.id}": missing "label"`);
  }
  if (typeof m.url !== 'string' || !m.url) {
    throw new Error(`Invalid model "${m.id}": missing "url"`);
  }
  if (!VALID_FORMATS.has(m.format ?? '')) {
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
    format: m.format as ModelFormat,
    rotation: m.rotation,
    yOffset: m.yOffset,
    zoomAdjust: m.zoomAdjust,
    voice: {
      language: m.voice.language,
      voiceName: m.voice.voiceName,
    },
  };
}

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

  return file.models.map(validateModelEntry);
}
