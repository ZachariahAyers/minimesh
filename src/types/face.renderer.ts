import type { FaceContext } from "./face.context";
import type { NodeAsset, FacePublicData } from "./face.simple.types";
import type { FaceParams } from "./face.params";

/**
 * Nodes may use different types of Renderers. Renderers may either return a string or a Buffer of content.
 * Once a renderer has 'rendered' the content, the string or Buffer is sent out on the response object.
 * @description This allows string typing of all anonymous objects.
 * @category (Face)
 * @author Zach Ayers
 * @public
 * @example
 * ```typescript
 * // Create a new JS Asset
 * const jsAsset: AssetJS = {
 *   src: "https://unpkg.com/ejs@3.1.6/ejs.min.js",
 * }
 *
 * // Create the new renderer
 * const ejsNodeRenderer: FaceRenderer = {
 *   vendorAssets: [jsAsset],
 *   render(
 *     context: FaceContext<FacePublicData, FaceParams>
 *   ): Buffer | string | Promise<Buffer> | Promise<string> {
 *     return ejs.render(context.template, { data: context.data });
 *   },
 * };
 * ```
 */
export type FaceRenderer = {
  /** Any Vendor assets required by this renderer.
   * These will be sent along with the Face scripts in the Manifest */
  vendorAssets?: Array<NodeAsset>;
  /** Rendering Function -
   * access the Face context
   * and return a string or Buffer which will be sent as the Face content response */
  render(
    context: FaceContext<FacePublicData, FaceParams>
  ): string | Promise<string> | Buffer | Promise<Buffer>;
};
