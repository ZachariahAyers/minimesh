import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { NEST_HEADER, type ViewContext } from "../shared.ts";
import { renderChildren } from "./children.ts";
import { detectDevice } from "./device.ts";
import { assetTags, builtName, fragment, page, rewriteAssets } from "./html.ts";
import { liveScript, registerLiveReload } from "./live.ts";
import { compileView, renderTemplate } from "./render.ts";
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
  const dev = options.dev ?? process.env.MINIMESH_DEV === "1";
  const app = Fastify(options.fastify);

  for (const plugin of options.plugins ?? []) await app.register(plugin);

  // Pages on other origins load these as module scripts, which needs CORS.
  const cors = (reply: { header: (name: string, value: string) => unknown }) => {
    reply.header("access-control-allow-origin", "*");
  };
  const assetsDir = options.assetsDir === undefined ? undefined : toPath(options.assetsDir);
  if (assetsDir !== undefined) {
    await app.register(fastifyStatic, { root: assetsDir, setHeaders: cors });
  }
  for (const dir of options.staticDirs ?? []) {
    await app.register(fastifyStatic, {
      root: toPath(dir.root),
      prefix: dir.prefix,
      decorateReply: assetsDir === undefined && dir === options.staticDirs?.[0],
      setHeaders: cors,
    });
  }
  if (dev) registerLiveReload(app, [root, ...(assetsDir === undefined ? [] : [assetsDir])]);

  app.get("/health", async () => ({ status: "ok" }));

  for (const face of options.faces) {
    for (const view of face.views) {
      registerView(app, face, view, { root, baseUrl, maxNestLevel, reload, dev, options });
    }
  }
  return app;
}

interface Settings {
  root: string;
  baseUrl: string;
  maxNestLevel: number;
  reload: boolean;
  dev: boolean;
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
  const routeOptions = {
    ...options.shared?.routeOptions,
    ...face.shared?.routeOptions,
    ...view.routeOptions,
  };
  const devWrapper = view.devWrapper ?? face.shared?.devWrapper ?? options.shared?.devWrapper;
  const wrapper = { className: view.className, attributes: view.attributes };

  async function prepare(request: FastifyRequest, reply: FaceContext["reply"]) {
    const nestLevel = nestLevelOf(request);
    const context: FaceContext = {
      face: face.name,
      view: view.name,
      // In dev mode a face requested on its own renders as a page, so it can be previewed.
      mesh: nestLevel === 0 && (view.mesh === true || settings.dev),
      nestLevel,
      request,
      reply,
      device: detectDevice(request.headers),
      title: view.title ?? `${face.name} | ${view.name}`,
      data: {},
      helpers: { ...helpers },
      faces: {},
    };
    for (const preprocessor of preprocessors) await preprocessor(context);
    return context;
  }

  app.get(path, routeOptions, async (request, reply) => {
    const nestLevel = nestLevelOf(request);
    if (nestLevel > settings.maxNestLevel) {
      return reply.code(508).send({ error: `Faces nested deeper than ${settings.maxNestLevel}.` });
    }
    const context = await prepare(request, reply);
    context.faces = await renderChildren(app, request, children, nestLevel);
    const template = context.template;
    const client: ViewContext = {
      face: context.face,
      view: context.view,
      mesh: context.mesh,
      title: context.title,
      data: context.data,
      faces: hydratesChildren || typeof template === "function" ? context.faces : {},
      nestLevel,
      baseUrl,
      device: context.device,
      params: {
        path: { ...(request.params as Record<string, unknown>) },
        query: { ...(request.query as Record<string, unknown>) },
      },
      dev: settings.dev,
    };
    const rendered =
      template === undefined
        ? await render(context, client)
        : await renderTemplate(template, client);
    let html = rewriteAssets(rendered, `${baseUrl}${path}`);
    if (!context.mesh) {
      return reply.type("text/html; charset=utf-8").send(fragment(html, client, assets, wrapper));
    }
    const live = settings.dev ? liveScript(baseUrl) : "";
    if (view.mesh !== true) {
      // A dev preview of a face: keep its wrapper so its island mounts, then apply devWrapper.
      html = fragment(html, { ...client, mesh: false }, assets, wrapper);
      html = devWrapper === undefined ? html : devWrapper(html);
      return reply.type("text/html; charset=utf-8").send(page(html, client, live, false));
    }
    return reply.type("text/html; charset=utf-8").send(page(html, client, assets + live));
  });

  app.get(
    `${path}data/`,
    routeOptions,
    async (request, reply) => (await prepare(request, reply)).data,
  );

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
