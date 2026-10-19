import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { NEST_HEADER, type ViewContext } from "../shared.ts";
import { renderChildren } from "./children.ts";
import { assetTags, builtName, fragment, page, rewriteAssets } from "./html.ts";
import { compileView } from "./render.ts";
import type { Face, FaceContext, MeshServerOptions, Preprocessor, View } from "./types.ts";

const NAME = /^[a-z\d][a-z\d-]*$/i;
const DEFAULT_MAX_NEST_LEVEL = 4;

function toPath(location: string | URL): string {
  return location instanceof URL || location.startsWith("file:")
    ? fileURLToPath(location)
    : location;
}

function nestLevelOf(request: FastifyRequest): number {
  const value = Number(request.headers[NEST_HEADER] ?? 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function assertValid(faces: Face[]): void {
  const seen = new Set<string>();
  for (const face of faces) {
    if (!NAME.test(face.name)) throw new Error(`Face name "${face.name}" must match ${NAME}.`);
    if (seen.has(face.name)) throw new Error(`Face "${face.name}" is declared twice.`);
    seen.add(face.name);
    const views = new Set<string>();
    for (const view of face.views) {
      if (!NAME.test(view.name)) throw new Error(`View name "${view.name}" must match ${NAME}.`);
      if (views.has(view.name))
        throw new Error(`View "${face.name}/${view.name}" is declared twice.`);
      views.add(view.name);
    }
  }
}

/**
 * Builds a Fastify server that renders every face view at `/<face>/<view>/`, with its data at
 * `data/` and its manifest at `manifest/`. The server is not listening yet: add plugins or hooks,
 * then call `listen`.
 */
export async function createMeshServer(options: MeshServerOptions): Promise<FastifyInstance> {
  assertValid(options.faces);
  const root = toPath(options.root);
  const baseUrl = (options.publicUrl ?? "").replace(/\/$/, "");
  const maxNestLevel = options.maxNestLevel ?? DEFAULT_MAX_NEST_LEVEL;
  const reload = options.reloadTemplates ?? process.env.NODE_ENV !== "production";
  const app = Fastify(options.fastify);

  if (options.assetsDir !== undefined) {
    await app.register(fastifyStatic, {
      root: toPath(options.assetsDir),
      setHeaders: (reply) => {
        // Pages on other origins load these as module scripts, which needs CORS.
        reply.header("access-control-allow-origin", "*");
      },
    });
  }

  app.get("/health", async () => ({ status: "ok" }));

  for (const face of options.faces) {
    for (const view of face.views) {
      registerView(app, face, view, { root, baseUrl, maxNestLevel, reload, options });
    }
  }
  return app;
}

interface Settings {
  root: string;
  baseUrl: string;
  maxNestLevel: number;
  reload: boolean;
  options: MeshServerOptions;
}

function registerView(app: FastifyInstance, face: Face, view: View, settings: Settings): void {
  const { options, baseUrl } = settings;
  const path = `/${face.name}/${view.name}/`;
  const dir = join(settings.root, face.name, view.name);
  const file = view.templateFile === undefined ? undefined : join(dir, view.templateFile);
  if (file !== undefined && !existsSync(file)) {
    throw new Error(`Template file for "${face.name}/${view.name}" not found: ${file}`);
  }
  const render = compileView(view, file, settings.reload);
  const preprocessors: Preprocessor[] = [
    ...(options.shared?.preprocessors ?? []),
    ...(face.shared?.preprocessors ?? []),
    ...(view.preprocessors ?? []),
  ];
  const helpers = { ...options.shared?.helpers, ...face.shared?.helpers, ...view.helpers };
  const children = [
    ...(options.shared?.faces ?? []),
    ...(face.shared?.faces ?? []),
    ...(view.faces ?? []),
  ];
  const hydratesChildren = typeof view.template === "function";
  const assets = assetTags(view.assets ?? [], `${baseUrl}${path}`);

  async function prepare(request: FastifyRequest, reply: FaceContext["reply"]) {
    const nestLevel = nestLevelOf(request);
    const context: FaceContext = {
      face: face.name,
      view: view.name,
      mesh: view.mesh === true && nestLevel === 0,
      nestLevel,
      request,
      reply,
      title: view.title ?? `${face.name} | ${view.name}`,
      data: {},
      helpers: { ...helpers },
      faces: {},
    };
    for (const preprocessor of preprocessors) await preprocessor(context);
    return context;
  }

  app.get(path, async (request, reply) => {
    const nestLevel = nestLevelOf(request);
    if (nestLevel > settings.maxNestLevel) {
      return reply.code(508).send({ error: `Faces nested deeper than ${settings.maxNestLevel}.` });
    }
    const context = await prepare(request, reply);
    context.faces = await renderChildren(app, request, children, nestLevel);
    const client: ViewContext = {
      face: context.face,
      view: context.view,
      mesh: context.mesh,
      title: context.title,
      data: context.data,
      faces: hydratesChildren ? context.faces : {},
      nestLevel,
      baseUrl,
    };
    const html = rewriteAssets(await render(context, client), `${baseUrl}${path}`);
    return reply
      .type("text/html; charset=utf-8")
      .send(context.mesh ? page(html, client, assets) : fragment(html, client, assets));
  });

  app.get(`${path}data/`, async (request, reply) => (await prepare(request, reply)).data);

  app.get(`${path}manifest/`, async () => ({
    face: face.name,
    view: view.name,
    title: view.title ?? null,
    mesh: view.mesh === true,
    assets: (view.assets ?? []).map((file) => `${baseUrl}${path}${builtName(file)}`),
    contentUrl: `${baseUrl}${path}`,
    dataUrl: `${baseUrl}${path}data/`,
  }));
}
