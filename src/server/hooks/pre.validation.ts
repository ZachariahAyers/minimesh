import type { ApiReply, ApiRequest } from "../../types/mesh.simple.types";

/**
 * If you are using the preValidation hook, you can change the payload before it is validated.
 *
 * @param {MiniMeshInstance} app - The MiniMesh app isntance.
 * @return {Promise<void>}
 * @internal
 * @category (Hooks)
 * @author Zach Ayers
 * @example
 * ```typescript
 * async (request, reply) => {
 *   const importantKey = await generateRandomString()
 *   request.body = { ...request.body, importantKey }
 * }
 * ```
 */
export type PreValidationHook = (
  request: ApiRequest,
  reply: ApiReply
) => Promise<void>;
