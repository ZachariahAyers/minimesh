import type { FaceParams } from "./face.params";
import type { AxiosInstance } from "axios";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { FaceDevice } from "./face.device";
import type {
  FaceContent,
  FaceHelper,
  FaceHelperMap,
  FacePublicData,
  FaceTemplate,
} from "./face.simple.types";
import type { FaceView } from "./face.view";
import type { AnyObject } from "./object.any";
import type { ComponentChildren } from "preact";
import { CONSTANTS } from "../constants/mesh.constants";

/**
 * Just a plain empty object expectation type.
 * @author Zach Ayers
 */
export type EMPTY_NODE_PARAM = AnyObject;

/**
 * Helper interface for pointing to a base Param map that is available to faces.
 * @author Zach Ayers
 */
export interface EMPTY_NODE_PARAMS extends FaceParams {
  headers: EMPTY_NODE_PARAM;
  path: EMPTY_NODE_PARAM;
  query: EMPTY_NODE_PARAM;
  body: EMPTY_NODE_PARAM;
}

/**
 * Face Context - Built during each request for a Face
 * @description The Face context captures the state of a Face as data passes through the system
 * @description Items on the Context are thrown away after a Reply is returned, and Context should only exist for a single request session.
 * @category (Face)
 * @author Zach Ayers
 * @public
 * @example
 * ```typescript
 * const context: FaceContext = {
 *   viewName: "my-custom-view",
 *   template: `<div>Hello World</div>`,
 *   // Context keys are filled by the framework during a request session.
 * }
 * ```
 */
export type INodeContext<
  Public extends FacePublicData,
  Params extends FaceParams
> =
  /** The content declaration, and name of the current Face */
  FaceContent & {
    /** An axios instance used only by this Face */
    readonly api: AxiosInstance;
    /** The device type of the requesting browser */
    readonly deviceType: FaceDevice;
    /** Any parameters passed to this Face on a request */
    params: Params;
    /** Any public data that will be serialized and passed to the Client alongside the current Face */
    data: Public;
    /** The current HTTP request, flowing through Fastify */
    request: FastifyRequest;
    /** The current HTTP request, flowing through Fastify */
    reply: FastifyReply;
    /** Helper functions added to the Context object */
    helpers: FaceHelperMap;
    /** Any child faces of the current Face */
    faces: Record<string, Buffer>;
    /**
     * Render this view as a Mesh.
     */
    renderAsMesh: boolean;
    /**
     * The ID of the currently requested face or mesh/
     */
    id: string;
    /**
     * The title to display on the displayed page.
     */
    title?: string;
    /** The nesting level of the current request context */
    nestLevel: number;
    /**
     * The server url of the current request.
     */
    serverUrl: string;
    readonly faceName: string;
    renderer?: "EJS" | "PREACT" | "HTML" | "STRING" | "MARKDOWN";
  };

/**
 * Collection of mutations that can be performed on a Face context object
 * @public
 * @category (Face)
 * @author Zach Ayers
 */
export interface NodeContextMutations<
  Public extends FacePublicData,
  Params extends FaceParams
