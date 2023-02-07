import type { Face } from "../../types/face";
import type { MeshInstance } from "../../types/mesh.simple.types";
import type { MeshServerOptions } from "../../types/mesh.server.options";
import type { FaceView } from "../../types/face.view";
import { FaceController } from "../abstract/face.controller";

/**
 * Health Status Controller - exposed for each face/mesh.
 * @author Zach Ayers
 */
export class HealthController extends FaceController {
  /** @inheritDoc */
  public register(
    app: MeshInstance,
    userOpts: MeshServerOptions,
    face: Face,
    view: FaceView
  ): void {
    app.get(
      `/${face.path}/${view.viewName}/health-status/`,
      (request, reply) => {
        return reply.send({ status: "ok" });
      }
    );
  }
}
