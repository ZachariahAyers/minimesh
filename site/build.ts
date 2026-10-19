import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createMeshServer } from "minimesh";
import { parse } from "node-html-parser";
import { faces as exampleFaces } from "../examples/basic/faces.ts";
import { buildAssets } from "../src/build.ts";
import { escapeHtml } from "../src/server/html.ts";
import { markdown } from "../src/server/render.ts";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const GITHUB = "https://github.com/ZachariahAyers/minimesh";
const SITE = fileURLToPath(new URL(".", import.meta.url));

/** Each documentation page: its Markdown source and its folder on the site. */
const PAGES = [
  { source: "docs/GUIDE.md", path: "", nav: "Guide" },
  { source: "docs/ARCHITECTURE.md", path: "architecture/", nav: "Architecture" },
  { source: "docs/API.md", path: "api/", nav: "API" },
  { source: "CHANGELOG.md", path: "changelog/", nav: "Changelog" },
] as const;

/** Repository paths that have a page of their own on the site. */
const SITE_LINKS: Record<string, string> = {
  ...Object.fromEntries(PAGES.map((page) => [page.source, page.path])),
  "README.md": "",
  "examples/basic": "example/",
};

export interface SiteOptions {
  /** URL path the site is served under, such as "/opensource/minimesh/". */
  base: string;
  out: string;
}

/** Builds the documentation and live demo as static files. Returns the files written. */
export async function buildSite(options: SiteOptions): Promise<string[]> {
  const base = `/${options.base.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
  await rm(options.out, { recursive: true, force: true });
  const written: string[] = [];
  const write = async (file: string, content: string): Promise<void> => {
    await mkdir(dirname(join(options.out, file)), { recursive: true });
    await writeFile(join(options.out, file), content);
    written.push(file);
  };
  const layout = await readFile(join(SITE, "layout.html"), "utf8");
  const nav = [...PAGES.map((page) => [page.nav, page.path]), ["Example", "example/"]]
    .map(([label, path]) => `<a href="${base}${path}">${label}</a>`)
    .join("");
  const render = (title: string, content: string): string =>
    layout
      .replaceAll("{{title}}", escapeHtml(title))
      .replaceAll("{{base}}", base)
      .replace("{{nav}}", nav)
      .replace("{{content}}", content);

  for (const page of PAGES) {
    const source = await readFile(join(REPO, page.source), "utf8");
    const html = await rewriteLinks(markdown.render(source), page.source, base);
    const title = source.match(/^# (.+)$/m)?.[1] ?? "MiniMesh";
    await write(
      `${page.path}index.html`,
      render(page.path === "" ? "MiniMesh" : `${title} | MiniMesh`, html),
    );
  }

  await write(
    "example/index.html",
    render(
      "Example | MiniMesh",
      `<h1>Live example</h1>
<p>The page below is <a href="${GITHUB}/tree/main/examples/basic">examples/basic</a>, rendered by
MiniMesh when this site was built. An EJS mesh composes a Preact face and a Markdown face; the
Preact face hydrates in your browser and the button sends an event to the page.</p>
<iframe class="demo" src="${base}demo/" title="MiniMesh example page" loading="lazy"></iframe>
<p><a href="${base}demo/">Open the example on its own</a>.</p>`,
    ),
  );
  await write(
    "404.html",
    render(
      "Not found | MiniMesh",
      `<h1>Not found</h1><p><a href="${base}">Back to the guide</a>.</p>`,
    ),
  );

  const demo = await buildDemo(options.out, `${base}demo`);
  written.push(...demo);

  await mkdir(join(options.out, "assets"), { recursive: true });
  for (const [from, to] of [
    [join(SITE, "site.css"), "assets/site.css"],
    [join(REPO, "node_modules/highlight.js/styles/github.css"), "assets/hljs-light.css"],
    [join(REPO, "node_modules/highlight.js/styles/github-dark.css"), "assets/hljs-dark.css"],
  ] as const) {
    await copyFile(from, join(options.out, to));
    written.push(to);
  }
  return written.sort();
}

/** Renders the example's mesh page with its islands, as a static snapshot under `prefix`. */
async function buildDemo(out: string, prefix: string): Promise<string[]> {
  const root = join(REPO, "examples/basic/faces");
  const assets = await buildAssets({ root, outdir: join(out, "demo"), conditions: ["source"] });
  const app = await createMeshServer({
    root,
    faces: exampleFaces,
    publicUrl: prefix,
    reloadTemplates: false,
    dev: false,
  });
  try {
    const response = await app.inject("/home/page/");
    if (response.statusCode !== 200)
      throw new Error(`Example page answered ${response.statusCode}.`);
    await writeFile(join(out, "demo/index.html"), response.body);
  } finally {
    await app.close();
  }
  return ["demo/index.html", ...assets.files.map((file) => `demo/${file}`)];
}

/**
 * Points Markdown links at the site: a document with its own page links there, any other file in
 * the repository links to GitHub, and a link to a missing file fails the build.
 */
async function rewriteLinks(html: string, source: string, base: string): Promise<string> {
  const root = parse(html);
  for (const link of root.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(href)) continue;
    const [path = "", hash = ""] = href.split(/(?=#)/);
    const target = posix.normalize(posix.join(posix.dirname(source), path)).replace(/\/$/, "");
    const page = SITE_LINKS[target];
    if (page !== undefined) {
      link.setAttribute("href", `${base}${page}${hash}`);
      continue;
    }
    const info = await stat(join(REPO, target)).catch(() => undefined);
    if (info === undefined) throw new Error(`${source} links to ${href}, which does not exist.`);
    link.setAttribute(
      "href",
      `${GITHUB}/${info.isDirectory() ? "tree" : "blob"}/main/${target}${hash}`,
    );
  }
  return root.toString();
}

if (import.meta.filename === process.argv[1]) {
  const { values } = parseArgs({
    options: {
      base: { type: "string", default: "/opensource/minimesh/" },
      out: { type: "string", default: join(REPO, "site-dist") },
    },
  });
  const files = await buildSite({ base: values.base, out: values.out });
  console.log(`site: ${files.length} files in ${values.out} for ${values.base}`);
}
