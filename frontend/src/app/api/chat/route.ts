import { GoogleGenerativeAI } from "@google/generative-ai";
import { getErrorMessage } from "@/lib/utils/errorUtils";

interface ChatMessage {
  role: "user" | "assistant" | "model" | string;
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = body.messages || [];

    if (!messages.length) {
      return new Response(JSON.stringify({ error: "At least one message is required." }), { status: 400 });
    }

    if (!process.env.AI_CHATBOT_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured in .env.local" }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.AI_CHATBOT_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash",
      systemInstruction: "You are JourneyPilot, an AI travel assistant for the app TravelBuddies. You MUST ONLY answer questions strictly related to travel, trip planning, itineraries, destinations, the TravelBuddies escrow system, and bookings. If a user asks about ANYTHING unrelated to travel (e.g., anatomy, general knowledge, math, coding, personal advice, etc.), you MUST politely decline and explicitly state that you can only assist with travel-related queries."
    });

    // Format history for Gemini API
    // Gemini chat format requires history to be { role: "user" | "model", parts: [{ text: "..." }] }
    const history = messages.slice(0, -1).map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.content }]
    }));

    // Gemini requires the first message in history to be from 'user'
    while (history.length > 0 && history[0].role === "model") {
      history.shift();
    }

    const chat = model.startChat({
      history,
    });

    const latestMessage = messages[messages.length - 1]?.content || "";
    const result = await chat.sendMessage(latestMessage);
    const responseText = result.response.text();

    return new Response(JSON.stringify({ text: responseText }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: getErrorMessage(error, "Failed to process chat") }), { status: 500 });
  }
}
