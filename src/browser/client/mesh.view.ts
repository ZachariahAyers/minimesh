import type { MeshEvent } from "../eventing/mesh.event";
import type { FacePublicData } from "../../types/face.simple.types";
import type { FaceParams } from "../../types/face.params";
import type {
  EMPTY_NODE_PARAM,
  EMPTY_NODE_PARAMS,
  ViewContext,
} from "../../types/face.context";
import { CONSTANTS } from "../../constants/mesh.constants";
import axios, { AxiosInstance } from "axios";
import {
  EventBus,
  EventListener,
  ViewEventAdapter,
} from "../eventing/event.bus";

/**
 * Base view constructor for a Face in the browser.
 * @description This is the base class for all views in the browser.
 * @author Zach Ayers
 */
export type MeshViewConstructor<
  Public extends FacePublicData = EMPTY_NODE_PARAM,
  Params extends FaceParams = EMPTY_NODE_PARAMS
> = new (idSelector: string) => MeshView<Public, Params>;

/**
 * MeshView is the base class for all views in the browser.
 * @description This is the base class for all views in the browser.
 * @author Zach Ayers
 * @author Zach Ayers
 */
export abstract class MeshView<
  Public extends FacePublicData = EMPTY_NODE_PARAM,
  Params extends FaceParams = EMPTY_NODE_PARAMS
