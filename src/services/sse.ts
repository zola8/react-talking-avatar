import { ChatError, type ChatStreamEvent } from '../types/chat';

export interface RawSSEEvent {
  event: string;
  data: string;
}

export async function* parseChatStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  for await (const raw of parseSSEStream(response, signal)) {
    const typed = mapChatEvent(raw);
    if (typed) yield typed;
  }
}


export async function* parseSSEStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<RawSSEEvent> {
  if (!response.body) {
    throw new ChatError('Stream has no body', 'parse');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n'); // normalise CRLF → LF once per chunk

      // SSE events are separated by a blank line (`\n\n`).
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseEventBlock(rawEvent);
        if (parsed) yield parsed;
      }
    }

    // Flush any trailing event not followed by a blank line.
    if (buffer.trim()) {
      const parsed = parseEventBlock(buffer);
      if (parsed) yield parsed;
    }
  } catch (err) {
    // If the abort signal fired mid-read, swallow the resulting error.
    if (signal?.aborted) return;
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/** Parse one event block (text between two blank lines) into a RawSSEEvent. */
function parseEventBlock(raw: string): RawSSEEvent | null {
  let event = 'message'; // SSE default when `event:` is omitted
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) continue; // blank or comment

    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const payload = line.slice(5);
      dataLines.push(payload.startsWith(' ') ? payload.slice(1) : payload);
    }
    // `id:` and `retry:` are intentionally ignored — we don't use them.
  }

  // Skip keep-alive blanks: no data AND no explicit event name.
  if (dataLines.length === 0 && event === 'message') return null;

  return { event, data: dataLines.join('\n') };
}

/**
 * Map a raw SSE event to a typed `ChatStreamEvent`. Returns null for unknown
 * event names so the caller can skip them without breaking the stream.
 */
function mapChatEvent(raw: RawSSEEvent): ChatStreamEvent | null {
  const payload = raw.data ? tryParseJSON(raw.data) : {};

  switch (raw.event) {
    case 'meta':
      return { type: 'meta', conversationId: String(payload.conversation_id ?? '') };
    case 'delta':
      return { type: 'delta', content: String(payload.content ?? '') };
    case 'final':
      return { type: 'final', content: String(payload.content ?? '') };
    case 'done':
      return { type: 'done' };
    case 'error':
      return { type: 'error', message: String(payload.message ?? raw.data ?? 'Stream error') };
    default:
      console.error('ERROR: unknown event', raw.event)
      return null;
  }
}

function tryParseJSON(text: string): Record<string, unknown> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
