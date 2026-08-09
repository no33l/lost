"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/chat";
import { idleState } from "@/lib/action-state";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string; // ISO
  /** true, solange die eigene Nachricht optimistisch angezeigt wird. */
  pending?: boolean;
};

type ChatWindowProps = {
  conversationId: string;
  meId: string;
  meName: string;
  initialMessages: ChatMessage[];
};

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Heute";
  if (date.toDateString() === yesterday.toDateString()) return "Gestern";
  return formatDate(date);
}

export function ChatWindow({ conversationId, meId, meName, initialMessages }: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(() => sortMessages(initialMessages));
  const [draft, setDraft] = useState("");
  const [state, formAction, isPending] = useActionState(sendMessage, idleState);

  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstScroll = useRef(true);
  const lastOptimistic = useRef<{ id: string; body: string } | null>(null);

  /** Nachricht anhängen; Duplikate per id filtern, eigenes SSE-Echo ersetzt die optimistische Bubble. */
  const addMessage = useCallback(
    (incoming: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        if (incoming.senderId === meId) {
          const index = prev.findIndex((m) => m.pending && m.body === incoming.body);
          if (index !== -1) {
            const next = [...prev];
            next[index] = incoming;
            return sortMessages(next);
          }
        }
        return sortMessages([...prev, incoming]);
      });
    },
    [meId]
  );

  // Echtzeit: SSE-Verbindung mit Reconnect-Backoff; bei Fokus einmal frisch laden.
  useEffect(() => {
    let source: EventSource | null = null;
    let retryDelay = 1000;
    let retryTimer: number | undefined;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      source = new EventSource(`/api/chats/${conversationId}/stream`);
      source.onopen = () => {
        retryDelay = 1000;
      };
      source.onmessage = (event) => {
        try {
          addMessage(JSON.parse(event.data) as ChatMessage);
        } catch {
          // Kaputtes Event ignorieren - der nächste Refresh holt den Stand nach.
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (stopped) return;
        retryTimer = window.setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15_000);
      };
    };
    connect();

    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      stopped = true;
      source?.close();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, [conversationId, addMessage, router]);

  // Nach router.refresh() neue Server-Nachrichten in den lokalen Stand mischen.
  useEffect(() => {
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = initialMessages.filter((m) => !known.has(m.id));
      return fresh.length === 0 ? prev : sortMessages([...prev, ...fresh]);
    });
  }, [initialMessages]);

  // Ergebnis der Send-Action: Fehler → optimistische Bubble zurücknehmen.
  useEffect(() => {
    const optimistic = lastOptimistic.current;
    if (!optimistic) return;
    if (state.status === "error") {
      lastOptimistic.current = null;
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft((current) => (current.trim().length > 0 ? current : optimistic.body));
    } else if (state.status === "success") {
      lastOptimistic.current = null;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, pending: false } : m))
      );
    }
  }, [state]);

  // Auto-Scroll ans Ende, sobald Nachrichten dazukommen.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: firstScroll.current ? "auto" : "smooth" });
    firstScroll.current = false;
  }, [messages.length]);

  const submit = (formData: FormData) => {
    const body = String(formData.get("body") ?? "").trim();
    if (body.length === 0 || isPending) return;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    lastOptimistic.current = { id: tempId, body };
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: meId,
        senderName: meName,
        body,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    setDraft("");
    formAction(formData);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-paper-soft/60">
      <div
        ref={listRef}
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="max-w-xs text-sm leading-relaxed text-ink-faint">
              Noch keine Nachrichten. Schreib, was dich beschäftigt - so ehrlich, wie du magst.
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const newDay =
                !previous ||
                new Date(previous.createdAt).toDateString() !==
                  new Date(message.createdAt).toDateString();
              const mine = message.senderId === meId;
              return (
                <li key={message.id} className="flex flex-col">
                  {newDay && (
                    <div className="my-3 flex items-center gap-3">
                      <span className="h-px flex-1 bg-line" aria-hidden />
                      <span className="text-xs font-medium text-ink-faint">
                        {dayLabel(message.createdAt)}
                      </span>
                      <span className="h-px flex-1 bg-line" aria-hidden />
                    </div>
                  )}
                  <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words sm:max-w-[75%]",
                        mine
                          ? "rounded-br-md bg-coral-soft text-ink"
                          : "rounded-bl-md border border-line bg-card text-ink",
                        message.pending && "opacity-70"
                      )}
                    >
                      {message.body}
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-ink-faint">
                      {message.pending ? "wird gesendet …" : formatTime(message.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="border-t border-line bg-card p-3 sm:p-4">
        {state.status === "error" && (
          <p role="alert" className="mb-2 text-sm text-danger">
            {state.message}
          </p>
        )}
        <form ref={formRef} action={submit} className="flex items-end gap-2">
          <input type="hidden" name="conversationId" value={conversationId} />
          <label htmlFor="chat-body" className="sr-only">
            Nachricht
          </label>
          <textarea
            id="chat-body"
            name="body"
            rows={1}
            required
            maxLength={4000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Schreib eine Nachricht …"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-paper px-4 py-2.5 text-sm leading-relaxed text-ink transition-colors placeholder:text-ink-faint focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/15"
          />
          <Button
            type="submit"
            size="md"
            disabled={isPending || draft.trim().length === 0}
            aria-label="Nachricht senden"
            className="shrink-0 px-4"
          >
            <Send className="size-4.5" aria-hidden />
          </Button>
        </form>
        <p className="mt-2 text-[11px] text-ink-faint">
          Enter sendet, Shift + Enter macht einen Zeilenumbruch.
        </p>
      </div>
    </div>
  );
}
