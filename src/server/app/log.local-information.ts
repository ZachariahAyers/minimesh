import type { MeshServerOptions } from "../../types/mesh.server.options";
import type { FastifyInstance } from "fastify";
import { MINIMESH } from "../config/mesh.config";

/**
 * Log local information when MINIMESH is running locally.
 * @param {FastifyInstance} app
 * @param {MeshServerOptions} userOpts
 * @param {string} baseAddress
 */
export function logLocalInformation(
  app: FastifyInstance,
  userOpts: MeshServerOptions,
  baseAddress: string
): void {
  // If Local - print some more in depth information
  if (MINIMESH.isLocal()) {
    const routes: string[] = [];
    app.routes.forEach((val, key) => {
      routes.push(key);
    });
    app.log.debug(`Routes: ${JSON.stringify(routes.sort(), null, 2)}`);

    app.log.debug(
      `Faces: ${JSON.stringify(
        userOpts.manifest.faces?.flatMap((face) =>
          face.views
            .map(
              (view) =>
                `${view.exposeAsMesh ? "MESH:  " : `FACE: `}[ ${baseAddress}/${
                  face.path
                }/${view.viewName}/ ]${
                  !view.exposeAsMesh && MINIMESH.isLocal()
                    ? " (!!! Default Authentication Removed While Running Locally !!!)"
                    : ""
                }`
            )
            .sort()
        ) ?? [],
        null,
        2
      )}`
    );
  }
}
