import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
  RouteShorthandOptions,
} from "fastify";
import type { ComponentType } from "preact";
import type { Device, PublicData, ViewContext } from "../shared.ts";

/** Server-side state for one render. Preprocessors read the request and fill `data`. */
export interface FaceContext<Data extends PublicData = PublicData> {
  readonly face: string;
  readonly view: string;
  readonly mesh: boolean;
  readonly nestLevel: number;
  readonly request: FastifyRequest;
  readonly reply: FastifyReply;
  readonly device: Device;
  title: string;
  /** Replace the view's template for this request, for example to pick a variant per device. */
  template?: string | ComponentType<ViewContext>;
  /** Public: serialized into the page and readable by the browser. Never put secrets here. */
  data: Data;
  /** Functions available to EJS templates. Never sent to the browser. */
  helpers: Record<string, (...args: never[]) => unknown>;
  /** Rendered child faces by name. */
  faces: Record<string, string>;
}

/** Runs before a view renders. Shared preprocessors run first, then the face's, then the view's. */
export type Preprocessor<Data extends PublicData = PublicData> = (
  context: FaceContext<Data>,
) => void | Promise<void>;

/** A child face to render into this view. */
export interface FaceAddress {
  /** Key under which the rendered HTML appears in `faces`. */
  name: string;
  /** A path on this server such as "/cart/summary/", or an absolute URL on another server. */
  url: string;
  /** Milliseconds before a remote face is given up on. Default 5000. */
  timeout?: number;
  /** Extra headers for a remote face, for example its credentials. */
  headers?: Record<string, string>;
}

export interface Shared {
  preprocessors?: Preprocessor[];
  helpers?: FaceContext["helpers"];
  faces?: FaceAddress[];
  /**
   * Fastify route options for the content and data routes: `schema` to validate `params`,
   * `querystring` and `headers`, `preHandler` for authentication, `config`, and so on. Merged
   * shared, then face, then view; later keys win.
   */
  routeOptions?: RouteShorthandOptions;
  /** In dev mode, wraps a face requested on its own so it can be previewed as a page. */
  devWrapper?: (html: string) => string;
}

export interface View extends Shared {
  name: string;
  title?: string;
  /** Render as a full HTML page when requested directly. Faces render as fragments. */
  mesh?: boolean;
  /** An HTML string, or a Preact component that receives the view context as props. */
  template?: string | ComponentType<ViewContext>;
  /** A file in the view's folder: .html, .ejs or .md. */
  templateFile?: string;
  /**
   * Scripts and stylesheets in the view's folder to load with it, such as "card.client.ts". They
   * are placed beside the rendered markup, so a Preact hydrate never sees them.
   */
  assets?: string[];
  /** Extra classes on the face's wrapping `<section>`. */
  className?: string;
  /** Extra attributes on the face's wrapping `<section>`. */
  attributes?: Record<string, string>;
}

export interface Face {
  name: string;
  views: View[];
  shared?: Shared;
}

export interface MeshServerOptions {
  /** Directory that holds `<face>/<view>/` folders. */
  root: string | URL;
  faces: Face[];
  /** Output of `minimesh build`, served at `/<face>/<view>/`. */
  assetsDir?: string | URL;
  /**
   * Public origin of this server, such as "https://faces.example.com". Asset and data URLs use it
   * so fragments work when another server embeds them. Without it, URLs are root-relative.
   */
  publicUrl?: string;
  shared?: Shared;
  /** Deepest allowed nesting of faces inside faces. Default 4. */
  maxNestLevel?: number;
  /** Read template files on every request. Default: true unless NODE_ENV is "production". */
  reloadTemplates?: boolean;
  /**
   * Dev mode: pages reload when templates or built assets change, a face requested on its own
   * renders as a preview page, and the browser runtime logs each view. Default: true when the
   * MINIMESH_DEV environment variable is "1", which `minimesh dev` sets.
   */
  dev?: boolean;
  /** Fastify plugins registered before the face routes, such as authentication or API routes. */
  plugins?: Array<FastifyPluginAsync | FastifyPluginCallback>;
  /** More directories to serve as static files, each under its own URL prefix. */
  staticDirs?: Array<{ root: string | URL; prefix: string }>;
  fastify?: FastifyServerOptions;
}
