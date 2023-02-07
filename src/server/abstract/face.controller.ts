import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { FacePreprocessor } from "../../types/face.preprocessor";
import type {
  MeshDevServer,
  MeshServerOptions,
} from "../../types/mesh.server.options";
import type { AnyObject } from "../../types/object.any";
import type { MeshInstance } from "../../types/mesh.simple.types";
import type { RawTemplate } from "../../types/face.simple.types";
import type { FaceView } from "../../types/face.view";
import type { FaceParams } from "../../types/face.params";
import type { FaceDevice } from "../../types/face.device";
import type { Face } from "../../types/face";
import { FaceContext } from "../../types/face.context";
import { MeshController } from "./mesh.controller";
import { MINIMESH } from "../config/mesh.config";
import axios from "axios";
import parser from "ua-parser-js";
import { randomUUID } from "crypto";
import { isValidHttpUrl } from "../../utils/http.utils";
import { combine } from "../../utils/object.utils";
import { renderTemplate } from "../renderers/rendering/render.template";

type BasePreprocessorArray = Array<
  FacePreprocessor<{}, { headers: {}; path: {}; query: {}; body: {} }>
>;

/**
 * Base Controller Implementation for serving a MiniMesh Node (Face).
 * @author Zach Ayers
 */
export abstract class FaceController extends MeshController {
  /**
   * Register the controller.
   * @param {MeshInstance} app - The MiniMesh instance.
   * @param {MeshServerOptions} userOpts - The user-defined options.
   * @param {Face} face - The face to serve.
   * @param {FaceView} view - The view to serve.
   * @param devServer - The development server.
   * @returns {Promise<void>} - The promise to wait for.
   * @author Zach Ayers
   */
  abstract override register(
    app: MeshInstance,
    userOpts?: MeshServerOptions,
    face?: Face,
    view?: FaceView,
    devServer?: MeshDevServer
  ): void;

  /**
   * Run any MiniMesh preprocesseors.
   * @param {FaceContext<AnyObject, AnyObject, FaceParams>} context - The context to run the preprocessors on.
   * @param {{global: BasePreprocessorArray, face: BasePreprocessorArray, view: BasePreprocessorArray}} procs - The preprocessors to run.
   * @private
   * @author Zach Ayers
   */
  protected async runPreprocessors(
    context: FaceContext<AnyObject, FaceParams>,
    procs: {
      global: BasePreprocessorArray;
      face: BasePreprocessorArray;
      view: BasePreprocessorArray;
    }
  ) {
    // First - run view preprocessors
    for (const proc of procs.view) {
      await proc.preprocessor(context);
    }
    // Next - run face level preprocessors
    for (const proc of procs.face) {
      await proc.preprocessor(context);
    }
    // Finally - run global level preprocessors
    for (const proc of procs.global) {
      await proc.preprocessor(context);
    }
  }

  /**
   * When running in development mode, inject any items provided by the user in the 'developmentOptions' section.
   * @param {FaceContext} context - The context to inject into.
   * @param {Face} face - The face to inject into.
   * @param {FaceView} view - The view to inject into.
   * @return {string} - The rendered template.
   * @private
   * @author Zach Ayers
   */
  protected injectDevelopmentItems(
    context: FaceContext<AnyObject, FaceParams>,
    face: Face,
    view: FaceView
  ) {
    // If not local, do nothing to template
    if (
      !MINIMESH.isLocal() ||
      view.getTemplate === undefined ||
      view.templateFile === undefined
    ) {
      return context.template;
    }

    // Create a copy of the template
    let rawTemplate = view.getTemplate() as string;

    // if a view specific contentWrapper exists, apply it
    if (view.developmentOptions?.contentWrapper) {
      rawTemplate = view.developmentOptions.contentWrapper(rawTemplate);
    }

    // If a top level face contentWrapper exists, apply it
    if (face.developmentOptions?.contentWrapper) {
      rawTemplate = face.developmentOptions.contentWrapper(rawTemplate);
    }

    // Return the raw template
    return rawTemplate;
  }

  /**
   * Fetch all child faces of a view.
   * @param {MeshInstance} app - The MiniMesh instance.
   * @param {MeshServerOptions} userOpts - The user-defined options.
   * @param {Face} face - The face to serve.
   * @param {FaceView} view - The view to serve.
   * @param {any} params - The params to pass to the view.
   * @return {Promise<any>} - The promise to wait for.
   * @todo Post request instead?
   * @todo optimize, optimize, optimize
   * @todo Zach Ayers - This is where we fetch faces. This is kept simple for now so we can expand upon it with error reporting, caching, etc.
   * @todo bail out if requested face is the same, currently you can get into an infinite loop if you do this.
   * @private
   * @author Zach Ayers
   */
  protected async fetchViewFaces(
    app: MeshInstance,
    userOpts: MeshServerOptions,
    face: Face,
    view: FaceView,
    params: { headers: AnyObject; query: AnyObject }
  ): Promise<Record<string, Buffer>> {
    const childContentAsyncs: Promise<Record<string, Buffer>>[] = [];

    /**
     * Function used for pushing child fetches to the asyncs array
     * @param { any[] } arr
     */
    const pushToAsyncArr = (arr: FaceView["faces"]) => {
      (arr ?? []).forEach((child) => {
        childContentAsyncs.push(
          new Promise(async (resolve, _reject) => {
            // TODO - Bail out if requested face is the same - an infinite loop can occur
            const result = isValidHttpUrl(child.contentUrl)
              ? // Axios - External Fetch
                await axios
                  .get(child.contentUrl, {
                    timeout: child.requestTimeout,
                    headers: params.headers,
                    params: params.query,
                  })
                  .then((response) => response.data)
              : // Fastify - Internal Fetch
                await app
                  .inject()
                  .headers(params.headers)
                  .query(params.query)
                  .get(child.contentUrl)
                  .then((response) => response.rawPayload);
            resolve({
              [child.name]: Buffer.from(result),
            });
          })
        );
      });
    };

    // Push faces to awaitable Array
    pushToAsyncArr(userOpts.manifest.shared?.faces);
    pushToAsyncArr(face.shared?.faces);
    pushToAsyncArr(view.faces);

    const childResults = await Promise.all(childContentAsyncs);
    return combine(childResults);
  }

