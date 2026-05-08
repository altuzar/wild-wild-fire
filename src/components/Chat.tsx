"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { sendChat } from "@/lib/actions";

const QUICK_EMOJIS = [
  "🔥",
  "💀",
  "🤡",
  "😱",
  "😈",
  "🎉",
  "👏",
  "🤣",
  "🤯",
  "😭",
  "🫠",
  "🎯",
  "🐢",
  "👀",
  "😎",
  "💯",
];

const QUICK_PHRASES = [
  "GG! 🎉",
  "Nooo 😭",
  "Hehe 😈",
  "Burn! 🔥",
  "Lucky 🍀",
  "Skill 💯",
  "👀",
  "Take that!",
  "Mercy 🥺",
];

export function Chat({
  roomId,
  youId,
  messages,
  defaultOpen = false,
  position = "bottom-right",
}: {
  roomId: string;
  youId: string;
  messages: ChatMessage[];
  defaultOpen?: boolean;
  /**
   * "top-right" keeps the trigger out of a bottom hand bar.
   * The expanded panel still slides up from the bottom-right.
   */
  position?: "bottom-right" | "top-right";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<number>(messages.length);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (open) {
      lastSeenRef.current = messages.length;
      setUnread(0);
      // Scroll to bottom
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
      return () => clearTimeout(t);
    } else {
      const newCount = messages.length - lastSeenRef.current;
      if (newCount > 0) setUnread(newCount);
    }
  }, [messages, open]);

  const send = async (raw?: string) => {
    const value = (raw ?? text).trim();
    if (!value) return;
    setSending(true);
    try {
      await sendChat(roomId, youId, value);
      if (raw == null) setText("");
    } catch {
      // ignore
    }
    setSending(false);
  };

  const triggerPosCls =
    position === "top-right"
      ? "fixed top-2 right-2 z-40 sm:top-3 sm:right-3"
      : "fixed bottom-3 right-3 z-30 lg:bottom-4 lg:right-4";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`${triggerPosCls} flex items-center gap-2 rounded-full border border-flame-700/50 bg-ember-800/95 px-3 py-2 text-sm text-amber-100 shadow-lg backdrop-blur transition hover:scale-105`}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Chat</span>
        {unread > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-black">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-40 flex max-h-[70vh] w-[min(92vw,340px)] flex-col overflow-hidden rounded-2xl border border-flame-700/50 bg-ember-900/95 shadow-2xl backdrop-blur lg:bottom-4 lg:right-4 lg:w-[340px]">
      <div className="flex items-center justify-between border-b border-flame-800/40 px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-amber-100">
          <MessageCircle className="h-4 w-4 text-flame-500" />
          Chat
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full p-1 text-amber-200/60 hover:bg-amber-100/10 hover:text-amber-100"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-amber-200/40">
            Say hi 👋 or smack-talk 🔥
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.playerId === youId;
            return (
              <div
                key={m.id}
                className={`flex items-start gap-1.5 ${mine ? "flex-row-reverse" : ""}`}
              >
                <span className="mt-0.5 text-base leading-none">
                  {m.avatar ?? (m.isBot ? "🤖" : "👤")}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                    mine
                      ? "bg-flame-700/70 text-amber-50"
                      : m.isBot
                        ? "bg-sky-900/60 text-sky-100"
                        : "bg-ember-800/80 text-amber-100"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-70">
                    {m.isBot && <Bot className="h-2.5 w-2.5" />}
                    {m.playerName}
                  </div>
                  <div className="break-words text-sm">{m.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-flame-800/40 px-2 pb-2 pt-2">
        <div className="scrollbar-thin mb-2 flex gap-1 overflow-x-auto">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => send(e)}
              disabled={sending}
              className="shrink-0 rounded-lg bg-ember-800/70 px-2 py-1 text-base hover:bg-flame-700/40 active:scale-90"
              title={`Send ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="scrollbar-thin mb-2 flex gap-1 overflow-x-auto">
          {QUICK_PHRASES.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={sending}
              className="shrink-0 rounded-full border border-flame-800/40 bg-ember-800/40 px-2 py-0.5 text-[11px] text-amber-200/80 hover:border-flame-500 hover:text-amber-100"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 80))}
            placeholder="Type something fun…"
            className="flex-1 rounded-lg border border-flame-800/40 bg-ember-900/80 px-3 py-1.5 text-sm outline-none focus:border-flame-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-lg bg-flame-600 px-3 text-amber-50 hover:bg-flame-500"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
