import type { NodeAsset, FacePublicData } from "../../types/face.simple.types";
import type { FaceRenderer } from "../../types/face.renderer";
import type { FaceContext } from "../../types/face.context";
import type { FaceParams } from "../../types/face.params";
import ejs from "ejs";
import { Loggable } from "../abstract/loggable";

/**
 * EJS Renderer
 * @author Zach Ayers
 */
export class EjsRenderer extends Loggable implements FaceRenderer {
  public vendorAssets: Array<NodeAsset> = [];

  /** @inheritDoc */
  public render(
    context: FaceContext<FacePublicData, FaceParams>
  ): string | Promise<string> | Buffer | Promise<Buffer> {
    return ejs.render(
      context.template as string,
      { ...context, ...context.faces },
      {
        localsName: "context",
      }
    );
  }
}

export const EJS = new EjsRenderer();
