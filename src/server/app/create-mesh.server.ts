import type { MeshInstance } from "../../types/mesh.simple.types";
import type { MeshServerOptions } from "../../types/mesh.server.options";
import type { AddressInfo } from "net";
import { fastify } from "fastify";
import { MINIMESH } from "../config/mesh.config";
import { assertNoDuplicateFaces } from "./assert-no-duplicate.faces";
import { buildFaceViews } from "./build-face.views";
import { buildMeshControllers } from "./build.mesh-controllers";
import { logLocalInformation } from "./log.local-information";
import { fileURLToPath } from "url";
import fastifyRoutes from "@fastify/routes";
import fastifyCompress from "@fastify/compress";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyAuth from "@fastify/auth";
import fastifyBasicAuth from "@fastify/basic-auth";
import fastifyStatic from "@fastify/static";
import path from "path";
import viteDevServer from "vavite/vite-dev-server";
import vaviteHttpServer from "vavite/http-dev-server";
import fs from "fs";

/**
 * Create a new MiniMesh Server
 * @param {MeshServerOptions} userOpts - Server creating options
 * @return {Promise<MeshInstance>}
 */
export async function createMeshServer(
  userOpts: MeshServerOptions
): Promise<MeshInstance> {
  const rootPath: string = fileURLToPath(new URL(userOpts.serverRoot));
  MINIMESH.setRoot(rootPath);

  // Get HTTP Server Pointers
  // NOTE: because vavite is embedded in this package, we can lazy import to get the default import
  // The vavite package relies on the module graph and a "let" variable to set the server once initialized
  // This means importing directly will give us 'undefined', as the server is not yet created.
  // TODO: we can dig into `vavite` and re-implement their setup without opting into the package
  // https://github.com/cyco130/vavite/blob/main/examples/fastify/server.ts#L4
  const httpServer = userOpts.httpServer ?? vaviteHttpServer;
  // Get Dev Server Pointers
  // The vavite package relies on the module graph and a "let" variable to set the server once initialized
  // This means importing directly will give us 'undefined', as the server is not yet created.
  // TODO: we can dig into `vavite` and re-implement their setup without opting into the package
  // https://github.com/cyco130/vavite/blob/main/examples/fastify/routes/bar.ts#L2
  const devServer = userOpts.devServer ?? viteDevServer;

  // Get the base server options
  const baseOpts: Pick<MeshServerOptions, "host" | "port"> = {
    host: userOpts.host ?? (MINIMESH.host as string),
    port: userOpts.port ?? (MINIMESH.port as number),
  };

  // Create the Fastify Instance
  // Here we use fastify, but may swap this out in the future for a different server framework
  const app: MeshInstance = fastify({
    logger: {
      level:
        MINIMESH.logLevel ?? MINIMESH.isLocal()
          ? "debug"
          : MINIMESH.isProduction()
          ? "error"
          : "info",
      transport: MINIMESH.isLocal()
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined,
    },
    disableRequestLogging: !MINIMESH.enableRequestLogging ?? true,
    ignoreTrailingSlash: false,
    serverFactory: httpServer
      ? (handler) => {
          httpServer!.on("request", handler);
          return httpServer!;
        }
      : undefined,
    ...baseOpts,
    ...userOpts.advanced,
  }) as MeshInstance;

  // Append Custom Hooks
  userOpts.hooks?.forEach((hook) => {
    const [[key, fn]] = Object.entries(hook);
    app.addHook(key as any, fn);
  });

  // If any .ts or .scss files are requests, return a "no content"
  // This is to prevent the browser from requesting the file directly
  app.addHook("onRequest", (req, reply, done) => {
    if (req.url?.endsWith(".ts") || req.url?.endsWith(".scss")) {
      reply.code(204).send();
      return done();
    }

    if (req.url?.endsWith("favicon.ico")) {
      // Check if user has a favicon in their 'public' or 'static' folder
      const faviconPath = path.join(rootPath, "public", "favicon.ico");
      const faviconPath2 = path.join(rootPath, "static", "favicon.ico");

      if (fs.existsSync(faviconPath)) {
        reply.sendFile("favicon.ico", path.join(rootPath, "public"));
        return done();
      }

      if (fs.existsSync(faviconPath2)) {
        reply.sendFile("favicon.ico", path.join(rootPath, "static"));
        return done();
      }

      // If not, return the default favicon
      reply.sendFile(
        "favicon.ico",
        path.join(
          rootPath,
          "..",
          "..",
          "node_modules",
          "minimesh",
          "lib",
          "bundles",
          "assets"
        )
      );
      return done();
    }

    done();
  });

  // Client Bundle - available from the top-most mesh server
  await app.register(fastifyStatic, {
    root: path.join(
      rootPath,
      "..",
      "..",
      "node_modules",
      "minimesh",
      "lib",
      "bundles"
    ),
    prefix: "/bundles",
  });

  // Apply Plugins
  await app.register(fastifyRoutes);
  await app.register(fastifyCompress);
  await app.register(fastifyHelmet);
  await app.register(fastifyCors);

  // Bare Bones Authentication
  await app.register(fastifyAuth);
  await app.register(fastifyBasicAuth, {
    authenticate: {
      realm: "localhost",
    },
    validate: (username, password, req, reply, done) => {
      if (
        username === MINIMESH.basicAuthUser &&
        password === MINIMESH.basicAuthPassword
      ) {
        return done();
      }
      return done(new Error("Authentication failed"));
    },
  });

  // Ensure no duplicate Faces or views were used
  assertNoDuplicateFaces(userOpts);

  // Prepare Nodes
  userOpts.manifest.faces = buildFaceViews(userOpts);

  // Prepare Controllers
  buildMeshControllers(app, userOpts, devServer);

  // Start the Server
  // Turn off logging to ignore the first Fastify "Server Listening" message
  const defaultLogLevel = app.log.level;
  app.log.level = "silent";

  const PORT = httpServer
    ? (httpServer.address() as AddressInfo).port
    : baseOpts.port;

  // Start the App
  await app
    .listen({
      port: PORT,
      host: baseOpts.host,
    })
    // Turn logging back on, this will keep Fastify from logging the misleading "http://0.0.0.0:3000" message
    .then(() => (app.log.level = defaultLogLevel))
    // Now let's notify the user the server has started.
    .then(() => {
      const baseAddress = `http://${
        MINIMESH.isLocal() ? "127.0.0.1" : baseOpts.host
      }:${PORT}`;

      // If running in dev, log a few more bits of information to the user
      // - Exposed Routes
      // - Exposed Controllers
      // - etc.
      logLocalInformation(app, userOpts, baseAddress);

      // Without the development HTTP server, our pass through to the main server is not active and you will receive a 404
      app.log.debug(
        `Development Http Server Started: ${httpServer !== undefined}`
      );
      if (httpServer === undefined) {
        app.log.error("Development Http Server Not Found!");
        throw new Error(
          "Development Http Server Not Found! This is likely a module resolution issue. Please check your imports and restart your application."
        );
      }

      // Without the Vite dev server, Hot module reload and browser bundling will not operate properly.
      // This is resolved from a default export from the vavite package - which resolved to a deeper default export
      // https://github.com/cyco130/vavite/tree/main/packages/expose-vite-dev-server
      app.log.debug(
        `Development HMR Server Started: ${devServer !== undefined}`
      );
      if (devServer === undefined) {
        app.log.error("Development HMR Server Not Found!");
        throw new Error(
          "Development HMR Server Not Found! This is likely a module resolution issue. Please check your imports and restart your application."
        );
      }

      // If all is well, notify the user
      app.log.info(`> Server Listening at: ${baseAddress}`);
    })
    .catch((err) => {
      // If something went wrong, report and abort
      console.error("Error:", err);
      process.exit(1);
    });

  // Return the Fastify Instance
  return app;
}
