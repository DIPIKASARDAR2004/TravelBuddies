"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import { useTripAssistant } from "@/hooks/useTripAssistant";
import { MAX_PROMPT_CHARS } from "@/lib/chat/contracts";

const QUICK_PROMPTS = [
  "Plan a weekend trip",
  "Find safer travel tips",
  "Explain protected booking",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, setInput, pending, error, send, cancel, clear } =
    useTripAssistant();
  const isLoading = pending !== null;
  const openerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const displayMessages = [
    {
      role: "assistant",
      content:
        "Hi, I'm the JourneyPilot trip assistant. Ask about destinations, itineraries or the booking prototype.",
    },
    ...messages,
    ...(pending ? [{ role: "user", content: pending }] : []),
  ];
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
    });
  }, [messages, isLoading, isOpen]);
  const close = () => {
    cancel();
    setIsOpen(false);
    openerRef.current?.focus();
  };

  return (
    <>
      <motion.button
        ref={openerRef}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "trip-assistant" : undefined}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] text-white shadow-2xl shadow-sky-900/25 transition-transform active:scale-95"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open trip assistant"
      >
        <FaRobot className="text-xl" />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="trip-assistant"
            role="dialog"
            aria-label="Trip assistant"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                close();
              }
            }}
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-24 right-6 z-[9999] flex h-[560px] max-h-[78vh] w-[calc(100vw-3rem)] max-w-[420px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_-40px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] p-5 text-white dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                    <FaRobot />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-sky-100">
                      JourneyPilot AI
                    </h3>
                    <p className="mt-1 text-sm text-white/85">
                      AI suggestions, not verified safety or booking status.
                    </p>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close trip assistant"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void send(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:text-sky-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div
              role="log"
              aria-label="Conversation"
              aria-live="polite"
              className="flex-1 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950"
            >
              <div className="flex flex-col gap-4">
                {displayMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                        message.role === "user"
                          ? "bg-slate-800 dark:bg-slate-700"
                          : "bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)]"
                      }`}
                    >
                      {message.role === "user" ? (
                        <span className="text-[10px] font-bold uppercase">
                          You
                        </span>
                      ) : (
                        <FaRobot size={12} />
                      )}
                    </div>
                    <div
                      className={`max-w-[82%] overflow-hidden rounded-2xl border p-3 text-sm shadow-sm ${
                        message.role === "user"
                          ? "rounded-tr-none border-sky-600 bg-sky-600 text-white"
                          : "rounded-tl-none border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed dark:prose-invert prose-pre:bg-slate-100 dark:prose-pre:bg-slate-950">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            skipHtml
                            disallowedElements={["img"]}
                            urlTransform={(url) =>
                              /^https?:\/\//i.test(url) ? url : ""
                            }
                            components={{
                              a: ({ children, href }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">
                          {message.content}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading ? (
                  <div
                    className="flex gap-3"
                    role="status"
                    aria-label="Assistant is replying"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white">
                      <FaRobot size={12} />
                    </div>
                    <div className="flex h-10 items-center gap-1.5 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500" />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-sky-500"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-sky-500"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                Messages are sent to Google. Avoid sensitive details. Recent
                turns only; this app does not save chat history. This is not an
                emergency service.
              </p>
              {error && (
                <p
                  role="alert"
                  className="mb-2 text-sm text-rose-600 dark:text-rose-300"
                >
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={clear}
                className="mb-2 text-xs underline"
              >
                Clear conversation
              </button>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  aria-label="Message to trip assistant"
                  maxLength={MAX_PROMPT_CHARS}
                  disabled={isLoading}
                  rows={1}
                  placeholder="Ask about destinations, itineraries, safety, or bookings..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
                <button
                  onClick={() => void send()}
                  disabled={isLoading || !input.trim()}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition-all ${
                    isLoading || !input.trim()
                      ? "cursor-not-allowed bg-slate-300 opacity-50 dark:bg-slate-700"
                      : "bg-sky-600 hover:scale-105 hover:bg-sky-700 active:scale-95"
                  }`}
                  aria-label="Send message"
                >
                  <FaPaperPlane className="ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
