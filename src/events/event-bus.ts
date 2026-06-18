import { EventEmitter } from 'node:events';
import { logger } from '@/config/logger';
import type { DomainEventName, DomainEventPayloads } from '@/events/domain-events';

type EventHandler<E extends DomainEventName> = (
  payload: DomainEventPayloads[E]
) => void | Promise<unknown>;

/**
 * Type-safe in-process event bus over Node's `EventEmitter`.
 *
 * - `emit` is fire-and-forget: producers never wait on (or fail because of)
 *   listeners, so a notification hiccup can't break the originating operation.
 * - Each listener runs in its own try/catch — a throwing/ rejecting handler is
 *   logged, never crashes the process or affects sibling handlers.
 *
 * In-process only (single Node process). Swap for Redis/NATS pub-sub before
 * scaling out — same as the rate limiter + SSE hub caveats.
 */
class TypedEventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Many feature listeners may attach; lift the default 10-listener warning.
    this.emitter.setMaxListeners(100);
  }

  on<E extends DomainEventName>(event: E, handler: EventHandler<E>): void {
    this.emitter.on(event, (payload: DomainEventPayloads[E]) => {
      void (async () => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error('Event handler failed', {
            event,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
    });
  }

  emit<E extends DomainEventName>(event: E, payload: DomainEventPayloads[E]): void {
    this.emitter.emit(event, payload);
  }
}

export const eventBus = new TypedEventBus();
export type { EventHandler };
