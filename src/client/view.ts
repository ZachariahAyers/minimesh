import { ATTR, CHANNELS, DEFAULT_TOPIC, type PublicData, type ViewContext } from "../shared.ts";
import {
  type EventAddress,
  type EventListener,
  events,
  type MeshEvent,
  toAll,
  toFaces,
  toMesh,
} from "./events.ts";

/** Browser-side code for one rendered face or mesh. Subclass it and pass the class to `defineView`. */
export class MeshView<Data extends PublicData = PublicData> {
  readonly root: HTMLElement;
  readonly context: ViewContext<Data>;
  readonly #subscriptions: Array<() => void> = [];

  constructor(root: HTMLElement, context: ViewContext<Data>) {
    this.root = root;
    this.context = context;
  }

  /** Called once the view is attached to its element. */
  onMount(): void {}

  /** Called for every message on the channels this view joined. */
  onMessage(_event: MeshEvent): void {}

  toAll<Payload>(payload: Payload, topic: string = DEFAULT_TOPIC): MeshEvent<Payload> {
    return toAll(payload, topic);
  }

  toFaces<Payload>(payload: Payload, topic: string = DEFAULT_TOPIC): MeshEvent<Payload> {
    return toFaces(payload, topic);
  }

  toMesh<Payload>(payload: Payload, topic: string = DEFAULT_TOPIC): MeshEvent<Payload> {
    return toMesh(payload, topic);
  }

  /** Subscribes until `destroy` is called. */
  subscribe<Payload>(address: EventAddress, listener: EventListener<Payload>): void {
    this.#subscriptions.push(events.subscribe(address, listener));
  }

  /** Fetches from the server that rendered this view. */
  api(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${this.context.baseUrl}${path}`, init);
  }

  /** Leaves every channel. */
  destroy(): void {
    for (const unsubscribe of this.#subscriptions.splice(0)) unsubscribe();
  }
}

export type MeshViewClass<Data extends PublicData = PublicData> = new (
  root: HTMLElement,
  context: ViewContext<Data>,
) => MeshView<Data>;

const mounted = new WeakSet<Element>();

/**
 * Attaches `View` to every element the server rendered for `face`/`view` and returns the new
 * instances. Elements that already have a view are skipped, so calling it again is safe.
 */
export function defineView<Data extends PublicData>(
  face: string,
  view: string,
  View: MeshViewClass<Data>,
): MeshView<Data>[] {
  const selector = `[${ATTR.face}="${CSS.escape(face)}"][${ATTR.view}="${CSS.escape(view)}"]`;
  const instances: MeshView<Data>[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    if (mounted.has(element)) continue;
    const script = element.querySelector<HTMLScriptElement>(`:scope > script[${ATTR.context}]`);
    if (script === null) continue;
    const context = JSON.parse(script.textContent ?? "{}") as ViewContext<Data>;
    script.remove();
    mounted.add(element);

    const instance = new View(element, context);
    const onMessage = (event: MeshEvent) => instance.onMessage(event);
    const own = context.mesh ? CHANNELS.mesh : CHANNELS.faces;
    for (const channel of [CHANNELS.all, own]) {
      instance.subscribe({ channel, topic: DEFAULT_TOPIC }, onMessage);
    }
    if (context.dev) logMount(context);
    instance.onMount();
    instances.push(instance);
  }
  return instances;
}

/** Faces nested deeper than this slow pages down; dev mode warns about it. */
const NEST_WARNING_LEVEL = 2;

function logMount(context: ViewContext): void {
  const kind = context.mesh ? "mesh" : "face";
  console.groupCollapsed(`minimesh ${kind} ${context.face}/${context.view}`);
  console.info(context);
  if (context.nestLevel >= NEST_WARNING_LEVEL) {
    console.warn(
      `Nested ${context.nestLevel} levels deep. Each level adds a render on the server.`,
    );
  }
  console.groupEnd();
}
