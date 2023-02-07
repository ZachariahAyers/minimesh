import type { FaceContext, ViewContext } from "../types/face.context";
import type { FacePublicData } from "../types/face.simple.types";
import type { FaceParams } from "../types/face.params";

/**
 * Create a Sanitized context object that can be sent to the browser. This is the data that will be available and loaded into the client.
 * @param {FaceContext<AnyObject, AnyObject, FaceParams>} context - The context object to sanitize.
 * @return {ViewContext} - The sanitized context object.
 * @author Zach Ayers
 */
export function getSafeContext(
  context: FaceContext<FacePublicData, FaceParams>
): Required<ViewContext> {
  return {
    viewName: context.viewName,
    faceName: context.faceName,
    id: context.id,
    params: context.params,
    data: context.data,
    renderAsMesh: context.renderAsMesh,
    deviceType: context.deviceType,
    faces: context.faces,
    nestLevel: context.nestLevel,
    title: context.title,
    serverUrl: context.serverUrl,
    renderer: context.renderer,
  };
}
