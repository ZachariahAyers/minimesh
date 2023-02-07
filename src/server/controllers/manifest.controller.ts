import type { MeshInstance } from "../../types/mesh.simple.types";
import type { MeshServerOptions } from "../../types/mesh.server.options";
import type { FaceView } from "../../types/face.view";
import type { Face } from "../../types/face";
import { FaceController } from "../abstract/face.controller";
import { omit } from "../../utils/object.utils";

/**
 * JSON manifest of a Node. This is the primary way to access the manifest.
 * @todo: finalize the manifest interface.
 * @author: Zach Ayers
 */
export class ManifestController extends FaceController {
  /** @inheritDoc */
  public register(
    app: MeshInstance,
    userOpts: MeshServerOptions,
    face: Face,
    view: FaceView
  ): void {
    app.get(`/${face.path}/${view.viewName}/manifest/`, (request, reply) => {
      const dto = omit<FaceView>(
        view,
        "preprocessors",
        "template",
        "developmentOptions"
      );
      return reply.type("application/json").send(dto);
    });
  }
}
