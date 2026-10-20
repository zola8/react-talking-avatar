export interface LLMResponse {
  text: string;
}

/**
 * Generate a mock response for the given user input.
 * Simulates a small "thinking" delay so the UI feels realistic.
 */
export async function generateMockResponse(userText: string): Promise<LLMResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    text: `I heard you say: "${userText}"`,
  };
}
