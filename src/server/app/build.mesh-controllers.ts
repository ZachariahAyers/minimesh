import type {
  MeshDevServer,
  MeshServerOptions,
} from "../../types/mesh.server.options";
import type { FastifyInstance } from "fastify";
import { MINIMESH } from "../config/mesh.config";
import path from "path";
import fastifyStatic from "@fastify/static";
import { CONSTANTS } from "../../constants/mesh.constants";
import { ManifestController } from "../controllers/manifest.controller";
import { ContentController } from "../controllers/content.controller";
import { HealthController } from "../controllers/health.controller";
import { HydrationController } from "../controllers/hydration.controller";
import { assertFileExists } from "../../utils/file.utils";
import fs from "fs";

/**
 * Build all server controllers on the server side at startup and prep any cacheables.
 * @param {FastifyInstance} app - The fastify app to use.
 * @param {MeshServerOptions} userOpts - The user options to use.
 * @param {MeshDevServer} devServer - The dev server to use.
 * @author Zach Ayers
 */
export function buildMeshControllers(
  app: FastifyInstance,
  userOpts: MeshServerOptions,
  devServer: MeshDevServer
): void {
  // Setup Asset directories
  userOpts.manifest.assetDirectoryRoots?.forEach((assetRoot) => {
    const staticPath: string = path.join(MINIMESH.root, assetRoot.path);

    app.log.debug(`Registering static assets at: ${staticPath}`);
    app.register(fastifyStatic, {
      ...assetRoot.opts,
      root: staticPath,
      decorateReply: false,
    });
  });

  // Build Routes for Node Content
  userOpts.manifest.faces?.forEach((face) => {
    face.views.forEach((view) => {
      const getPath = (rootFallback: string) =>
        path.join(
          MINIMESH.isLocal()
            ? MINIMESH.root.replace(/src/g, CONSTANTS.buildOutputFolder)
            : MINIMESH.root,
          face.root ?? rootFallback,
          face.path,
          view.viewName
        );

      const meshPath = getPath("meshes");
      const facePath = getPath("faces");

      let verifyPath: string;
      let staticPath: string | null = null;

      if (fs.existsSync(meshPath)) {
        staticPath = meshPath;
        verifyPath = meshPath;
      } else {
        if (fs.existsSync(facePath)) {
          staticPath = facePath;
          verifyPath = facePath;
        } else {
          verifyPath = view.exposeAsMesh ? meshPath : facePath;
        }
      }

      assertFileExists(verifyPath, verifyPath);

      // Static Paths
      if (staticPath !== null && fs.existsSync(staticPath)) {
        app.log.debug("Registering static path: " + staticPath);
        app.register(fastifyStatic, {
          root: staticPath,
          prefix: `/${face.path}/${view.viewName}/`,
          decorateReply: false,
        });
      } else {
        app.log.debug("No static path found for: " + staticPath);
      }

      // Register Controllers
      new HydrationController().register(app, userOpts, face, view);
      new HealthController().register(app, userOpts, face, view);
      new ManifestController().register(app, userOpts, face, view);
      new ContentController().register(app, userOpts, face, view, devServer);
    });
  });

  // Infer MeshController Loads
  const controllers = userOpts.manifest.controllers ?? [];
  const registeredControllers: string[] = [];

  controllers.forEach((C) => {
    const controller = new C();
    controller.register(app);
    registeredControllers.push(controller.constructor.name);
  });

  if (MINIMESH.isLocal()) {
    app.log.debug(
      `Controllers: ${JSON.stringify(registeredControllers.sort(), null, 2)}`
    );
  }
}