> {
  /**
   * Add a Helper function to the context. Helper functions can be passed to templates.
   * @param {FaceHelper} helper - Helper function to be exposed to your templates.
   * @example
   * ```typescript
   * // Create a helper function that converts a string to uppercase
   * const myCustomFn = (item: string) => item.toUpperCase();
   *
   * // Add a new Helper Function to the context
   * context.addHelper(myCustomFn);
   * ```
   */
  addHelper(helper: FaceHelper): void;

  /**
   * Set a new key and value on the public data - Public data is exposed to the client
   * @param {string} key Key to set the data on.
   * @param {T} value The value of the new key.
   * @return {Partial< Public>}
   * @example
   * ```
   * // Add a new piece of public data to the Face context
   * context.setPublicDataKey('foo', 'bar');
   * ```
   */
  setPublicDataKey<T>(key: string, value: T): Partial<Public>;

  /**
   * Set a new series of keys and values on the public data - Public data is exposed to the client
   * @param { T} data Data object to merge in to the current Public data.
   * @return {Partial< Public>}
   * @example
   * ```typescript
   * // Add a set of public data to the Face context
   * context.setPublicData({ foo: 'bar', baz: 'bum' });
   * ```
   */
  setPublicData<T extends AnyObject>(data: T): Public;

  /**
   * Add a new key:value parameter to the header, path, query, or body parameters.
   * @param {keyof FaceParams} type The type of param to set.
   * @param {string} key Key to set the parameter on.
   * @param { T} value Value of the new parameter key.
   * @return {Partial<Params>}
   * @example
   * ```typescript
   * // Add a new piece of data to the 'headers' param set
   * context.addParam('headers', 'foo', 'bar');
   * ```
   */
  addParam<T>(type: keyof FaceParams, key: string, value: T): Partial<Params>;

  /**
   * Add a set of new key:value parameters to the header, path, query, or body parameters.
   * @param {keyof FaceParams} type The type of parameter to set.
   * @param { T} obj Object to merge in to the current params.
   * @return {Partial< Params>}
   * @example
   * ```typescript
   * // Add a new set of data to the 'headers' param set
   * context.addParams('headers', { password: 'abcd1234', userId: 3 });
   * ```
   */
  addParams<T extends AnyObject>(
    type: keyof FaceParams,
    obj: T
  ): Partial<Params>;

  /**
   * Replace any matched keys in a parameter type.
   * @param {keyof FaceParams} type The type of parameter to set.
   * @param {RegExp | string} regex Regex matcher used in key replacement.
   * @param { T} value New value to use for matched keys.
   * @return {Partial<Params>}
   * @example
   * ```typescript
   * // Replace the value of any 'query' params matching the regex pattern
   * context.replaceParams('query', /replace-matcher/g, 'new value');
   * ```
   */
  replaceParams<T>(
    type: keyof FaceParams,
    regex: RegExp | string,
    value: T
  ): Partial<Params>;

  /**
   * Remove a key from a parameter type.
   * @param {keyof FaceParams} type The type of parameter to set.
   * @param {string} key The key to remove.
   * @return {Partial<Params>}
   * @example
   * ```typescript
   * // Remove the username key from the 'body' param set
   * context.removeParam('body', 'username');
   * ```
   */
  removeParam(type: keyof FaceParams, key: string): Partial<Params>;

  /**
   * Remove a set of keys from a parameter type.
   * @param {keyof FaceParams} type The type of parameter to set.
   * @param {string} keys The keys to remove.
   * @return {Partial<Params>}
   * @example
   * ```typescript
   * // Remove the username and password keys from the 'body' param set
   * context.removeParams('body', ['username', 'password']);
   * ```
   */
  removeParams(type: keyof FaceParams, keys: string[]): Partial<Params>;

  /**
   * Remove a set of keys from a parameter type that match a regex pattern.
   * @param {keyof FaceParams} type The type of parameter to set.
   * @param {RegExp} regex The regex matcher to use when testing object keys.
   * @return {Partial<Params>}
   * @example
   * ```typescript
   * // Remove any params from the 'body' param set that matches a regex pattern
   * context.removeParamsByMatch('body', /username/);
   * ```
   */
  removeParamsByMatch(type: keyof FaceParams, regex: RegExp): Partial<Params>;

  /**
   * Remove a set of keys from a parameter type that match a regex pattern.
   * @param {keyof FaceParams} type The type of parameter to set.
   * @param {(key: string, value:  T) => boolean} filter The filter function to use when testing object keys.
   * @return {Partial<Params>}
   * @example
   * ```typescript
   * // Remove any keys from the 'body' param set whose values do not equal "Hello World"
   * context.removeParamsByFilter('body', (key: string, value: string) => value === "Hello World"));
   * ```
   */
  removeParamsByFilter<T>(
    type: keyof FaceParams,
    filter: (key: string, value: T) => boolean
  ): Partial<Params>;

  /**
   * Override the Face template that is returned by this Face request.
   * @param {FaceTemplate} template The Face template used when rendering this Face.
   * @example
   * ```typescript
   * // Override the Face template for the current Face request.
   * context.overrideTemplate(`<div><h1>Override!</h1></div>`);
   * ```
   */
  overrideTemplate(template: FaceTemplate): void;

  /**
   * Override the View that is returned by this Face request.
   * @param {FaceView["viewName"]} viewName The name of the view to return instead of the current view.
   * @example
   * ```typescript
   * // Override the Face template for the current Face request.
   * context.overrideView('mobile');
   * ```
   */
  overrideView(viewName: FaceView["viewName"]): void;

  /**
   * Throw an error using the context object.
   * @param {Error} error The error to throw.
   * @throws Error
   * @example
   * ```typescript
   * // Throw an error when something unexpected occurs
   * context.throw(new CustomError('Something Happened!));
   * ```
   */
  throw(error: Error): void;
}

/**
 * Face Context - Stateful Object
 * This Class is created, populated, and destroyed during the Face request cycle.
 * No Context should ever exist outside a single request operation.
 * @public
 * @category (Face)
 * @author Zach Ayers
 */
