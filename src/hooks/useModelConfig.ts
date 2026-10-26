import { useEffect, useState } from 'react';
import {
  type ModelConfig,
  MODELS_CONFIG_URL,
  validateModelConfig,
} from '../config/models';

interface UseModelConfigState {
  models: ModelConfig[];
  isLoading: boolean;
  error: string | null;
}

let cachedModels: ModelConfig[] | null = null;
let cachedUrl: string | null = null;

export function useModelConfig(): UseModelConfigState & {
  reload: () => Promise<void>;
} {
  const [models, setModels] = useState<ModelConfig[]>(cachedModels ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedModels);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(MODELS_CONFIG_URL, { cache: 'no-cache' });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const json = await resp.json();
      const validated = validateModelConfig(json);
      cachedModels = validated;
      cachedUrl = MODELS_CONFIG_URL;
      setModels(validated);
    } catch (err: any) {
      console.error('[useModelConfig] Failed to load:', err);
      setError(err?.message ?? 'Failed to load models config');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip fetch if we already have data for this URL
    if (cachedModels && cachedUrl === MODELS_CONFIG_URL) {
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { models, isLoading, error, reload: load };
}
