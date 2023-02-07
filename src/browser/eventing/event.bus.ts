import type { EventEmitter } from "events";
import type { IEventSink } from "./event.sink";
import type { EventAddress } from "./event.address";
import type { MeshEvent } from "./mesh.event";
import { serializeAddress, serializeEventAddress } from "./seralize.address";
import { getEventManager } from "./event.manager";
import { CONSTANTS } from "../../constants/mesh.constants";

/**
 * MiniMesh View Event Adapter
 * @author Zach Ayers*/
export interface ViewEventAdapter {
  /**
   * Send an event to the global channel and topic for 'FACES'.
   * @description - Only the top level Mesh will receive this message.
   * @param {Payload} payload - The payload to send with the event.
   * @param {string} topic - The topic to send the event to.
   * @return {MeshEvent<Response>} - The event that was sent.
   * @todo Should the events return a response? If so, should this be a global level map where responses are stored?
   * @author Zach Ayers
   */
  toFaces<Payload, Response>(
    payload: Payload,
    topic?: string
  ): MeshEvent<Response>;

  /**
   * Send an event to the global channel and topic for 'MESHES'.
   * @description - Only the top level Mesh will receive this message.
   * @param {Payload} payload - The payload to send with the event.
   * @param {string} topic - The topic to send the event to.
   * @return {MeshEvent<Response>} - The event that was sent.
   * @author Zach Ayers
   */
  toMesh<Payload, Response>(
    payload: Payload,
    topic?: string
  ): MeshEvent<Response>;

  /**
   * Send an event to the global channel and topic.
   * @description - ALL Meshes and Faces will receive this message.
   * @param {Payload} payload - The payload to send.
   * @param {string} topic - The topic to send the payload to.
   * @return {MeshEvent<Response>} - Any response from the event listeners.
   * @todo Should the events return a response? If so, should this be a global level map where responses are stored?
   * @author Zach Ayers
   */
  toAll<Payload, Response>(
    payload: Payload,
    topic?: string
  ): MeshEvent<Response>;
}

/**
 * Event Listener declaration for us by the EventManager / EventEmitter to register / un-register events.
 * @category (Eventing)
 * @author Zach Ayers
 * @internal
 * @example
 * ```typescript
 * // Initialize the eventBus
 * const eventBus = new EventBus();
 *
 * // Create an eventing address.
 * const address: EventAddress = { channel: 'my-channel', topic: 'my-topic' };
 *
 * // Create an anonymous event listener function
 * const eventListener: EventListener<number> = (payload => console.log(payload));
 *
 * // Subscribe to the address and use the predefined listener.
 * eventBus.subscribe(address, eventListener);
 *
 * ...
 *
 * // Upon some removal logic, you may also unregister the listener
 * eventBus.unsubscribe(address, eventListener);
 * ```
 */
export type EventListener<P = unknown> = (MeshEvent: MeshEvent<P>) => void;

/**
 * Event Bus
 * @description An Event bus makes use of an EventSink, EvenEmitter, and EventQueue to pass events using the global window object.
 * @description Event addresses may be published or subscribed to - to pass payloads between front end services.
 * @category (Eventing)
 * @author Zach Ayers
 * @author Zach Ayers
 * @public
 */
export interface IEventBus extends ViewEventAdapter {
  /**
   * Emits browser side events and exists as a singleton emitter on the Event Manager object.
   */
  eventEmitter: EventEmitter;

  /**
   * Source of truth for creating and managing the EventQueue.
   */
  eventSink: IEventSink;

  /**
   * View the next (newest) item in a channel:topic associated queue
   * @author Zach Ayers
   * @example
   *
   * ```typescript
   * // Create a new event sink that intakes a generic type of string.
   * const eventBus = new EventBus<string>();
   *
   * // Create an event.
   * const event: MeshEvent = { channel: 'my-channel', topic: 'my-topic', payload: 'my-payload' };
   *
   * // Add an event to the queue
   * eventBus.publish(event);
   *
   * // View the first item in the associated queue
   * const firstItem = eventBus.peek({ channel: event.channel, topic: event.topic });
   * ```
   */
  peek<P>(address: EventAddress): P | undefined;

  /**
   * Add a new item to the channel:topic associated queue
   * @description New event payloads will be added to the end of the queue.
   * @author Zach Ayers
   * @returns {Event} The published event.
   * @example
   *
   * ```typescript
   * // Create a new event sink that intakes a generic type of string.
   * const eventBus = new EventBus<string>();
   *
   * // Create an event.
   * const event: MeshEvent = { channel: 'my-channel', topic: 'my-topic', payload: 'my-payload' };
   *
   * // Add an event to the queue
   * eventBus.publish(event));
   * ```
   */
  publish<P, R>(event: MeshEvent<P>): MeshEvent<R>;

  /**
   * Subscribe to an EventAddress
   * and perform an action when a payload is received on that channel:topic.
   * @author Zach Ayers
   * @returns {void}
   * @example
   *
   * ```typescript
   * // Initialize the eventBus
   * const eventBus = new EventBus();
   *
   * // Create an eventing address.
   * const address: EventAddress = { channel: 'my-channel', topic: 'my-topic' };
   *
   * // Create an anonymous event listener function
   * const eventListener: EventListener<number> = (payload => console.log(payload));
   *
   * // Subscribe to the address and use the predefined listener.
   * eventBus.subscribe(address, eventListener);
   *
   * // Upon some removal logic, you may also unregister the listener
   * eventBus.unsubscribe(address, eventListener);
   * ```
   */
  subscribe<P>(address: EventAddress, listener: EventListener<P>): void;

