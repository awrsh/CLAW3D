"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { OfficeAgent } from "@/features/office/core/agents";
import { buildSpecializedReply } from "@/features/office/core/agentDialogue";

export type AgentChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestampMs: number;
};

type AgentChatPanelProps = {
  agent: OfficeAgent;
  messages: AgentChatMessage[];
  onSend: (text: string) => void;
  onAssistantMessage: (text: string) => void;
  onClose: () => void;
};

const formatTimestamp = (timestampMs: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestampMs));

const STATE_LABEL: Record<OfficeAgent["state"], string> = {
  idle: "آزاد",
  walking: "در حال راه رفتن",
  working: "در حال انجام",
  sitting: "منتظر",
  chatting: "در حال گفتگو",
};

const THINK_MS = 1100;
const TYPE_MS = 22;

/**
 * Espresso/amber chat shell with human-like think + typestream replies.
 */
export const AgentChatPanel = memo(function AgentChatPanel({
  agent,
  messages,
  onSend,
  onAssistantMessage,
  onClose,
}: AgentChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [streamText, setStreamText] = useState("");
  const feedRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  useEffect(() => {
    setDraft("");
    setBusy(false);
    setThinking(false);
    setStreamText("");
    clearTimers();
  }, [agent.id]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, agent.id, thinking, streamText]);

  const runReplyStream = (full: string) => {
    setThinking(true);
    setStreamText("");
    const thinkTimer = window.setTimeout(() => {
      setThinking(false);
      let index = 0;
      const tick = () => {
        index += 1;
        setStreamText(full.slice(0, index));
        if (index < full.length) {
          const ch = full[index - 1] ?? "";
          const delay =
            ch === " " || ch === "،" || ch === "." ? TYPE_MS * 2.2 : TYPE_MS;
          const id = window.setTimeout(tick, delay);
          timersRef.current.push(id);
        } else {
          onAssistantMessage(full);
          setStreamText("");
          setBusy(false);
        }
      };
      tick();
    }, THINK_MS + Math.random() * 700);
    timersRef.current.push(thinkTimer);
  };

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setDraft("");
    onSend(trimmed);
    const reply = buildSpecializedReply(agent, trimmed);
    runReplyStream(reply);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className="pointer-events-auto flex w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0e0a04] shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-500/70">
            Agent Chat
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: agent.color }}
            />
            <span className="truncate text-sm font-medium text-white">
              {agent.name}
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-white/40">
            {thinking
              ? "در حال فکر کردن…"
              : streamText
                ? "در حال نوشتن…"
                : `${STATE_LABEL[agent.state]} · نمونه محلی`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-amber-700/40 bg-[#1a140c] px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-amber-500/75 hover:border-amber-500/50 hover:text-amber-300"
        >
          Hide
        </button>
      </div>

      <div
        ref={feedRef}
        className="flex max-h-[min(360px,45vh)] min-h-[180px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3"
        dir="rtl"
      >
        {messages.length === 0 && !thinking && !streamText ? (
          <div className="rounded border border-dashed border-white/10 bg-black/20 px-3 py-3 text-center font-mono text-[11px] leading-5 text-white/35">
            به {agent.name} سلام کن — مثل یک همکار واقعی جواب می‌دهد.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[92%] rounded px-3 py-2 ${
                message.role === "user"
                  ? "mr-auto bg-cyan-500/15 text-cyan-50"
                  : message.role === "assistant"
                    ? "ml-auto bg-emerald-500/12 text-emerald-50"
                    : "bg-white/5 text-white/75"
              }`}
            >
              <div className="whitespace-pre-wrap break-words text-[13px] leading-6">
                {message.text}
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-white/35">
                {formatTimestamp(message.timestampMs)}
              </div>
            </div>
          ))
        )}

        {thinking ? (
          <div className="ml-auto max-w-[70%] rounded bg-violet-500/15 px-3 py-2 text-violet-100">
            <div className="flex items-center gap-2 text-[12px]">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300 [animation-delay:300ms]" />
              </span>
              {agent.name} داره فکر می‌کنه…
            </div>
          </div>
        ) : null}

        {streamText ? (
          <div className="ml-auto max-w-[92%] rounded bg-emerald-500/12 px-3 py-2 text-emerald-50">
            <div className="whitespace-pre-wrap break-words text-[13px] leading-6">
              {streamText}
              <span className="ms-0.5 inline-block h-3 w-0.5 animate-pulse bg-emerald-200/80 align-middle" />
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-white/10 px-3 py-3"
        dir="rtl"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          disabled={busy}
          placeholder={`پیام به ${agent.name}…`}
          className="w-full resize-none rounded border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-amber-50 outline-none placeholder:text-white/25 focus:border-amber-600/40 disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] text-white/30">
            Enter ارسال · Shift+Enter خط جدید
          </span>
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            className="rounded border border-amber-600/50 bg-amber-500/90 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#1a1008] disabled:opacity-35"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
});

/** Specialized local replies (role-aware) for the chat panel. */
export function buildMockAgentReply(
  agent: OfficeAgent,
  userText: string,
): string {
  return buildSpecializedReply(agent, userText);
}
