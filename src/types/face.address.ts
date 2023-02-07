/**
 * Address where a Face may request content from another face
 * @public
 * @category (Face)
 * @author Zach Ayers
 * @example
 * ```typescript
 * const address: FaceAddress = {
 *     name: 'calculator',
 *     contentUrl: "https://my-faces.com/v1/common-faces/calculator",
 *     manifestUrl:
 *       "https://my-faces.com/v1/common-faces/calculator/manifest.json",
 *     renderTimeout: 3000,
 *     requestRetries: 2,
 *     requestTimeout: 4000,
 *   }
 * ```
 */
export interface FaceAddress {
  /** Name of the child Face - This doubles as the templating variable */
  readonly name: string;
  /** HTTP(S) address of the URL where the child Face's content is served */
  readonly contentUrl: string;
  /** HTTP(S) address of the URL where the child Face's manifest is served */
  readonly manifestUrl?: string;
  /** Timeout (in milliseconds) for the content and manifest HTTP(S) requests.
   * Once a request timeout is reached, any defined fallbacks will be used in order.
   * */
  readonly requestTimeout?: number;
}
