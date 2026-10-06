/**
 * J.A.R.V.I.S. MARK-V Server-Sent Events (SSE) Stream Manager
 * Streams live kernel events directly to frontend clients without polling.
 */

import { KernelEvent } from './types';

type SSEWriter = (chunk: string) => void;

export class EventStream {
  private static taskSubscribers = new Map<string, Set<SSEWriter>>();
  private static globalSubscribers = new Set<SSEWriter>();
  private static pingInterval: NodeJS.Timeout | null = null;

  static {
    // Start background SSE keep-alive ping (unref to allow clean process exit in tests)
    if (typeof setInterval !== 'undefined') {
      this.pingInterval = setInterval(() => {
        this.sendKeepAlive();
      }, 15000);
      if (this.pingInterval && typeof (this.pingInterval as any).unref === 'function') {
        (this.pingInterval as any).unref();
      }
    }
  }

  /**
   * Subscribe an SSE client to a specific task stream
   */
  public static subscribe(taskId: string, writer: SSEWriter): () => void {
    if (!this.taskSubscribers.has(taskId)) {
      this.taskSubscribers.set(taskId, new Set());
    }
    const subscribers = this.taskSubscribers.get(taskId)!;
    subscribers.add(writer);

    return () => {
      subscribers.delete(writer);
      if (subscribers.size === 0) {
        this.taskSubscribers.delete(taskId);
      }
    };
  }

  /**
   * Subscribe an SSE client to all global events (Cockpit view)
   */
  public static subscribeGlobal(writer: SSEWriter): () => void {
    this.globalSubscribers.add(writer);
    return () => {
      this.globalSubscribers.delete(writer);
    };
  }

  /**
   * Format and send an event as a compliant SSE message
   */
  public static formatSSEMessage(event: KernelEvent): string {
    return `id: ${event.id}\nevent: ${event.eventType}\ndata: ${JSON.stringify(event)}\n\n`;
  }

  public static formatSSE(event: KernelEvent): string {
    return this.formatSSEMessage(event);
  }

  /**
   * Broadcast an event to subscribers of a specific task
   */
  public static broadcastToTask(taskId: string, event: KernelEvent): void {
    const message = this.formatSSEMessage(event);

    // Send to task-specific subscribers
    const subscribers = this.taskSubscribers.get(taskId);
    if (subscribers) {
      for (const writer of subscribers) {
        try {
          writer(message);
        } catch {
          subscribers.delete(writer);
        }
      }
    }

    // Also send to global cockpit subscribers
    for (const writer of this.globalSubscribers) {
      try {
        writer(message);
      } catch {
        this.globalSubscribers.delete(writer);
      }
    }
  }

  /**
   * Send periodic keep-alive comments to prevent proxy timeouts
   */
  private static sendKeepAlive(): void {
    const ping = ': ping\n\n';
    for (const subscribers of this.taskSubscribers.values()) {
      for (const writer of subscribers) {
        try {
          writer(ping);
        } catch {
          subscribers.delete(writer);
        }
      }
    }
    for (const writer of this.globalSubscribers) {
      try {
        writer(ping);
      } catch {
        this.globalSubscribers.delete(writer);
      }
    }
  }
}
