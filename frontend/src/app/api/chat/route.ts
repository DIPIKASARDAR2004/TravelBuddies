import { NextResponse } from "next/server";
import { ChatInputError, readChatBody } from "@/lib/chat/contracts";
import { ChatServiceError, generateTravelReply } from "@/lib/chat/gemini";

// Remains public. Deployment rate limits/budgets are a separate release gate.
export async function POST(request: Request) {
  try {
    const messages = await readChatBody(request);
    const text = await generateTravelReply(messages, request.signal);
    return NextResponse.json(
      { text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status =
      error instanceof ChatInputError
        ? 400
        : error instanceof ChatServiceError
          ? error.status
          : 500;
    const message =
      error instanceof ChatInputError || error instanceof ChatServiceError
        ? error.message
        : "The assistant is temporarily unavailable.";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
