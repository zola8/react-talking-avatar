export type AgentId = string;

export type ConversationId = string;

export type ClientMessageId = string;

export interface ChatStreamRequest {
  agentId: AgentId;
  conversationId: ConversationId;
  clientMessageId: ClientMessageId;
  content: string;
}

export type UserId = string;

export type ChatErrorCode =
  | 'network'
  | 'timeout'
  | 'bad_request'
  | 'unauthorized'
  | 'rate_limited'
  | 'server_error'
  | 'parse'
  | 'unknown';

export class ChatError extends Error {
  readonly code: ChatErrorCode;
  readonly status?: number;

  constructor(message: string, code: ChatErrorCode, status?: number) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.status = status;
  }
}


/**
 * Typed SSE event yielded by `parseChatStream`. Each variant corresponds to
 * one `event:` name emitted by `POST /chat/stream`.
 *
 *   meta    conversation metadata (conversation_id)
 *   delta   incremental content chunk
 *   final   the complete assembled content
 *   done    stream completed cleanly (empty data)
 *   error   stream-level error surfaced by the backend mid-stream
 */
export type ChatStreamEvent =
  | { type: 'meta'; conversationId: ConversationId }
  | { type: 'delta'; content: string }
  | { type: 'final'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
