import { readFileSync } from "node:fs";
import { extname } from "node:path";
import ejs from "ejs";
import MarkdownIt from "markdown-it";
import type { ComponentType } from "preact";
import type { ViewContext } from "../shared.ts";
import type { FaceContext, View } from "./types.ts";

export const TEMPLATE_EXTENSIONS: readonly string[] = [".html", ".ejs", ".md"];

const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true });

/** Turns a view's template into a render function, reading files now or on every render. */
export function compileView(
  view: View,
  file: string | undefined,
  reload: boolean,
): (context: FaceContext, client: ViewContext) => Promise<string> {
  if (typeof view.template === "function") {
    const component = view.template;
    return (_context, client) => renderPreact(component, client);
  }
  if (typeof view.template === "string") {
    const html = view.template;
    return async () => html;
  }
  if (file === undefined) {
    throw new Error(`View "${view.name}" needs a template or a templateFile.`);
  }
  const ext = extname(file);
  if (!TEMPLATE_EXTENSIONS.includes(ext)) {
    throw new Error(`No renderer for "${file}". Use ${TEMPLATE_EXTENSIONS.join(", ")}.`);
  }
  const cached = readFileSync(file, "utf8");
  const source = (): string => (reload ? readFileSync(file, "utf8") : cached);

  if (ext === ".md") return async () => markdown.render(source());
  if (ext === ".ejs") {
    return async (context) =>
      ejs.render(
        source(),
        {
          data: context.data,
          helpers: context.helpers,
          faces: context.faces,
          title: context.title,
        },
        {
          filename: file,
          strict: true,
          _with: false,
          destructuredLocals: ["data", "helpers", "faces", "title"],
        },
      );
  }
  return async () => source();
}

async function renderPreact(component: ComponentType<ViewContext>, client: ViewContext) {
  const [{ h }, { renderToString }] = await Promise.all([
    import("preact"),
    import("preact-render-to-string"),
  ]);
  return renderToString(h(component, client));
}
