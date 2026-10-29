export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  userId: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  messageId: string;
  text: string;
}

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
