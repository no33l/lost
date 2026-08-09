import { EventEmitter } from "node:events";

// In-Memory-Pub/Sub für Server-Sent Events. Über globalThis gecacht, damit
// Hot-Reload im Dev-Modus keine verwaisten Emitter hinterlässt.
// Single-Instance-Ansatz - bei horizontaler Skalierung durch Redis Pub/Sub ersetzen.

export type ChatMessageEvent = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string; // ISO
};

const bus: EventEmitter = ((globalThis as Record<string, unknown>).__lostChatBus ??= (() => {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);
  return emitter;
})()) as EventEmitter;

export function publishMessage(event: ChatMessageEvent): void {
  bus.emit(`conversation:${event.conversationId}`, event);
}

export function subscribeToConversation(
  conversationId: string,
  listener: (event: ChatMessageEvent) => void
): () => void {
  const channel = `conversation:${conversationId}`;
  bus.on(channel, listener);
  return () => bus.off(channel, listener);
}
