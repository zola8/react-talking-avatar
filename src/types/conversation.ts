export type ConversationStatus =
  | 'idle'
  | 'listening'        // mic is recording
  | 'transcribing'     // sending audio to Azure STT
  | 'thinking'         // waiting for LLM
  | 'speaking'         // TTS playing, avatar lip-syncing
  | 'error';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}