> implements ViewEventAdapter
{
  /**
   * The eventing interface for this view. This is auto-wired and should not be used directly.
   * @description Use the <code>this.events</code> getter to access the eventing interface for this view.
   * @type {EventBus} - The event bus for this view.
   * @private
   */
  private readonly _events: EventBus = new EventBus();
  /**
   * The api interface for this view. This is auto-wired and should not be used directly.
   * @description Use the <code>this.api</code> getter to access the api interface for this view.
   * @type {AxiosInstance} - The api interface for this view.
   * @private
   */
  private readonly _api: AxiosInstance;
  /**
   * The root element of this view. This is auto-wired and should not be used directly.
   * @description Use the <code>this.root</code> getter to access the root element of this view.
   * @type {HTMLElement} - The root element of this view.
   * @private
   */
  private readonly _root: HTMLElement;
  /**
   * The context (hydration data) for this view. This is any public data and information from the Server side that is needed to render this view.
   * @description Use the <code>this.context</code> getter to access the context for this view.
   * @type {ViewContext<Public, Params>} - The context for this view.
   * @private
   */
  private readonly _context: ViewContext<Public, Params>;

  /**
   * Base view constructor
   * @param {string} idSelector - The id selector for the root element of this view.
   */
  constructor(idSelector: string) {
    // Set defaults
    // TODO: we should probably try again if the data can't be fetched the first time. Maybe a retry mechanism.
    // TODO: here, values are defaults to empty objects, and that can cause NPEs in client code fairly easily.
    this._root = {} as HTMLElement;
    this._context = {} as ViewContext<Public, Params>;
    this._api = {} as AxiosInstance;
    // Get the root element from the DOM
    const root = document.getElementById(idSelector);

    // If no root was found, throw an error and return
    if (!root) {
      console.error(`Error: Unable to locate element with id ${idSelector}`);
      return;
    }

    // Set the root element
    this._root = root;

    // Get the corresponding script payload for this face
    const dataPayload = document.getElementById(
      CONSTANTS.dataIdPrefix + idSelector
    );

    // If no payload was found, throw an error and return
    if (!dataPayload) {
      // TODO: Deeply Nested (3+) Preact Components have trouble finding the data payload here
      console.error(
        `Error: Unable to locate face data payload for ${idSelector}`
      );
      return;
    }

    const textContent = dataPayload.textContent ?? "{}";
    // Remove the data script, to clean up the DOM
    dataPayload.remove();

    // Parse and Load the script into context
    // TODO: Error handling here for bad data load
    this._context = JSON.parse(textContent) as ViewContext<Public, Params>;

    // Setup the API pointer for this face
    // Remove last two parts of serverUrl so we get the base route to the server
    const apiUrl = this.context.serverUrl.split("/").slice(0, -3).join("/");
    this._api = axios.create({
      baseURL: apiUrl,
      withCredentials: true,
    });

    // TODO: use already listeners if possible, this will cut down on listener/event emitter warnings
    // Bind Listeners
    this._events.subscribe(
      {
        channel: CONSTANTS.eventingGlobalChannel,
        topic: CONSTANTS.eventingGlobalTopic,
      },
      this.onMessage.bind(this)
    );

    if (this.context.renderAsMesh) {
      this._events.subscribe(
        {
          channel: CONSTANTS.eventingGlobalMeshChannel,
          topic: CONSTANTS.eventingGlobalTopic,
        },
        this.onMessage.bind(this)
      );
    } else {
      this._events.subscribe(
        {
          channel: CONSTANTS.eventingGlobalFaceChannel,
          topic: CONSTANTS.eventingGlobalTopic,
        },
        this.onMessage.bind(this)
      );
    }

    this.onMount();
  }

  /**
   * Get the context for this view.
   * @return {NodeContext<Public, Params>} - The context for this view.
   */
  public get context(): ViewContext<Public, Params> {
    return this._context;
  }

  /**
   * Get the root element for this view.
   * @return {Element | null} - The root element for this view.
   */
  public get root(): HTMLElement | undefined {
    return this._root;
  }

  /**
   * Get the scoped api interface for this view.
   * @return {AxiosInstance} - The scoped api interface for this view.
   */
  public get api(): AxiosInstance {
    return this._api;
  }

  /** @inheritDoc */
  public toFaces<Payload, Response>(
    payload: Payload,
    topic?: string
  ): MeshEvent<Response> {
    return this._events.publish({
      payload,
      topic: topic ?? CONSTANTS.eventingGlobalTopic,
      channel: CONSTANTS.eventingGlobalFaceChannel,
    });
  }

  /** @inheritDoc */
  public toMesh<Payload, Response>(
    payload: Payload,
    topic?: string | undefined
  ): MeshEvent<Response> {
    return this._events.publish({
      payload,
      topic: topic ?? CONSTANTS.eventingGlobalTopic,
      channel: CONSTANTS.eventingGlobalMeshChannel,
    });
  }

  /** @inheritDoc */
  public toAll<Payload, Response>(
    payload: Payload,
    topic?: string | undefined
  ): MeshEvent<Response> {
    return this._events.publish({
      payload,
      topic: topic ?? CONSTANTS.eventingGlobalTopic,
      channel: CONSTANTS.eventingGlobalChannel,
    });
  }

  /**
   * Subscribe to a topic on a channel.
   * @param {string} channel - The channel to subscribe to.
   * @param {string} topic - The topic to subscribe to.
   * @param {EventListener} listener - The listener to subscribe to the topic.
   * @author Zach Ayers
   */
  public subscribe<Payload, Response>(
    channel: string,
    topic: string,
    listener: EventListener
  ): void {
    this._events.subscribe(
      {
        channel,
        topic,
      },
      listener
    );
  }

  /**
   * This method will fire anytime <strong>subscribed</strong> event is recieved.
   * @description If this view is not subscribed to the particular channel and topic, it will not recieve the event. Faces subscribe to the 'all', 'face', and 'mesh' channels by default.
   * @param {MeshEvent<any>} message
   * @protected\
   * @author Zach Ayers
   * @author Zach Ayers
   */
  protected onMessage<P = unknown>(message: MeshEvent<P>): void {}

  /**
   * This method will fire when the view is mounted.
   * @description Any post-mount actions should be done here.
   * @author Zach Ayers
   */
  protected onMount() {
    const identifierText = this.context.renderAsMesh
      ? "%c[Mesh]  "
      : "%c[Face]";
    const identifierColor = this.context.renderAsMesh
      ? CONSTANTS.branding.blue
      : CONSTANTS.branding.green;

    let rendererColor = "default";
    switch (this.context.renderer) {
      case "EJS":
        rendererColor = CONSTANTS.branding.puse;
        break;
      case "PREACT":
        rendererColor = CONSTANTS.branding.purple;
        break;
      case "HTML":
        rendererColor = CONSTANTS.branding.orange;
        break;
      case "STRING":
        rendererColor = CONSTANTS.branding.yellow;
        break;
      case "MARKDOWN":
        rendererColor = CONSTANTS.branding.gold;
        break;
      default:
        console.warn(
          `No Renderer color was found for: '${this.context.renderer}'. Please reach out to a MiniMesh developer so they may add one to the framework in class: 'MeshView'.`
        );
        break;
    }

    console.groupCollapsed(
      "🔔\t" +
        identifierText +
        " %c" +
        "[" +
        this.context.renderer +
        "] %c" +
        this.context.faceName +
        "." +
        this.context.viewName,
      `color:${identifierColor}`,
      `color:${rendererColor}`,
      "color:default"
    );
    this.checkNestLevel();
    console.info("Extend this view's `onMount` method to get started!");
    console.info(this);
    console.groupEnd();
  }

  /**
   * Faces should not be nested too deeply, this can have poor performance implications.
   * @description If the nest level is too deep, a warning will be logged to the browser console.
   * @private
   * @author Zach Ayers
   */
  private checkNestLevel() {
    if (this.context.nestLevel > 1) {
      console.warn(
        `${this.context.faceName} | ${this.context.viewName} : Nest level of '${this.context.nestLevel}' is not recommended! The deeper you nest your faces, the slower the application's performance may become.`
      );
    }
  }
}
