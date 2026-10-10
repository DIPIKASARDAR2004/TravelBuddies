import "server-only";
import { readChatReply, type ChatMessage } from "./contracts";

const MODEL = "gemini-3.6-flash";
const INSTRUCTIONS = `You are JourneyPilot, a travel-planning assistant for TravelBuddies.
Answer travel, destination, itinerary and prototype booking questions; politely decline unrelated requests.
Do not claim access to the user's account, current location, live inventory, verified safety, prices or booking status. You have no tools and cannot book, pay, refund, contact anyone, dispatch help or change records.
Protected booking is a test-mode prototype, not guaranteed escrow, a bank payout or an emergency service. Direct users to the actual booking screen for status and policy. Do not invent app capabilities or promise safety/refunds.
Travel advice can be wrong or outdated. For immediate danger, advise contacting local emergency services directly; do not imply this chat sends help. Do not request passwords, payment details or precise personal locations.`;

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function providerText(value: unknown) {
  const invalid = () =>
    new ChatServiceError(
      "The assistant could not provide a complete reply. Please try again.",
      502,
    );
  if (!value || typeof value !== "object") throw invalid();
  const { candidates, promptFeedback } = value as {
    candidates?: unknown;
    promptFeedback?: { blockReason?: unknown };
  };
  if (
    promptFeedback?.blockReason ||
    !Array.isArray(candidates) ||
    !candidates.length
  )
    throw invalid();
  const candidate = candidates[0];
  if (
    !candidate ||
    candidate.finishReason !== "STOP" ||
    candidate.content?.role !== "model" ||
    !Array.isArray(candidate.content.parts)
  )
    throw invalid();
  const parts: string[] = [];
  for (const part of candidate.content.parts) {
    if (!part || typeof part !== "object") throw invalid();
    if (part.thought === true) continue;
    if (typeof part.text !== "string") throw invalid();
    parts.push(part.text);
  }
  try {
    return readChatReply({ text: parts.join("") });
  } catch {
    throw invalid();
  }
}

/** One concrete text-generation call; no SDK sessions, tools or stored chat. */
export async function generateTravelReply(
  messages: ChatMessage[],
  signal: AbortSignal,
): Promise<string> {
  const key = process.env.AI_CHATBOT_API_KEY?.trim();
  if (!key)
    throw new ChatServiceError(
      "The trip assistant is not configured. Please try again later.",
      503,
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.any([signal, controller.signal]),
        cache: "no-store",
        redirect: "error",
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
          contents: messages.map((message) => ({
            role: message.role === "user" ? "user" : "model",
            parts: [{ text: message.content }],
          })),
          generationConfig: { maxOutputTokens: 2048 },
        }),
      },
    );
    if (response.status === 429)
      throw new ChatServiceError(
        "The assistant is busy. Please wait before trying again.",
        429,
      );
    if (!response.ok)
      throw new ChatServiceError(
        "The assistant is temporarily unavailable. Please try again later.",
        503,
      );
    return providerText(await response.json());
  } catch (error) {
    if (signal.aborted)
      throw new ChatServiceError("The chat request was cancelled.", 408);
    if (controller.signal.aborted)
      throw new ChatServiceError(
        "The assistant took too long to respond. Please try again.",
        504,
      );
    if (error instanceof ChatServiceError) throw error;
    throw new ChatServiceError(
      "The assistant is temporarily unavailable. Please try again later.",
      503,
    );
  } finally {
    clearTimeout(timer);
  }
}
