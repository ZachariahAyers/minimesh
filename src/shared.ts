/** Attribute and header names shared by the server and the browser runtime. */
export const ATTR = {
  face: "data-minimesh-face",
  view: "data-minimesh-view",
  context: "data-minimesh-context",
} as const;

/** How deep the current render is nested inside other faces. 0 is the page itself. */
export const NEST_HEADER = "x-minimesh-nest-level";

/** Event channels every view joins. Meshes join `all` and `mesh`; faces join `all` and `faces`. */
export const CHANNELS = {
  all: "minimesh:all",
  faces: "minimesh:faces",
  mesh: "minimesh:mesh",
} as const;

export const DEFAULT_TOPIC = "message";

export type PublicData = Record<string, unknown>;

/** Device class of the visitor, from client hints and the user agent. */
export type Device = "desktop" | "mobile" | "tablet" | "tv" | "bot";

/** Path the browser runtime listens on for reload events when dev mode is on. */
export const LIVE_PATH = "/_minimesh/live";

/** The part of a render that is safe to send to the browser. */
export interface ViewContext<Data extends PublicData = PublicData> {
  face: string;
  view: string;
  /** True when this view rendered as the page itself. */
  mesh: boolean;
  title: string;
  /** Data the preprocessors published for this request. */
  data: Data;
  /** Rendered child faces by name. Sent to the browser only for Preact templates, which hydrate them. */
  faces: Record<string, string>;
  nestLevel: number;
  /** Origin of the server that rendered this view, or "" for same-origin. */
  baseUrl: string;
  device: Device;
  /** The request's route parameters and query string. Headers and body stay on the server. */
  params: { path: Record<string, unknown>; query: Record<string, unknown> };
  /** True on a server started in dev mode; the runtime then logs each view it mounts. */
  dev: boolean;
}
