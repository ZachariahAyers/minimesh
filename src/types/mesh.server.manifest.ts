// Server specific config
import type { FastifyStaticOptions } from "@fastify/static";
import type { Face, FaceManifest } from "./face";
import type { MeshController } from "../server/abstract/mesh.controller";

type PathLikeEntry = { path: string };
type PathLikeArray<Opts> = Array<PathLikeEntry & { opts?: Opts }>;

/**
 * Options required to build an MiniMesh server
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
export interface MeshServerManifest {
  faces?: FaceManifest;
  readonly developmentOptions?: Face["developmentOptions"];
  readonly assetDirectoryRoots?: PathLikeArray<
    Omit<FastifyStaticOptions, "root">
  >;
  readonly controllers?:
    | Array<{ new (): NoConstructor<MeshController> | MeshController }>
    | Array<{
        new (...args: any[]): NoConstructor<MeshController> | MeshController;
      }>;
  readonly shared?: Face["shared"];
}

type NoConstructor<T> = Pick<T, keyof T>;
