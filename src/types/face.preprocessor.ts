import type { FaceContext } from "./face.context";
import type { FacePublicData } from "./face.simple.types";
import type { FaceParams } from "./face.params";

/**
 * The Face Preprocessor runs on a Face template before the HTML is returned from the content route handler.
 * @category (Face)
 * @author Zach Ayers
 * @public
 * @example
 * ```typescript
 * const helloPreprocessor: FacePreprocessor = {
 *   priority: 1,
 *   preprocessor: (context: FaceContext) => {
 *     if (context.deviceType === "MOBILE") {
 *       context.addHelper((name: string) => {
 *         return name.toUpperCase()
 *       });
 *     }
 *   },
 * };
 * ```
 */
export type FacePreprocessor<
  Public extends FacePublicData,
  Params extends FaceParams
> = {
  /** The priority this preprocessor should run in. Lower numbers are processed first */
  priority?: number;
  /** The processing function to run over a Face template before it is returned */
  preprocessor: (context: FaceContext<Public, Params>) => Promise<void> | void;
};
