import type { MeshInstance } from "../../types/mesh.simple.types";
import type { MeshServerOptions } from "../../types/mesh.server.options";
import type { FaceView } from "../../types/face.view";
import type { Face } from "../../types/face";
import { FaceController } from "../abstract/face.controller";

/**
 * Hydration Controller - exposed for each face/mesh.
 * @description This controller appends a ?DATA_ONLY attribute to the request and hits the content route.
 * This allows the same preprocessor code to run without duplication.
 * @author Zach Ayers
 */
export class HydrationController extends FaceController {
  /** @inheritDoc */
  public register(
    app: MeshInstance,
    userOpts: MeshServerOptions,
    face: Face,
    view: FaceView
  ): void {
    app.get(`/${face.path}/${view.viewName}/data/`, async (request, reply) => {
      const result = await app
        .inject()
        .get(`/${face.path}/${view.viewName}/?DATA_ONLY=true`);
      return reply.send(result.payload);
    });
  }
}
