import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RequestPayload,
  RouteOptions,
} from "fastify";

/** MiniMesh contentWrapper around the generic Fastify instance
 * @public
 * @category (Server)
 * @author Zach Ayers
 * */
export type MeshInstance = FastifyInstance;
export type ApiRequest = FastifyRequest;
export type ApiReply = FastifyReply;
export type ApiError = FastifyError;
export type ApiPayload = RequestPayload;
export type ApiRouteOptions = RouteOptions;