  /**
   * Build the "CONTEXT" of a view during the content building phase.
   * @param {FaceView} view - The view to build the context for.
   * @param {FastifyInstance} app - The fastify instance.
   * @param {MeshServerOptions} userOpts - The user-defined options.
   * @param {Face} face - The face to serve.
   * @param {FastifyRequest} request - The request to build the context for.
   * @param {FastifyReply} reply - The reply to build the context for.
   * @param {boolean} DATA_ONLY - Whether to only build the context for the data.
   * @return {Promise<FaceContext<AnyObject, AnyObject, FaceParams>>} - The promise to wait for.
   * @todo refactor ugly optional object syntax to use the 'coalesce' method from object utils.
   * @protected
   * @author Zach Ayers
   */
  protected async buildNodeContext(
    view: FaceView,
    app: FastifyInstance,
    userOpts: MeshServerOptions,
    face: Face,
    request: FastifyRequest,
    reply: FastifyReply,
    DATA_ONLY = false
  ): Promise<FaceContext<AnyObject, FaceParams>> {
    const meshIdHeader = MINIMESH.meshIdHeader;
    const faceIdHeader = MINIMESH.faceIdHeader;
    const nestLevelHeader = MINIMESH.nestLevelHeader;
    const uaInfo = parser(request.headers["user-agent"]);
    const device = uaInfo.device.type ?? "desktop";
    const meshId = request.headers[meshIdHeader] as string | undefined;
    const faceId = request.headers[faceIdHeader] as string | undefined;
    const resolvedMeshId = meshId ?? randomUUID();
    const nestLevel =
      (request.headers[nestLevelHeader] as string | undefined) ?? 0;
    const renderAsMesh =
      meshId === undefined ||
      meshId.length === 0 ||
      (MINIMESH.isLocal() && nestLevel === 0);

    if (isNaN(+nestLevel)) {
      throw new Error(
        `${face.path}|${view.viewName}: '${nestLevelHeader}' header is not a number. Can not calculate nest level. Found value: ${nestLevel}`
      );
    }

    return new FaceContext({
      renderAsMesh,
      ...(view.template !== undefined &&
        view.getTemplate !== undefined && {
          template: view.getTemplate() as RawTemplate,
        }),
      ...(view.templateFile !== undefined && {
        templateFile: view.templateFile,
      }),
      title: view.title ?? `${face.path} | ${view.viewName}`,
      serverUrl: request.protocol + "://" + request.hostname + request.url,
      nestLevel: Number(nestLevel),
      id: faceId !== undefined ? faceId : resolvedMeshId,
      faces: DATA_ONLY
        ? {}
        : await this.fetchViewFaces(app, userOpts, face, view, {
            headers: {
              [faceIdHeader]: randomUUID(),
              [meshIdHeader]: meshId ?? randomUUID(),
              [nestLevelHeader]: +nestLevel + 1,
              "user-agent": request.headers["user-agent"],
              ...(request.headers["authorization"] && {
                authorization: request.headers["authorization"],
              }),
              accept: "text/html",
              host: request.headers.host,
            },
            query: { ...(request.query as AnyObject) },
          }),
      viewName: view.viewName,
      faceName: face.path,
      data: new Map(),
      request: request,
      reply: reply,
      api: axios.create({ baseURL: `/${face.path}/${view.viewName}` }),
      helpers: {
        ...userOpts.manifest.shared?.helpers,
        ...face.shared?.helpers,
        ...view.helpers,
      },
      deviceType: device.toUpperCase() as FaceDevice,
      params: {
        headers: request.headers as AnyObject,
        path: request.params as AnyObject,
        query: request.query as AnyObject,
        body: request.body as AnyObject,
      },
    });
  }

  /**
   * Render the template
   * @param {FaceContext<AnyObject, AnyObject, FaceParams>} context - The context to render the template with.
   * @return {string | Promise<string> | Buffer | Promise<Buffer>} - The rendered template.
   * @protected
   * @author Zach Ayers
   */
  protected render(context: FaceContext<AnyObject, FaceParams>) {
    return renderTemplate(context);
  }
}
