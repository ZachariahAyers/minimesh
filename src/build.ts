import { watch as watchFiles } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, sep } from "node:path";
import * as esbuild from "esbuild";
import * as sass from "sass";
import { ATTR } from "./shared.ts";

const ISLAND = /\.client\.(?:tsx?|jsx?)$/;
const STYLE = /\.(?:scss|sass|css)$/;

export interface BuildOptions {
  /** Directory that holds `<face>/<view>/` folders. */
  root: string;
  /** Where built assets go, mirroring the folders under `root`. */
  outdir: string;
  /** Rebuild on change until the process exits. */
  watch?: boolean;
  /** Extra package.json export conditions for resolving imports. */
  conditions?: string[];
}

export interface BuildResult {
  /** Files written, relative to `outdir`. */
  files: string[];
  /** Stops watching. Does nothing for a one-off build. */
  stop: () => Promise<void>;
}

/**
 * Bundles every `*.client.ts(x)` into a browser ES module and compiles every stylesheet scoped to
 * its view, so a face's CSS cannot leak onto the rest of a page.
 */
export async function buildAssets(options: BuildOptions): Promise<BuildResult> {
  const sources = (await readdir(options.root, { recursive: true }))
    .map((file) => file.split(sep).join("/"))
    .filter((file) => file.split("/").length >= 3);
  const islands = sources.filter((file) => ISLAND.test(file));
  const styles = sources.filter((file) => STYLE.test(file) && !basename(file).startsWith("_"));

  const esbuildOptions: esbuild.BuildOptions = {
    entryPoints: islands.map((file) => join(options.root, file)),
    outbase: options.root,
    outdir: options.outdir,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    jsxImportSource: "preact",
    sourcemap: true,
    minify: options.watch !== true,
    logLevel: "warning",
    ...(options.conditions && { conditions: options.conditions }),
  };
  const written = [
    ...islands.map((file) => file.replace(/\.[jt]sx?$/, ".js")),
    ...(await Promise.all(styles.map((file) => writeStyle(options, file)))),
  ];

  if (options.watch !== true) {
    if (islands.length > 0) await esbuild.build(esbuildOptions);
    return { files: written, stop: async () => {} };
  }

  const context = await esbuild.context(esbuildOptions);
  await context.watch();
  const watcher = watchFiles(options.root, { recursive: true }, (_event, file) => {
    const name = file?.split(sep).join("/");
    if (name === undefined || !STYLE.test(name)) return;
    for (const style of styles) {
      writeStyle(options, style).catch((error: unknown) => console.error(String(error)));
    }
  });
  return {
    files: written,
    stop: async () => {
      watcher.close();
      await context.dispose();
    },
  };
}

/**
 * Compiles one stylesheet, then nests the result inside its view's scope. Two passes, because
 * `@use` must stay at the top level of the file it appears in.
 */
async function writeStyle(options: BuildOptions, file: string): Promise<string> {
  const [face = "", view = ""] = file.split("/");
  const scope = `[${ATTR.face}="${face}"][${ATTR.view}="${view}"]`;
  const style = options.watch === true ? "expanded" : "compressed";
  const { css } = sass.compile(join(options.root, file), { style: "expanded" });
  // Sass may drop the quotes around attribute values, so match the scope either way.
  const root = new RegExp(
    `(\\[${ATTR.face}="?${escapeRegExp(face)}"?\\]\\[${ATTR.view}="?${escapeRegExp(view)}"?\\]) (?::root|html|body)\\b`,
    "g",
  );
  const scoped = sass
    .compileString(`${scope}{${css}}`, { syntax: "scss", style })
    // The view's root element plays :root, html and body for its own styles.
    .css.replace(root, "$1");
  const output = file.replace(STYLE, ".css");
  await mkdir(dirname(join(options.outdir, output)), { recursive: true });
  await writeFile(join(options.outdir, output), scoped);
  return output;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
