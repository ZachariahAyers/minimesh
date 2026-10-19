import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const KINDS = [
  "project",
  "face",
  "preprocessor",
  "plugin",
  "service",
  "model",
  "repository",
] as const;
export type Kind = (typeof KINDS)[number];

export const TEMPLATES = ["html", "ejs", "md", "preact"] as const;
export type TemplateKind = (typeof TEMPLATES)[number];

export interface GenerateOptions {
  kind: Kind;
  /** kebab-case name. For a face, "<face>/<view>". */
  name: string;
  /** Directory to write into. A project creates a folder here; the rest write inside a project. */
  cwd: string;
  /** Template language of a face view. Default "ejs". */
  template?: TemplateKind;
  /** Generate the face view as a mesh, a full page. */
  mesh?: boolean;
  /** Folder of faces inside a project. Default "faces". */
  facesDir?: string;
}

export interface GenerateResult {
  /** Files written, relative to `cwd`. */
  files: string[];
  /** What to do next, such as the face entry to add to the server. */
  next: string;
}

const KEBAB = /^[a-z][a-z\d]*(?:-[a-z\d]+)*$/;

const pascal = (name: string): string =>
  name.replace(/(?:^|-)([a-z\d])/g, (_match, letter: string) => letter.toUpperCase());
const camel = (name: string): string => pascal(name).replace(/^./, (c) => c.toLowerCase());

function assertName(name: string, what: string): void {
  if (!KEBAB.test(name)) throw new Error(`${what} "${name}" must be kebab-case, like "user-card".`);
}

/** Writes the files for one generator kind. Refuses to overwrite anything. */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const files = filesFor(options);
  for (const file of Object.keys(files)) {
    if (existsSync(join(options.cwd, file))) throw new Error(`${file} already exists.`);
  }
  for (const [file, content] of Object.entries(files)) {
    await mkdir(dirname(join(options.cwd, file)), { recursive: true });
    await writeFile(join(options.cwd, file), content);
  }
  return { files: Object.keys(files), next: nextStep(options) };
}

function filesFor(options: GenerateOptions): Record<string, string> {
  switch (options.kind) {
    case "project":
      return projectFiles(options.name);
    case "face":
      return faceFiles(options);
    case "preprocessor": {
      assertName(options.name, "Preprocessor");
      return { [`preprocessors/${options.name}.ts`]: preprocessorFile(options.name) };
    }
    case "plugin": {
      assertName(options.name, "Plugin");
      return { [`plugins/${options.name}.ts`]: pluginFile(options.name) };
    }
    case "service":
    case "model":
    case "repository": {
      assertName(options.name, pascal(options.kind));
      return {
        [`${options.kind === "repository" ? "repositories" : `${options.kind}s`}/${options.name}.${options.kind}.ts`]:
          classFile(options.kind, options.name),
      };
    }
  }
}

function nextStep(options: GenerateOptions): string {
  switch (options.kind) {
    case "project":
      return `cd ${options.name} && npm install && npm run dev`;
    case "face": {
      const [face = "", view = ""] = options.name.split("/");
      const template = options.template ?? "ejs";
      const entry =
        template === "preact"
          ? `template: ${pascal(view)}, assets: ["${view}.client.ts", "${view}.styles.scss"]`
          : `templateFile: "${view}.view.${template}"`;
      const mesh = options.mesh === true ? ", mesh: true" : "";
      const imported =
        template === "preact"
          ? `import { ${pascal(view)} } from "./${options.facesDir ?? "faces"}/${face}/${view}/${view}.view.ts";\n`
          : "";
      return `${imported}Add to faces in server.ts:\n  { name: "${face}", views: [{ name: "${view}", ${entry}${mesh} }] }`;
    }
    case "preprocessor":
      return `Add ${camel(options.name)} to a view's preprocessors.`;
    case "plugin":
      return `Add ${camel(options.name)} to the plugins option of createMeshServer.`;
    default:
      return `Import ${pascal(options.name)}${pascal(options.kind)} where you need it.`;
  }
}

