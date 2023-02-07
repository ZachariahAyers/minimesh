import type { FaceView } from "./face.view";

/**
 * Content Preprocessor
 * @description Function
 * to run over a fetched content before it is parsed for Server Side Composition
 * @category (Manifest)
 * @author Zach Ayers
 * @public
 * @example
 * ```typescript
 * // Parse the old content and create the new content
 * const processContent: ContentPreprocessor = {
 *   priority: 1,
 *   preprocessor: (content: string) => {
 *     return content.replace('TEMPLATE_TOKEN', 'Hello World!');
 *   },
 * };
 * ```
 */
export interface ContentPreprocessor {
  /** The priority this preprocessor should run in. Lower numbers are processed first */
  priority?: number;
  /** The processing function to run over a Content before it is available for template injection */
  preprocessor: (content: string) => FaceView["template"];
}
