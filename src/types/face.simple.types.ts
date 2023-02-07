import type { FaceView } from "./face.view";
import type { JsAsset } from "./js.asset.js";
import type { CssAsset } from "./css.asset";
import type { AnyObject } from "./object.any";
import type { FaceAddress } from "./face.address";
import type { VNode } from "preact";
import type { PreactViewContext } from "./face.context";

/**
 * Any type of Face Asset -
 * These will be sent along on the Face manifest to allow other faces to grab assets.
 * @category (Face)
 * @public
 * @author Zach Ayers
 * @example
 * ```typescript
 * // NodeAsset is a generic type that encompasses all Assets for a Face (CSS, JS, Img, Font, etc)
 * const asset = <NodeAsset>{
 *     src: './dist/js/bundle.js',
 *     async: true
 *   }
 * ```
 */
export type NodeAsset = JsAsset | CssAsset | { value: string };

/**
 * PUBLIC data to be exposed to the Client side -
 * Public data is serialized and sent alongside the Face as a payload script.
 * @category (Face)
 * @public
 * @author Zach Ayers
 */
export type FacePublicData = AnyObject;

/**
 * Map of addresses used to render external faces.
 * @category (Face)
 * @public
 * @author Zach Ayers
 * @example
 * ```typescript
 * const addresses: FaceAddresses = [
 *   {
 *     name: 'calculator',
 *     contentUrl: "https://my-faces.com/v1/common-faces/calculator",
 *     manifestUrl:
 *       "https://my-faces.com/v1/common-faces/calculator/manifest.json",
 *     renderTimeout: 3000,
 *     requestRetries: 2,
 *     requestTimeout: 4000,
 *   },
 *   {
 *     name: 'search-entry',
 *     contentUrl: "https://my-faces.com/v1/common-faces/search-entry",
 *   },
 * ];
 * ```
 */
export type FaceAddresses = Array<FaceAddress>;

/**
 * A helper function which may be passed to templates and run inside of templates.
 * @category (Face)
 * @public
 * @author Zach Ayers
 * @example
 * ```typescript
 * const reverseText = (text: string) => text.split('').reverse().join('');
 * ```
 */
export type FaceHelper = Function;

/**
 * Map of Face helper functions, used to access via a helper key.
 * @category (Face)
 * @public
 * @author Zach Ayers
 * @example
 * ```typescript
 * // Create a map of Helpers
 * const helpers: FaceHelperMap = {
 *   reverseText: (text: string) => text.split("").reverse().join(""),
 *   formatNumber: (text: string) => text.toLocaleUpperCase(),
 * }
 * ```
 */
export type FaceHelperMap = Record<string, FaceHelper>;

/**
 * Template to be rendered by a FaceRenderer
 * Templates are run through any defined preprocessors before they are sent to the client.
 * @category (Face)
 * @public
 * @author Zach Ayers
 */
export type FaceTemplate = VNodeFn<PreactViewContext> | RawTemplate;
export type RawTemplate = string;
export type VNodeFn<P> = (context: P) => VNode<P>;

/**
 * A Face's Content and ViewName identifier.
 * @category (Face)
 * @public
 * @author Zach Ayers
 * @example
 * ```typescript
 * const faceContent: FaceContent = {
 *   template: `<div>Hello World</div>`,
 *   viewName: 'my-custom-view'
 * }
 * ```
 */
export type FaceContent = Pick<
  FaceView,
  "viewName" | "template" | "templateFile"
>;
