"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/providers/auth-provider";
import { Sparkles, X, Send, Loader2 } from "lucide-react";

const QUICK_PROMPTS = [
  "How am I doing today?",
  "What should I eat for dinner?",
  "How do I create a meal?",
  "Suggest a high-protein snack",
];

const HIDDEN_PATHS = ["/auth", "/onboarding"];

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function NuriChat() {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/assistant/chat" }),
    [],
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  if (
    authLoading ||
    !user ||
    HIDDEN_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return null;
  }

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    sendMessage({ text: trimmed });
  }

  return (
    <>
      {/* ── Floating bubble ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="nuri-bubble"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50
                       w-14 h-14 rounded-full bg-primary text-primary-foreground
                       shadow-lg shadow-primary/30 hover:bg-primary/90
                       flex items-center justify-center
                       active:scale-95 transition-colors cursor-pointer"
            aria-label="Open Nuri AI assistant"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              key="nuri-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm sm:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden
            />

            {/* Panel */}
            <motion.div
              key="nuri-panel"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed z-50 flex flex-col bg-card border border-border shadow-2xl
                         bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl
                         sm:bottom-6 sm:right-6 sm:left-auto sm:w-[400px] sm:max-h-[600px] sm:rounded-2xl"
              role="dialog"
              aria-modal
              aria-label="Nuri AI assistant"
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground leading-none">
                      Nuri
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Your nutrition assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full
                             bg-muted text-muted-foreground hover:text-foreground
                             transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Messages ── */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              >
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Hi there!
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5 max-w-[260px] mx-auto">
                      I can help with nutrition advice, your daily tracking, or
                      how to use the app.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSend(prompt)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium
                                     bg-muted text-muted-foreground hover:bg-muted/80
                                     hover:text-foreground transition-colors cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const text = getMessageText(
                    message.parts as Array<{ type: string; text?: string }>,
                  );
                  if (!text) return null;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          text
                        )}
                      </div>
                    </div>
                  );
                })}

                {isBusy &&
                  messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* ── Input ── */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2 px-4 py-3 border-t border-border flex-shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Nuri anything…"
                  autoComplete="off"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-background
                             text-sm text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isBusy}
                  className="w-10 h-10 flex items-center justify-center rounded-xl
                             bg-primary text-primary-foreground hover:bg-primary/90
                             disabled:opacity-40 disabled:pointer-events-none
                             transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Send message"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