function projectFiles(name: string): Record<string, string> {
  assertName(name, "Project");
  const page = "faces/home/page";
  return {
    [`${name}/package.json`]: `${JSON.stringify(
      {
        name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "minimesh dev server.ts --root faces --outdir dist",
          build: "minimesh build faces --outdir dist",
          start: "NODE_ENV=production node server.ts",
          insights: "minimesh insights",
        },
        dependencies: { fastify: "^5.0.0", minimesh: "^2.0.0", preact: "^11.0.0" },
        engines: { node: ">=22.18.0" },
      },
      null,
      2,
    )}\n`,
    [`${name}/tsconfig.json`]: `${JSON.stringify(
      {
        compilerOptions: {
          target: "es2023",
          lib: ["es2023", "dom"],
          module: "nodenext",
          types: ["node"],
          strict: true,
          erasableSyntaxOnly: true,
          verbatimModuleSyntax: true,
          allowImportingTsExtensions: true,
          noEmit: true,
        },
      },
      null,
      2,
    )}\n`,
    [`${name}/.gitignore`]: "node_modules/\ndist/\n",
    [`${name}/server.ts`]: `import { createMeshServer } from "minimesh";

const app = await createMeshServer({
  root: new URL("./faces/", import.meta.url),
  assetsDir: new URL("./dist/", import.meta.url),
  faces: [{ name: "home", views: [{ name: "page", mesh: true, templateFile: "page.view.ejs" }] }],
  fastify: { logger: true },
});

await app.listen({
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
});
`,
    [`${name}/${page}/page.view.ejs`]: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name}</title>
    <link rel="stylesheet" href="page.styles.scss" />
  </head>
  <body>
    <h1>${name}</h1>
    <p>Edit faces/home/page/page.view.ejs, or add a face with <code>npx minimesh generate face</code>.</p>
    <script src="page.client.ts"></script>
  </body>
</html>
`,
    [`${name}/${page}/page.styles.scss`]: stylesFile(),
    [`${name}/${page}/page.client.ts`]: clientFile("home", "page"),
  };
}

function faceFiles(options: GenerateOptions): Record<string, string> {
  const [face = "", view = "", ...rest] = options.name.split("/");
  if (rest.length > 0 || view === "")
    throw new Error(`A face name is "<face>/<view>", like "cart/summary".`);
  assertName(face, "Face");
  assertName(view, "View");
  const template = options.template ?? "ejs";
  if (!TEMPLATES.includes(template))
    throw new Error(`Template must be one of ${TEMPLATES.join(", ")}.`);
  const dir = `${options.facesDir ?? "faces"}/${face}/${view}`;
  const files: Record<string, string> = {
    [`${dir}/${view}.styles.scss`]: stylesFile(),
    [`${dir}/${view}.client.ts`]:
      template === "preact" ? preactClientFile(face, view) : clientFile(face, view),
  };
  const tags = `<link rel="stylesheet" href="${view}.styles.scss" />\n<script src="${view}.client.ts"></script>\n`;
  if (template === "html")
    files[`${dir}/${view}.view.html`] = `<p>${face}/${view} is ready.</p>\n${tags}`;
  if (template === "ejs")
    files[`${dir}/${view}.view.ejs`] = `<p><%= title %> is ready.</p>\n${tags}`;
  if (template === "md")
    files[`${dir}/${view}.view.md`] = `## ${face}/${view}\n\nThis view is ready.\n\n${tags}`;
  if (template === "preact") files[`${dir}/${view}.view.ts`] = preactViewFile(view);
  return files;
}

function stylesFile(): string {
  return `// Scoped to this view: :root, html and body mean the view's own element.
:root {
  display: block;
}
`;
}

function clientFile(face: string, view: string): string {
  return `import { defineView, type MeshEvent, MeshView } from "minimesh/client";

class ${pascal(view)}View extends MeshView {
  override onMount(): void {}

  override onMessage(_event: MeshEvent): void {}
}

defineView("${face}", "${view}", ${pascal(view)}View);
`;
}

function preactClientFile(face: string, view: string): string {
  return `import { defineView, MeshView } from "minimesh/client";
import { hydrateView } from "minimesh/preact";
import { ${pascal(view)} } from "./${view}.view.ts";

class ${pascal(view)}View extends MeshView {
  override onMount(): void {
    hydrateView(${pascal(view)}, this);
  }
}

defineView("${face}", "${view}", ${pascal(view)}View);
`;
}

function preactViewFile(view: string): string {
  return `import type { ViewContext } from "minimesh";
import { h, type JSX } from "preact";

/** Rendered on the server, then hydrated in the browser with the same props. */
export function ${pascal(view)}({ face, view }: ViewContext): JSX.Element {
  return h("p", null, \`\${face}/\${view} is ready.\`);
}
`;
}

function preprocessorFile(name: string): string {
  return `import type { Preprocessor } from "minimesh";

/** Runs before the view renders. Whatever it puts in data reaches the browser. */
export const ${camel(name)}: Preprocessor = async ({ request, data }) => {
  data.path = request.url;
};
`;
}

function pluginFile(name: string): string {
  return `import type { FastifyPluginAsync } from "fastify";

/** API routes for ${name}. Register it through the plugins option of createMeshServer. */
export const ${camel(name)}: FastifyPluginAsync = async (app) => {
  app.get("/api/${name}", async () => ({ ok: true }));
};
`;
}

function classFile(kind: "service" | "model" | "repository", name: string): string {
  const type = `${pascal(name)}${pascal(kind)}`;
  if (kind !== "model") return `export class ${type} {}\n`;
  return `export interface ${pascal(name)} {
  id: string;
}

export class ${type} implements ${pascal(name)} {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}
`;
}
