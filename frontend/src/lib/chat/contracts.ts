export type ChatMessage = { role: "user" | "assistant"; content: string };
export const MAX_PROMPT_CHARS = 4000;
export const MAX_REPLY_CHARS = 8000;
export const MAX_CHAT_MESSAGES = 21;
export const MAX_CHAT_CHARS = 32000;
export class ChatInputError extends Error {}

export function readChatMessages(value: unknown): ChatMessage[] {
  const fail = () =>
    new ChatInputError(
      "Send a valid, bounded conversation ending with a user message.",
    );
  if (!value || typeof value !== "object" || Array.isArray(value)) throw fail();
  const input = (value as { messages?: unknown }).messages;
  if (
    !Array.isArray(input) ||
    !input.length ||
    input.length > MAX_CHAT_MESSAGES + 1
  )
    throw fail();
  const messages = input.map((entry): ChatMessage => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw fail();
    const { role, content } = entry as Record<string, unknown>;
    if (
      typeof role !== "string" ||
      !["user", "assistant", "model"].includes(role) ||
      typeof content !== "string"
    )
      throw fail();
    const text = content.trim();
    if (
      !text ||
      text.length > (role === "user" ? MAX_PROMPT_CHARS : MAX_REPLY_CHARS)
    )
      throw fail();
    return { role: role === "user" ? "user" : "assistant", content: text };
  });
  // Accept the previous browser's opening greeting, never as provider policy.
  if (messages[0].role === "assistant") messages.shift();
  if (
    !messages.length ||
    messages.length > MAX_CHAT_MESSAGES ||
    messages.at(-1)?.role !== "user" ||
    messages.some(
      (entry, index) => entry.role !== (index % 2 === 0 ? "user" : "assistant"),
    ) ||
    messages.reduce((sum, entry) => sum + entry.content.length, 0) >
      MAX_CHAT_CHARS
  )
    throw fail();
  return messages;
}

/** Keep recent complete turns, never a history starting with an answer. */
export function nextChatMessages(
  history: ChatMessage[],
  prompt: string,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: prompt.trim() },
  ];
  while (
    messages.length > 1 &&
    (messages.length > MAX_CHAT_MESSAGES ||
      messages.reduce((sum, message) => sum + message.content.length, 0) >
        MAX_CHAT_CHARS)
  )
    messages.splice(0, 2);
  return readChatMessages({ messages });
}

export function readChatReply(value: unknown): string {
  const text =
    value && typeof value === "object"
      ? (value as { text?: unknown }).text
      : undefined;
  if (typeof text !== "string" || !text.trim() || text.length > MAX_REPLY_CHARS)
    throw new Error(
      "The assistant returned an invalid reply. Please try again.",
    );
  return text.trim();
}

/** Bound actual bytes, not only a client-controlled Content-Length header. */
export async function readChatBody(request: Request): Promise<ChatMessage[]> {
  if (!request.body) throw new ChatInputError("A conversation is required.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 131072) {
        await reader.cancel();
        throw new ChatInputError(
          "The conversation is too large. Start a new chat.",
        );
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return readChatMessages(JSON.parse(text));
  } catch (error) {
    if (error instanceof ChatInputError) throw error;
    throw new ChatInputError("Request body must be valid chat JSON.");
  } finally {
    reader.releaseLock();
  }
}
