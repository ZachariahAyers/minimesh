import type { FacePreprocessor } from "./face.preprocessor";
import type {
  FaceAddresses,
  FaceHelper,
  FacePublicData,
  FaceTemplate,
} from "./face.simple.types";
import type { FaceParams, FaceParamsSchema } from "./face.params";
import type { RouteShorthandOptions } from "fastify";
import type { JsAsset } from "./js.asset.js";
import type { CssAsset } from "./css.asset";

/**
 * Declaration of a Face 'view' object.
 * @description Face 'views' represent an individual 'view' of a particular Face.
 * Each 'view' is unique for a Face, and a Face may have many different views.
 * @public
 * @category (Face)
 * @author Zach Ayers
 */
export interface FaceView<
  Public extends FacePublicData = {},
  Params extends FaceParams = { headers: {}; path: {}; query: {}; body: {} }
> {
  /** The unique name of a view */
  readonly viewName: string;
  /** TThe title of the HTML page when displaying this view at the top level */
  readonly title?: string;
  /** The template a Face will return from its content controller */
  readonly template?: FaceTemplate | string;
  /**
   * When using a file renderer, this is the path to the template file.
   */
  readonly templateFile?: string;
  /**
   * Method for re-reading the template after server startup.
   */
  getTemplate?: () => string | FaceTemplate;
  /** Root node for this view */
  readonly root?: string;
  /** The ext of the template file used */
  readonly templateExt?: string;
  /** Any Nodes that this Face requires to render appropriately */
  readonly faces?: FaceAddresses;
  /** Array of helper functions to pass to the FaceContext */
  readonly helpers?: Record<string, FaceHelper>;
  /** Any Route options to use for every view of this Face. */
  readonly routeOpts?: RouteShorthandOptions;
  /** Array of Face Preprocessors to run on the FaceTemplate, sorted by Priority */
  readonly preprocessors?: Array<FacePreprocessor<Public, Params>>;
  /** Expose this Face view to the outside world.
   * Allowing URL request to return this Face view.
   * When not set,
   * this Face view will only be contactable during developmentOptions */
  readonly exposeAsMesh?: boolean;
  /** Expected request parameters for a Face content request */
  readonly paramsSchema?: FaceParamsSchema;
  /** When MINIMESH is NOT 'production', and this Face is NOT being requested from another Face, apply these developmentOptions tools */
  readonly developmentOptions?: {
    /** Wrap the FaceTemplate in content, simulating another Face rendering this Face */
    readonly contentWrapper?: (content: string) => string;
  };
  assets?: {
    js?: Array<JsAsset>;
    css?: Array<CssAsset>;
  };
  readonly contentUrl?: string;
  readonly manifestUrl?: string;
  readonly dataUrl?: string;
  readonly htmlContainerCssClassNames?: string[];
  readonly htmlContainerAttributes?: HTMLElement["attributes"][];
}