  /**
   * Unsubscribe from an EventAddress
   * @author Zach Ayers
   * @returns {void}
   * @example
   *
   * ```typescript
   * // Initialize the eventBus
   * const eventBus = new EventBus();
   *
   * // Create an eventing address.
   * const address: EventAddress = { channel: 'my-channel', topic: 'my-topic' };
   *
   * // Create an anonymous event listener function
   * const eventListener: EventListener<number> = (payload => console.log(payload));
   *
   * // Subscribe to the address and use the predefined listener.
   * eventBus.subscribe(address, eventListener);
   *
   * ...
   *
   * // Upon some removal logic, you may also unregister the listener
   * eventBus.unsubscribe(address, eventListener);
   * ```
   */
  unsubscribe(address: EventAddress, listener: EventListener): void;
}

/**
 * @see IEventBus
 * @public
 * @category (Eventing)
 */
export class EventBus implements IEventBus {
  public eventEmitter: EventEmitter;
  public eventSink: IEventSink;

  /** @inheritDoc */
  public peek<P>(address: EventAddress): P | undefined {
    return this.eventSink.peek(address);
  }

  /** @inheritDoc */
  public publish<P, R>(event: MeshEvent<P>): MeshEvent<R> {
    this.eventEmitter.emit(serializeEventAddress(event), event);
    this.eventSink.push(event);
    return event as unknown as MeshEvent<R>;
  }

  /** @inheritDoc */
  public toAll<P, R>(payload: P): MeshEvent<R> {
    return this.publish({
      channel: CONSTANTS.eventingGlobalChannel,
      topic: CONSTANTS.eventingGlobalTopic,
      payload,
    });
  }

  /** @inheritDoc */
  public toFaces<P, R>(payload: P): MeshEvent<R> {
    return this.publish({
      channel: CONSTANTS.eventingGlobalFaceChannel,
      topic: CONSTANTS.eventingGlobalTopic,
      payload,
    });
  }

  /** @inheritDoc */
  public toMesh<P, R>(payload: P): MeshEvent<R> {
    return this.publish({
      channel: CONSTANTS.eventingGlobalMeshChannel,
      topic: CONSTANTS.eventingGlobalTopic,
      payload,
    });
  }

  /** @inheritDoc */
  public subscribe<P>(address: EventAddress, listener: EventListener<P>): void {
    this.eventEmitter.on(serializeAddress(address), listener);
  }

  /** @inheritDoc */
  public unsubscribe(address: EventAddress, listener: EventListener): void {
    this.eventEmitter.off(serializeAddress(address), listener);
  }

  /**
   * EventBus Constructor
   * Initializing an event bus will ensure there is an EventManager on the global window object.
   * Once an EventManager is created, the EventSink and EventEmitter will be referenced by this class.
   */
  constructor() {
    const { eventEmitter, eventSink } = getEventManager();
    this.eventEmitter = eventEmitter;
    this.eventSink = eventSink;
  }
}

/** @inheritDoc */
function publish<P, R>(address: EventAddress, payload: P): MeshEvent<R> {
  const eventManager = getEventManager();
  const event = { ...address, payload };
  eventManager.eventEmitter.emit(serializeEventAddress(event), event);
  eventManager.eventSink.push(event);
  return event as unknown as MeshEvent<R>;
}

/** @inheritDoc */
function subscribe<P>(address: EventAddress, listener: EventListener<P>): void {
  getEventManager().eventEmitter.on(serializeAddress(address), listener);
}

/**
 * Functional Eventing Interface
 * @description - Use this to access the MiniMesh eventing system outside a MiniMesh View.
 * @type {{Partial<IEventBus>}}
 * @author Zach Ayers
 */
export const events: Pick<
  IEventBus,
  "subscribe" | "unsubscribe" | "peek" | "toAll" | "toFaces" | "toMesh"
> & {
  publish: <P, R>(address: EventAddress, payload: P) => MeshEvent<R>;
  useOnMessageListener<P>(listener: (message: MeshEvent<P>) => void): void;
} = {
  publish,
  subscribe,
  unsubscribe: function (
    address: EventAddress,
    listener: EventListener<unknown>
  ): void {
    getEventManager().eventEmitter.off(serializeAddress(address), listener);
  },
  peek: function <P>(address: EventAddress): P | undefined {
    return getEventManager().eventSink.peek(address);
  },
  toAll: function <P, R>(payload: P): MeshEvent<R> {
    return publish(
      {
        channel: CONSTANTS.eventingGlobalChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      payload
    );
  },
  toFaces: function <P, R>(payload: P): MeshEvent<R> {
    return publish(
      {
        channel: CONSTANTS.eventingGlobalFaceChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      payload
    );
  },
  toMesh: function <P, R>(payload: P): MeshEvent<R> {
    return publish(
      {
        channel: CONSTANTS.eventingGlobalMeshChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      payload
    );
  },
  /**
   * Specialized Message listener hook.
   * @description When using outside a MeshView - this hook will allow you to subscribe to the global channels.
   * @param {EventListener} listener
   */
  useOnMessageListener<P>(listener: EventListener<P>): void {
    // Global
    subscribe(
      {
        channel: CONSTANTS.eventingGlobalChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      listener
    );
    // Faces
    subscribe(
      {
        channel: CONSTANTS.eventingGlobalFaceChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      listener
    );
    // Meshes
    subscribe(
      {
        channel: CONSTANTS.eventingGlobalMeshChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      listener
    );
  },
};
