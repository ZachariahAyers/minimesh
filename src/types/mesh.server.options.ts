import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyServerOptions,
} from "fastify";
import type { MeshServerManifest } from "./mesh.server.manifest";
import type { GenericHook } from "../server/hooks/generic.hook";
import type { ViteDevServer } from "vite";
import type { Server } from "http";

// TODO: Swap all logs to user the integrated utils/logger.util.ts. This ties in to MINIMESH_LOG_LEVEL
export type MeshDevServer = ViteDevServer | undefined;
export type MeshHttpServer = Server | undefined;

/**
 * Options required to start up an MiniMesh server
 * @public
 * @category (MiniMesh)
 * @author Zach Ayers
 * @example
 * ```typescript
 * const opts: MeshServerOptions = {
 *   host: "0.0.0.0",
 *   port: 3000,
 *   publicDirectories: ["./dist", "./public"],
 * };
 * ```
 */
export interface MeshServerOptions {
  serverRoot: string;
  manifest: MeshServerManifest;
  /** The MiniMesh server Host - default '0.0.0.0' */
  host?: string;
  /** The MiniMesh server Port - default 3000 */
  port?: number;
  httpServer?: MeshHttpServer;
  devServer?: MeshDevServer;
  /** Fastify Plugins to append to the MiniMesh server */
  plugins?: FastifyPluginCallback | FastifyPluginAsync[];
  /** Any Custom Lifecycle hooks required by the MiniMesh server */
  hooks?: Array<GenericHook>;
  /** Advanced options for the server */
  advanced?: FastifyServerOptions;
}
