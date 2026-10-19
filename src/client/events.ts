import { CHANNELS, DEFAULT_TOPIC } from "../shared.ts";

export interface EventAddress {
  channel: string;
  topic: string;
}

export interface MeshEvent<Payload = unknown> extends EventAddress {
  payload: Payload;
}

export type EventListener<Payload = unknown> = (event: MeshEvent<Payload>) => void;

/** Browsers log through `reportError` and fire the window "error" event. */
function report(error: unknown): void {
  if (typeof globalThis.reportError === "function") globalThis.reportError(error);
  else console.error(error);
}

const key = (address: EventAddress): string => `${address.channel}\u0000${address.topic}`;

/** Publish/subscribe between the views on a page, keyed by channel and topic. */
export class EventBus {
  readonly #listeners = new Map<string, Set<EventListener>>();
  readonly #latest = new Map<string, unknown>();

  /** Delivers to every listener on the address. One failing listener does not stop the others. */
  publish<Payload>(event: MeshEvent<Payload>): MeshEvent<Payload> {
    const id = key(event);
    this.#latest.set(id, event.payload);
    for (const listener of [...(this.#listeners.get(id) ?? [])]) {
      try {
        listener(event);
      } catch (error) {
        report(error);
      }
    }
    return event;
  }

  /** Returns a function that removes the listener. */
  subscribe<Payload>(address: EventAddress, listener: EventListener<Payload>): () => void {
    const id = key(address);
    const listeners = this.#listeners.get(id) ?? new Set();
    listeners.add(listener as EventListener);
    this.#listeners.set(id, listeners);
    return () => {
      listeners.delete(listener as EventListener);
    };
  }

  /** The most recent payload published on the address, for views that mount late. */
  peek<Payload>(address: EventAddress): Payload | undefined {
    return this.#latest.get(key(address)) as Payload | undefined;
  }
}

const GLOBAL = Symbol.for("minimesh.events");
type Holder = { [GLOBAL]?: EventBus };

/**
 * The page-wide bus. Every island bundles its own copy of this runtime, so the instance lives on
 * `globalThis` where all copies find the same one.
 */
export const events: EventBus = (() => {
  const holder = globalThis as Holder;
  holder[GLOBAL] ??= new EventBus();
  return holder[GLOBAL];
})();

/** Sends to every view on the page. */
export function toAll<Payload>(
  payload: Payload,
  topic: string = DEFAULT_TOPIC,
): MeshEvent<Payload> {
  return events.publish({ channel: CHANNELS.all, topic, payload });
}

/** Sends to every face, not to the mesh. */
export function toFaces<Payload>(
  payload: Payload,
  topic: string = DEFAULT_TOPIC,
): MeshEvent<Payload> {
  return events.publish({ channel: CHANNELS.faces, topic, payload });
}

/** Sends to the mesh, the page itself. */
export function toMesh<Payload>(
  payload: Payload,
  topic: string = DEFAULT_TOPIC,
): MeshEvent<Payload> {
  return events.publish({ channel: CHANNELS.mesh, topic, payload });
}

/**
 * Listens on all three channels from code that is not a view, such as a widget outside any face.
 * Returns a function that stops listening.
 */
export function onMessage<Payload>(
  listener: EventListener<Payload>,
  topic: string = DEFAULT_TOPIC,
): () => void {
  const offs = Object.values(CHANNELS).map((channel) =>
    events.subscribe({ channel, topic }, listener),
  );
  return () => {
    for (const off of offs) off();
  };
}
