import { type HTMLElement, parse } from "node-html-parser";
import { ATTR, type ViewContext } from "../shared.ts";

const PARSE_OPTIONS = { comment: true } as const;
const ABSOLUTE = /^(?:[a-z][a-z\d+.-]*:|\/|#)/i;
const SOURCE_EXT = /\.(?:tsx?|jsx|scss|sass)$/;
const SCRIPT_EXT = /\.(?:tsx?|jsx)$/;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** JSON that is safe inside a `<script type="application/json">` element. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(" ", "\\u2028")
    .replaceAll(" ", "\\u2029");
}

/** Maps a source file name to the file `minimesh build` writes for it. */
export function builtName(file: string): string {
  return file.replace(/\.(?:tsx?|jsx)$/, ".js").replace(/\.(?:scss|sass)$/, ".css");
}

/**
 * Points relative `<script src>` and `<link href>` at this view's built assets, so the markup
 * still resolves after another page embeds it. Scripts built from TypeScript become modules.
 */
export function rewriteAssets(html: string, base: string): string {
  const root = parse(html, PARSE_OPTIONS);
  let changed = false;
  for (const element of root.querySelectorAll("script[src], link[href]")) {
    const attr = element.tagName === "SCRIPT" ? "src" : "href";
    const value = element.getAttribute(attr);
    if (value === undefined || ABSOLUTE.test(value)) continue;
    element.setAttribute(attr, base + (SOURCE_EXT.test(value) ? builtName(value) : value));
    if (attr === "src" && SCRIPT_EXT.test(value)) element.setAttribute("type", "module");
    changed = true;
  }
  return changed ? root.toString() : html;
}

/** Tags that load a view's listed assets from `base`. */
export function assetTags(assets: string[], base: string): string {
  return assets
    .map((file) => {
      const url = escapeHtml(base + builtName(file));
      return /\.(?:s[ac]ss|css)$/.test(file)
        ? `<link rel="stylesheet" href="${url}">`
        : `<script type="module" src="${url}"></script>`;
    })
    .join("");
}

function contextScript(context: ViewContext): string {
  return `<script type="application/json" ${ATTR.context}>${scriptJson(context)}</script>`;
}

function marker(context: ViewContext): string {
  return `${ATTR.face}="${escapeHtml(context.face)}" ${ATTR.view}="${escapeHtml(context.view)}"`;
}

/** Wraps a face's markup so the browser runtime can find it and its context. Assets go first. */
export function fragment(html: string, context: ViewContext, assets = ""): string {
  return `${assets}<section class="minimesh-face" ${marker(context)}>${html}${contextScript(context)}</section>`;
}

/**
 * Finishes a mesh as a full HTML page: adds the shell if the template has none, moves face
 * stylesheets into the head once each, drops repeated module scripts, and adds the context.
 */
export function page(html: string, context: ViewContext, assets = ""): string {
  const source = /<body[\s>]/i.test(html)
    ? html
    : `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(context.title)}</title></head><body>${html}</body></html>`;
  const root = parse(source, PARSE_OPTIONS);
  const head = root.querySelector("head") ?? prependHead(root, context);
  const body = root.querySelector("body") as HTMLElement;

  body.insertAdjacentHTML("beforeend", assets);
  const styles = new Set(
    head.querySelectorAll("link[href]").map((link) => link.getAttribute("href")),
  );
  for (const link of body.querySelectorAll('link[rel="stylesheet"][href]')) {
    const href = link.getAttribute("href");
    link.remove();
    if (!styles.has(href)) {
      styles.add(href);
      head.appendChild(link);
    }
  }

  const scripts = new Set<string | undefined>();
  for (const script of root.querySelectorAll('script[type="module"][src]')) {
    const src = script.getAttribute("src");
    if (scripts.has(src)) script.remove();
    else scripts.add(src);
  }

  body.setAttribute(ATTR.face, context.face);
  body.setAttribute(ATTR.view, context.view);
  body.insertAdjacentHTML("beforeend", contextScript(context));
  return root.toString();
}

function prependHead(root: HTMLElement, context: ViewContext): HTMLElement {
  const html = root.querySelector("html") ?? root;
  html.insertAdjacentHTML(
    "afterbegin",
    `<head><meta charset="utf-8"><title>${escapeHtml(context.title)}</title></head>`,
  );
  return root.querySelector("head") as HTMLElement;
}
