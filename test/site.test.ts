import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { before, describe, it } from "node:test";
import { parse } from "node-html-parser";
import { buildSite } from "../site/build.ts";

const BASE = "/opensource/minimesh/";
const out = mkdtempSync(join(tmpdir(), "minimesh-site-"));
let files: string[] = [];

before(async () => {
  files = await buildSite({ base: BASE, out });
});

const pages = (): string[] => files.filter((file) => file.endsWith(".html"));

describe("site", () => {
  it("builds every page, the live demo and its assets", () => {
    for (const file of [
      "index.html",
      "architecture/index.html",
      "api/index.html",
      "changelog/index.html",
      "example/index.html",
      "404.html",
      "demo/index.html",
      "demo/greeting/card/card.client.js",
      "demo/home/page/page.styles.css",
      "assets/site.css",
      "assets/hljs-light.css",
    ]) {
      assert.ok(files.includes(file), file);
      assert.ok(existsSync(join(out, file)), file);
    }
  });

  it("keeps every local link and asset under the base path, pointing at a real file", () => {
    let checked = 0;
    for (const page of pages()) {
      const root = parse(readFileSync(join(out, page), "utf8"));
      for (const element of root.querySelectorAll("[href], [src]")) {
        const url = element.getAttribute("href") ?? element.getAttribute("src") ?? "";
        if (/^(?:[a-z]+:|#)/i.test(url)) continue;
        assert.ok(url.startsWith(BASE), `${page}: ${url} is outside ${BASE}`);
        const path = url.slice(BASE.length).split("#")[0] ?? "";
        const file = path === "" || path.endsWith("/") ? `${path}index.html` : path;
        assert.ok(existsSync(join(out, file)), `${page}: ${url} has no file`);
        checked++;
      }
    }
    assert.ok(checked > 40, `checked ${checked} links`);
  });

  it("turns repository links into site pages or GitHub links, never .md files", () => {
    const guide = readFileSync(join(out, "index.html"), "utf8");
    assert.match(guide, new RegExp(`href="${BASE}architecture/"`));
    assert.match(guide, new RegExp(`href="${BASE}example/"`));
    assert.match(
      guide,
      /href="https:\/\/github\.com\/ZachariahAyers\/minimesh\/blob\/main\/LICENSE"/,
    );
    for (const page of pages()) {
      assert.doesNotMatch(
        readFileSync(join(out, page), "utf8"),
        /href="[^"]*\.md(?:#[^"]*)?"/,
        page,
      );
    }
  });

  it("highlights code in the docs", () => {
    assert.match(readFileSync(join(out, "index.html"), "utf8"), /<code class="hljs language-ts">/);
  });

  it("ships the demo ready to hydrate, with assets under the base path", () => {
    const demo = readFileSync(join(out, "demo/index.html"), "utf8");
    assert.match(demo, /<h2>Hello, there<\/h2>/);
    assert.match(demo, /data-minimesh-context/);
    assert.match(demo, new RegExp(`src="${BASE}demo/greeting/card/card.client.js"`));
    assert.match(
      readFileSync(join(out, "example/index.html"), "utf8"),
      new RegExp(`<iframe class="demo" src="${BASE}demo/"`),
    );
  });

  it("builds for the site root too", async () => {
    const rootOut = mkdtempSync(join(tmpdir(), "minimesh-site-"));
    await buildSite({ base: "/", out: rootOut });
    assert.match(readFileSync(join(rootOut, "index.html"), "utf8"), /href="\/assets\/site\.css"/);
    assert.ok(readdirSync(rootOut).includes("demo"));
  });
});

describe("API reference", () => {
  it("documents every export of every entry point", () => {
    const api = readFileSync(new URL("../docs/API.md", import.meta.url), "utf8");
    const names = new Set<string>();
    for (const entry of ["../src/index.ts", "../src/client/index.ts", "../src/preact.ts"]) {
      const source = readFileSync(new URL(entry, import.meta.url), "utf8");
      for (const block of source.matchAll(/export (?:type )?\{([^}]*)\}/g)) {
        for (const item of (block[1] ?? "").split(",")) {
          const name = item.replace(/\btype\b/, "").trim();
          if (name !== "") names.add(name);
        }
      }
      for (const match of source.matchAll(/export (?:async )?(?:function|const|class) (\w+)/g)) {
        names.add(match[1] ?? "");
      }
    }
    assert.ok(names.size > 20, `found ${names.size} exports`);
    const missing = [...names].filter((name) => !api.includes(`### \`${name}\``));
    assert.deepEqual(missing, []);
  });
});
