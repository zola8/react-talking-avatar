import { BACKEND_URL, CHAT_TIMEOUT_MS } from '../config/constants';
import {
  ChatError,
  type ChatErrorCode,
  type ChatRequest,
  type ChatResponse,
} from '../types/chat';


export async function generateResponse(
  request: ChatRequest,
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ChatError('Chat request timed out', 'timeout');
    }
    throw new ChatError(
      err instanceof Error ? err.message : 'Network error',
      'network',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) {
    const body = await safeReadBody(resp);
    throw new ChatError(
      body || `Chat request failed: ${resp.status}`,
      mapStatusToCode(resp.status),
      resp.status,
    );
  }

  let data: unknown;
  try {
    data = await resp.json();
  } catch {
    throw new ChatError('Failed to parse response JSON', 'parse');
  }

  return parseChatResponse(data);
}

function mapStatusToCode(status: number): ChatErrorCode {
  if (status === 400) return 'bad_request';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'unknown';
}

async function safeReadBody(resp: Response): Promise<string> {
  try {
    const text = await resp.text();
    return text.trim() || '';
  } catch {
    return '';
  }
}

function parseChatResponse(data: unknown): ChatResponse {
  if (!data || typeof data !== 'object') {
    throw new ChatError('Invalid response: expected an object', 'parse');
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.text !== 'string' || !obj.text) {
    throw new ChatError('Invalid response: missing "text"', 'parse');
  }

  return {
    messageId:
      typeof obj.messageId === 'string' ? obj.messageId : crypto.randomUUID(),
    text: obj.text,
  };
}