export class FaceContext<Public extends AnyObject, Params extends FaceParams>
  implements INodeContext<Public, Params>, NodeContextMutations<Public, Params>
{
  public readonly api: AxiosInstance;
  public readonly faces: INodeContext<Public, Params>["faces"];
  public readonly deviceType: FaceDevice;
  public faceName: string;
  public viewName: string;
  public template: FaceTemplate | undefined;
  public templateFile: string | undefined;
  public params: Params;
  public data: Public;
  public reply: FastifyReply;
  public request: FastifyRequest;
  public helpers: FaceHelperMap = {};
  public renderAsMesh = false;
  public id;
  public nestLevel = 0;
  public title: string;
  public readonly serverUrl: string;
  public renderer: INodeContext<Public, Params>["renderer"];

  /**
   * Context builder
   * @param {INodeContext} context
   */
  constructor(context: INodeContext<Public, Params>) {
    this.api = context.api;
    this.faces = context.faces;
    this.deviceType = context.deviceType;
    this.faceName = context.faceName;
    this.viewName = context.viewName;
    this.template = context.template;
    this.templateFile = context.templateFile;
    this.params = context.params;
    this.data = context.data;
    this.reply = context.reply;
    this.request = context.request;
    this.renderAsMesh = context.renderAsMesh;
    this.id = context.id;
    this.nestLevel = context.nestLevel;
    this.title = context.title ?? CONSTANTS.defaultHTMLTitle;
    this.serverUrl = context.serverUrl;
    this.renderer = context.renderer;
  }

  /** @inheritDoc */
  public addHelper(helper: FaceHelper): void {
    this.helpers.set(helper.name, helper);
  }

  /** @inheritDoc */
  public setPublicDataKey<T>(key: string, value: T): Partial<Public> {
    this.data = { ...this.data, [key]: value };
    return this.data;
  }

  /** @inheritDoc */
  public setPublicData<T extends AnyObject>(data: T): Public {
    this.data = { ...this.data, ...data };
    return this.data;
  }

  /** @inheritDoc */
  public addParam<T>(
    type: keyof FaceParams,
    key: string,
    value: T
  ): Partial<Params> {
    this.params[type][key] = value;
    return this.params;
  }

  /** @inheritDoc */
  public addParams<T extends AnyObject>(
    type: keyof FaceParams,
    obj: T
  ): Partial<Params> {
    this.params[type] = { ...this.params[type], ...obj };
    return this.params;
  }

  /** @inheritDoc */
  public replaceParams<T>(
    type: keyof FaceParams,
    regex: RegExp,
    value: T
  ): Partial<Params> {
    const currentParams = { ...this.params[type] };

    for (const key in currentParams) {
      if (regex.test(key)) {
        currentParams[key] = value;
      }
    }

    this.params[type] = currentParams;
    return this.params;
  }

  /** @inheritDoc */
  public removeParam(type: keyof FaceParams, key: string): Partial<Params> {
    delete this.params[type][key];
    return this.params;
  }

  /** @inheritDoc */
  public removeParams(type: keyof FaceParams, keys: string[]): Partial<Params> {
    for (const key of keys) {
      if (this.params[type][key]) {
        delete this.params[type][key];
      }
    }

    return this.params;
  }

  /** @inheritDoc */
  public removeParamsByMatch(
    type: keyof FaceParams,
    regex: RegExp
  ): Partial<Params> {
    for (const key in this.params[type]) {
      if (regex.test(key)) {
        delete this.params[type][key];
      }
    }

    return this.params;
  }

  /** @inheritDoc */
  public removeParamsByFilter<T>(
    type: keyof FaceParams,
    filter: (key: string, value: T) => boolean
  ): Partial<Params> {
    for (const key in this.params[type]) {
      if (filter(key, this.params[type][key])) {
        delete this.params[type][key];
      }
    }

    return this.params;
  }

  /** @inheritDoc */
  public overrideTemplate(template: any | FaceTemplate): void {
    this.template = template;
  }

  /** @inheritDoc */
  public overrideView(viewName: FaceView["viewName"]): void {
    this.viewName = viewName;
  }

  /** @inheritDoc */
  public throw(error: Error): void {
    throw error;
  }
}

/**
 * View context for PREACT components.
 */
export interface PreactViewContext<
  NodePublicData = EMPTY_NODE_PARAM,
  NodeParams = EMPTY_NODE_PARAMS
> extends BaseViewContext {
  children: ComponentChildren;
}

/**
 * View context for standard/default components.
 */
export interface ViewContext<
  NodePublicData = EMPTY_NODE_PARAM,
  NodeParams = EMPTY_NODE_PARAMS
> extends BaseViewContext {}

/**
 * Extendable base view context. Sanitizes FaceContext down to a client model.
 * @description !!! THIS IS THE BASE CLIENT SIDE DTO OBJECT !!!.
 * @author Zach Ayers
 */
export type BaseViewContext<
  NodePublicData = EMPTY_NODE_PARAM,
  NodeParams = EMPTY_NODE_PARAMS
> = Pick<
  Required<FaceContext<EMPTY_NODE_PARAM, EMPTY_NODE_PARAMS>>,
  | "faces"
  | "faceName"
  | "viewName"
  | "serverUrl"
  | "id"
  | "params"
  | "data"
  | "renderAsMesh"
  | "deviceType"
  | "nestLevel"
  | "title"
  | "renderer"
>;
