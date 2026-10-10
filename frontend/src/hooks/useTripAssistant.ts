"use client";
import { useEffect, useRef, useState } from "react";
import {
  nextChatMessages,
  readChatReply,
  type ChatMessage,
} from "@/lib/chat/contracts";
import { requestJson } from "@/lib/client/requestJson";

export function useTripAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<{ controller: AbortController; prompt: string } | null>(
    null,
  );
  useEffect(
    () => () => {
      active.current?.controller.abort();
    },
    [],
  );
  const cancel = () => {
    const current = active.current;
    if (!current) return;
    active.current = null;
    current.controller.abort();
    setInput(current.prompt);
    setPending(null);
  };
  const clear = () => {
    cancel();
    setMessages([]);
    setInput("");
    setError(null);
  };
  const send = async (prompt = input) => {
    if (active.current || !prompt.trim()) return;
    const controller = new AbortController();
    const current = { controller, prompt: prompt.trim() };
    active.current = current;
    setPending(current.prompt);
    setInput("");
    setError(null);
    try {
      const conversation = nextChatMessages(messages, current.prompt);
      const reply = readChatReply(
        await requestJson("/api/chat", {
          method: "POST",
          body: JSON.stringify({ messages: conversation }),
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(25000),
          ]),
        }),
      );
      if (!controller.signal.aborted)
        setMessages([...conversation, { role: "assistant", content: reply }]);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setInput(current.prompt);
        setError(
          failure instanceof Error && failure.name === "TimeoutError"
            ? "The assistant took too long to respond. Please try again."
            : failure instanceof TypeError
              ? "The assistant could not be reached. Check your connection and try again."
              : failure instanceof Error
                ? failure.message
                : "The assistant could not reply. Please try again.",
        );
      }
    } finally {
      if (active.current === current) {
        active.current = null;
        setPending(null);
      }
    }
  };
  return { messages, input, setInput, pending, error, send, cancel, clear };
}
