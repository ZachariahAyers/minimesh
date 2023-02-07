import type { MeshServerOptions } from "../../../types/mesh.server.options";
import type { Face } from "../../../types/face";
import type { FaceView } from "../../../types/face.view";
import type { FaceRenderer } from "../../../types/face.renderer";
import type { AnyObject } from "../../../types/object.any";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AxiosInstance } from "axios";
import type { FaceDevice } from "../../../types/face.device";
import { getRenderer } from "./get.renderer";
import { FaceContext } from "../../../types/face.context";
import { randomUUID } from "crypto";

/**
 * Prerender the template on the server, this allows us to examine the contents and adjust accordingly.
 * @param {MeshServerOptions} userOpts - The user options.
 * @param {Face} face - The face to render.
 * @param {FaceView} view - The view to render.
 * @return {string | Promise<string> | Buffer | Promise<Buffer>} - The rendered template.
 * @author Zach Ayers
 */
export function preRenderTemplate(
  userOpts: MeshServerOptions,
  face: Face,
  view: FaceView
): string {
  // Setup renderer var
  const renderer: FaceRenderer = getRenderer(view);
  const mockedFaces: Record<string, string> = {};
  const pushToFaceArr = (arr: FaceView["faces"]) => {
    arr?.forEach((child) => {
      mockedFaces[child.name] = `<div>${child.name}</div>`;
    });
  };

  pushToFaceArr(userOpts.manifest.shared?.faces);
  pushToFaceArr(face.shared?.faces);
  pushToFaceArr(view.faces);

  // Mock a FaceContext, pass in the template, and render
  return renderer
    .render(
      new FaceContext({
        ...(view.template !== undefined &&
          view.getTemplate !== undefined && { template: view.template }),
        ...(view.templateFile !== undefined &&
          view.getTemplate && {
            template: view.getTemplate() as string,
            templateFile: view.templateFile,
          }),
        nestLevel: 0,
        serverUrl: "http://127.0.0.1:3000",
        id: randomUUID(),
        renderAsMesh: false,
        faces: mockedFaces as AnyObject,
        faceName: face.path,
        viewName: view.viewName,
        data: new Map(),
        request: {} as FastifyRequest,
        reply: {} as FastifyReply,
        api: {} as AxiosInstance,
        helpers: {},
        deviceType: "DESKTOP" as FaceDevice,
        params: {
          headers: {} as AnyObject,
          path: {} as AnyObject,
          query: {} as AnyObject,
          body: {} as AnyObject,
        },
      })
    )
    .toString();
}
