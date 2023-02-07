import type { FaceRenderer } from "../../types/face.renderer";
import type { NodeAsset, FacePublicData } from "../../types/face.simple.types";
import type { FaceContext } from "../../types/face.context";
import type { FaceParams } from "../../types/face.params";
import { Loggable } from "../abstract/loggable";

/**
 * Raw String Renderer
 * @todo Work on this flow - the current flow expects a face/view directory structure to exist. Maybe bail out of directory check if render type is STRING?
 * @author Zach Ayers
 */
export class StringRenderer extends Loggable implements FaceRenderer {
  public vendorAssets: Array<NodeAsset> = [];

  /** @inheritDoc */
  public render(
    context: FaceContext<FacePublicData, FaceParams>
  ): string | Promise<string> | Buffer | Promise<Buffer> {
    return (context.template as string) ?? "No template found!";
  }
}
export const STRING = new StringRenderer();
