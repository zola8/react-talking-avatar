import { BACKEND_URL, CHAT_TIMEOUT_MS } from '../config/constants';
import { ChatError, type ChatErrorCode, type ChatStreamRequest } from '../types/chat';
import { getUserId } from '../utils/userIdentity';

const STREAM_ENDPOINT = '/chat/stream';
const USER_ID_HEADER = 'x-user-id';

/**
 * Send a chat message to the streaming endpoint.
 *
 * Returns the raw `Response` once the headers arrive. The body is an SSE
 * stream the caller consumes — parsing logic lands in the next step, once
 * the SSE event format is confirmed.
 *
 * Network errors, timeouts, and non-2xx HTTP statuses are mapped to a
 * `ChatError` so callers can switch on `code` for retry / messaging.
 *
 * @param request  the chat envelope (agentId / conversationId / clientMessageId / content)
 * @param signal   optional external abort signal (e.g. a "Cancel" button)
 */
export async function streamChat(
  request: ChatStreamRequest,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = createTimeoutController(CHAT_TIMEOUT_MS, signal);

  let response: Response;
  try {
    response = await fetch(buildStreamUrl(), {
      method: 'POST',
      headers: buildHeaders(),
      body: serializeBody(request),
      signal: controller.signal,
    });
  } catch (err) {
    throw mapFetchError(err);
  }

  if (!response.ok) {
    const message = await readErrorBody(response);
    throw new ChatError(
      message || `Chat request failed: ${response.status}`,
      mapStatusToCode(response.status),
      response.status,
    );
  }

  return response;
}

/** Full URL for the streaming endpoint. */
function buildStreamUrl(): string {
  return `${BACKEND_URL}${STREAM_ENDPOINT}`;
}

/**
 * Request headers. `x-user-id` carries the dummy auth identity; `Accept`
 * advertises SSE so proxies / servers negotiate the right content type.
 */
function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    [USER_ID_HEADER]: getUserId(),
  };
}

/** Serialize the request envelope to a JSON string. Kept separate so the
 * transport can be swapped without touching the fetch call. */
function serializeBody(request: ChatStreamRequest): string {
  return JSON.stringify(request);
}

/**
 * Build an AbortController that fires after `timeoutMs` AND propagates an
 * external signal. Whichever fires first wins; the timeout is cleared when
 * the controller aborts so we don't leak a timer after success.
 */
function createTimeoutController(timeoutMs: number, external?: AbortSignal): AbortController {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  return controller;
}

/** Map a thrown fetch error to a ChatError. Distinguishes timeout vs network. */
function mapFetchError(err: unknown): ChatError {
  if (err instanceof Error && err.name === 'AbortError') {
    return new ChatError('Chat request timed out', 'timeout');
  }
  return new ChatError(
    err instanceof Error ? err.message : 'Network error',
    'network',
  );
}

/** Map an HTTP status code to a coarse error code for client-side handling. */
function mapStatusToCode(status: number): ChatErrorCode {
  if (status === 400) return 'bad_request';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'unknown';
}

/** Best-effort read of an error response body. Never throws. */
async function readErrorBody(resp: Response): Promise<string> {
  try {
    const text = await resp.text();
    return text.trim();
  } catch {
    return '';
  }
}
