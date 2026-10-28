export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
}

// Default to localhost:8000 in dev. Override via env var in production.
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

/**
 * Generate a response from the backend LLM.
 *
 * Sends the full conversation history (so the LLM has context) and
 * returns the assistant's text response.
 */
export async function generateResponse(
  messages: ChatMessage[],
): Promise<ChatResponse> {
  const resp = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    throw new Error(`LLM request failed: ${resp.status}`);
  }

  const data = await resp.json();
  return { text: data.text };
}
