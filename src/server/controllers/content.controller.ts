import type { MeshInstance } from "../../types/mesh.simple.types";
import type { ViewContext } from "../../types/face.context";
import type {
  MeshDevServer,
  MeshServerOptions,
} from "../../types/mesh.server.options";
import type { FaceView } from "../../types/face.view";
import type { FacePreprocessor } from "../../types/face.preprocessor";
import type { FaceParams } from "../../types/face.params";
import type { Face } from "../../types/face";
import { FaceController } from "../abstract/face.controller";
import type { FastifyReply } from "fastify";
import { MINIMESH } from "../config/mesh.config";
import { combine } from "../../utils/object.utils";
import { encodeHtml } from "../../utils/html.utils";
import { encodeJson } from "../../utils/json.utils";
import { getSafeContext } from "../../utils/context.utils";
import type { AnyObject } from "../../types/object.any";

/**
 * This controller is the entrypoint for the CONTENT of a Face/Mesh.
 * @todo optimize, optimize, optimize
 * @author Zach Ayers
 */
export class ContentController extends FaceController {
  /** @inheritDoc */
  public register(
    app: MeshInstance,
    userOpts: MeshServerOptions,
    face: Face,
    view: FaceView,
    devServer: MeshDevServer
  ) {
    const preprocessorSortCriteria = (
      a: FacePreprocessor<AnyObject, FaceParams>,
      b: FacePreprocessor<AnyObject, FaceParams>
    ) => (a.priority ?? 0) - (b.priority ?? 0);
    const globalPreprocessors =
      userOpts.manifest.shared?.preprocessors?.sort(preprocessorSortCriteria) ??
      [];
    const facePreprocessors =
      face.shared?.preprocessors?.sort(preprocessorSortCriteria) ?? [];
    const viewPreprocessors =
      view.preprocessors?.sort(preprocessorSortCriteria) ?? [];

    app.get<{
      Querystring: { DATA_ONLY?: boolean };
      headers: { "x-minimesh-mesh-id"?: string };
    }>(
      `/${face.path}/${view.viewName}/`,
      {
        schema: {
          params: combine(
            userOpts.manifest.shared?.paramsSchema?.path ?? {},
            face.shared?.paramsSchema?.path ?? {},
            view.paramsSchema?.path ?? {}
          ),
          headers: combine(
            userOpts.manifest.shared?.paramsSchema?.headers ?? {},
            face.shared?.paramsSchema?.headers ?? {},
            view.paramsSchema?.headers ?? {}
          ),
          querystring: combine(
            userOpts.manifest.shared?.paramsSchema?.query ?? {},
            face.shared?.paramsSchema?.query ?? {},
            view.paramsSchema?.query ?? {}
          ),
        },
        // TODO, finalize auth patterns. There is basic auth when deployed for now.
        ...(!view.exposeAsMesh &&
          !MINIMESH.isLocal() && { preHandler: app.auth([app.basicAuth]) }),
        ...userOpts.manifest.shared?.routeOpts,
        ...face.shared?.routeOpts,
        ...view.routeOpts,
      },
      async (request, reply: FastifyReply) => {
        const DATA_ONLY = request.query.DATA_ONLY;

        // Build the Node Context
        const context = await this.buildNodeContext(
          view,
          app,
          userOpts,
          face,
          request,
          reply,
          DATA_ONLY
        );

        // Run Preprocessors
        await this.runPreprocessors(context, {
          global: globalPreprocessors,
          face: facePreprocessors,
          view: viewPreprocessors,
        });

        // If requesting data only, send back the public data.
        if (DATA_ONLY) {
          return reply.type("application/json").send(context.data);
        }

        // Inject any development wrappers to meshes
        if (context.renderAsMesh) {
          context.overrideTemplate(
            this.injectDevelopmentItems(context, face, view)
          );
        }

        // When local, always grab the newest template so HMR works effectively
        if (MINIMESH.isLocal() && view.getTemplate) {
          context.overrideTemplate(view.getTemplate());
        }

        // Finally, render the UI face
        let html: string | Buffer = await this.render(context);

        // Build a sanitized context object that may be exposed to the client
        const safeContext: ViewContext = getSafeContext(context);

        // Encode the face data
        const encodedId = encodeHtml(context.id);
        const encodedNodeName = encodeHtml(face.path);
        const encodedViewName = encodeHtml(context.viewName);
        const encodedClassNames =
          view.htmlContainerCssClassNames
            ?.map((className) => encodeHtml(className))
            .join(" ") ?? [];
        const encodedAttrs =
          view.htmlContainerAttributes
            ?.map((className) => encodeHtml(className))
            .join(" ") ?? [];

        // Build the data loader
        html = `${html}<script id="${
          MINIMESH.dataIdPrefix
        }${encodedId}" type="application/json">${encodeJson(
          safeContext
        )}</script>`;

        // If rendering as a face, include the encapsulation HTML & serialized context DTO
        if (!context.renderAsMesh) {
          html = `<${MINIMESH.htmlWrapperTag} ${MINIMESH.faceUrlIdentifier}="${context.serverUrl}" ${MINIMESH.faceIdIdentifier}="${encodedId}" ${MINIMESH.faceNameIdentifier}="${encodedNodeName}" ${MINIMESH.faceViewIdentifier}="${encodedViewName}" ${MINIMESH.faceNestIdentifier}="${context.nestLevel}" ${MINIMESH.faceDataIdentifier}="${encodedId}" class="${MINIMESH.faceClassIdentifier} ${encodedNodeName} ${encodedViewName} ${encodedClassNames}" ${encodedAttrs}>${html}</${MINIMESH.htmlWrapperTag}>`;
        }

        // Vite HMR Injection
        if (MINIMESH.isLocal() && context.renderAsMesh) {
          if (!devServer) {
            throw new Error("MiniMesh Dev server not found!");
          }

          html = await devServer.transformIndexHtml(
            request.url,
            html.toString()
          );
        }

        return reply.type("text/html").send(Buffer.from(html));
      }
    );
  }
}
