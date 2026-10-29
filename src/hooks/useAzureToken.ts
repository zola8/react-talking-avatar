import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AZURE_TOKEN_PATH,
  AZURE_TOKEN_TIMEOUT_MS,
  BACKEND_URL,
} from '../config/constants';

interface TokenState {
  token: string | null;
  region: string;
  isLoading: boolean;
  error: string | null;
}

interface TokenResponse {
  token: string;
  region: string;
}

async function readErrorDetail(resp: Response): Promise<string> {
  try {
    const text = await resp.text();
    if (!text) return `Token request failed: ${resp.status}`;
    try {
      const data = JSON.parse(text);
      if (data && typeof data.detail === 'string') return data.detail;
    } catch {
      // body wasn't JSON — return raw text below
    }
    return text.trim();
  } catch {
    return `Token request failed: ${resp.status}`;
  }
}

function parseTokenResponse(data: unknown): TokenResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid token response: expected an object');
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.token !== 'string' || !obj.token) {
    throw new Error('Invalid token response: missing "token"');
  }
  if (typeof obj.region !== 'string' || !obj.region) {
    throw new Error('Invalid token response: missing "region"');
  }
  return { token: obj.token, region: obj.region };
}

export function useAzureToken() {
  const [state, setState] = useState<TokenState>({
    token: null,
    region: '',
    isLoading: true,
    error: null,
  });
  const fetchingRef = useRef(false);

  const fetchToken = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AZURE_TOKEN_TIMEOUT_MS);

    try {
      const resp = await fetch(`${BACKEND_URL}${AZURE_TOKEN_PATH}`, {
        method: 'POST',
        signal: controller.signal,
      });
      if (!resp.ok) {
        const detail = await readErrorDetail(resp);
        throw new Error(detail);
      }

      let data: unknown;
      try {
        data = await resp.json();
      } catch {
        throw new Error('Failed to parse token response JSON');
      }

      const { token, region } = parseTokenResponse(data);

      setState({
        token,
        region,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      console.error('[useAzureToken] fetch failed:', err);
      const message =
        err instanceof Error
          ? (err.name === 'AbortError'
            ? 'Token request timed out'
            : err.message)
          : 'Token fetch failed';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    } finally {
      clearTimeout(timeoutId);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return state;
}
