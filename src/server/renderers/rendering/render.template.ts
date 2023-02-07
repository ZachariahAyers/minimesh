import type { FaceContext } from "../../../types/face.context";
import type { AnyObject } from "../../../types/object.any";
import type { FaceParams } from "../../../types/face.params";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { FaceRenderer } from "../../../types/face.renderer";
import { getRenderer } from "./get.renderer";
import { mutateMesh } from "../../../utils/face.utils";

/**
 * Render a template to HTML.
 * @param {FaceContext<AnyObject, AnyObject, FaceParams>} context - The context to render.
 * @return {string | Promise<string> | Buffer | Promise<Buffer>}  - The rendered template.
 * @author Zach Ayers
 */
export async function renderTemplate(
  context: FaceContext<AnyObject, FaceParams>
): Promise<string | Buffer> {
  context.request = {} as FastifyRequest;
  context.reply = {} as FastifyReply;
  const renderer: FaceRenderer = getRenderer(context);
  // Render the template and clean it up
  const template = await renderer.render(context);
  return context.renderAsMesh ? mutateMesh(template, context) : template;
}
