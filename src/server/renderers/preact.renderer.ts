import type { FaceContext } from "../../types/face.context";
import type { FaceParams } from "../../types/face.params";
import type { FaceRenderer } from "../../types/face.renderer";
import type {
  NodeAsset,
  FacePublicData,
  VNodeFn,
} from "../../types/face.simple.types";
import { h } from "preact";
import render from "preact-render-to-string";
import { convertExtsToDistPointer } from "../../utils/html.utils";
import { Loggable } from "../abstract/loggable";

/**
 * TODO
 */
export class PreactRenderer extends Loggable implements FaceRenderer {
  public vendorAssets: Array<NodeAsset> = [];

  /** @inheritDoc */
  public render(
    context: FaceContext<FacePublicData, FaceParams>
  ): string | Promise<string> | Buffer | Promise<Buffer> {
    const component = h(context.template as VNodeFn<any>, {
      ...context,
    });
    const html = render(component);
    return convertExtsToDistPointer(html);
  }
}

export const PREACT = new PreactRenderer();
