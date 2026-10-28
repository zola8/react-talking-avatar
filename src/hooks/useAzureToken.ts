import { useCallback, useEffect, useRef, useState } from 'react';

interface TokenState {
  token: string | null;
  region: string;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_REGION = 'westeurope';
const TOKEN_LIFETIME_MS = 10 * 60 * 1000;       // Azure tokens are valid for 10 min
const TOKEN_REFRESH_BUFFER_MS = 60_000;         // refresh 1 min before expiry
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export function useAzureToken() {
  const [state, setState] = useState<TokenState>({
    token: null,
    region: DEFAULT_REGION,
    isLoading: false,
    error: null,
  });
  const fetchingRef = useRef(false);

  const fetchToken = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const resp = await fetch(`${BACKEND_URL}/azure/token`, { method: 'POST' });
      if (!resp.ok) {
        throw new Error(`Token request failed: ${resp.status} ${resp.statusText}`);
      }
      const token = (await resp.text()).trim();
      if (!token) throw new Error('Empty token received');

      setState({
        token,
        region: DEFAULT_REGION,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('[useAzureToken] fetch failed:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message ?? 'Token fetch failed',
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Refresh 1 min before expiry (re-fetch every 9 minutes as a simple strategy)
  useEffect(() => {
    if (!state.token) return;
    const refreshMs = TOKEN_LIFETIME_MS - TOKEN_REFRESH_BUFFER_MS;
    const timer = setTimeout(() => fetchToken(), refreshMs);
    return () => clearTimeout(timer);
  }, [state.token, fetchToken]);

  return state;
}
