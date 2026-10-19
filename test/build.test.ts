import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { buildAssets } from "../src/build.ts";

// Inside the repository, so islands resolve preact from its node_modules.
const scratch = fileURLToPath(new URL("../node_modules/.cache/minimesh-test/", import.meta.url));
mkdirSync(scratch, { recursive: true });

function project(files: Record<string, string>): { root: string; outdir: string } {
  const base = mkdtempSync(scratch);
  const root = join(base, "faces");
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return { root, outdir: join(base, "out") };
}

describe("buildAssets", () => {
  it("bundles each island into one browser module", async () => {
    const { root, outdir } = project({
      "cart/summary/summary.client.ts": 'import { label } from "./label.ts";\nconsole.log(label);',
      "cart/summary/label.ts": 'export const label: string = "cart-label";',
      "cart/summary/badge.client.tsx": "export const Badge = () => <b>1</b>;",
    });
    const { files } = await buildAssets({ root, outdir });
    assert.deepEqual(files.sort(), [
      "cart/summary/badge.client.js",
      "cart/summary/summary.client.js",
    ]);
    const js = readFileSync(join(outdir, "cart/summary/summary.client.js"), "utf8");
    assert.match(js, /cart-label/);
    assert.ok(!/\bimport\s*["'{*]/.test(js), "bundles local imports");
    assert.ok(existsSync(join(outdir, "cart/summary/summary.client.js.map")));
    assert.ok(!existsSync(join(outdir, "cart/summary/label.js")), "only islands are entry points");
    const badge = readFileSync(join(outdir, "cart/summary/badge.client.js"), "utf8");
    assert.ok(/as Badge\}/.test(badge), "keeps the island's export");
    assert.ok(!/\bimport\s*["'{*]/.test(badge), "bundles the JSX runtime instead of importing it");
  });

  it("scopes each stylesheet to its view and resolves @use", async () => {
    const { root, outdir } = project({
      "cart/summary/_colors.scss": "$accent: #c00;",
      "cart/summary/summary.styles.scss":
        '@use "colors";\n:root { --accent: #{colors.$accent}; }\nbody { margin: 0; }\n.total { color: colors.$accent; }\n@media (min-width: 40rem) { .total { font-size: 2rem; } }',
      "cart/summary/plain.css": "p { color: blue; }",
    });
    const { files } = await buildAssets({ root, outdir });
    assert.deepEqual(files.sort(), ["cart/summary/plain.css", "cart/summary/summary.styles.css"]);
    // Sass writes identifier attribute values without quotes.
    const scope = "[data-minimesh-face=cart][data-minimesh-view=summary]";
    const css = readFileSync(join(outdir, "cart/summary/summary.styles.css"), "utf8");
    assert.ok(css.includes(`${scope}{--accent: #c00}`), css);
    assert.ok(css.includes(`${scope}{margin:0}`), css);
    assert.ok(css.includes(`${scope} .total{color:#c00}`), css);
    assert.ok(css.includes(`@media(min-width: 40rem){${scope} .total{font-size:2rem}}`), css);
    assert.ok(!existsSync(join(outdir, "cart/summary/_colors.css")), "partials are not outputs");
    assert.equal(
      readFileSync(join(outdir, "cart/summary/plain.css"), "utf8").trim(),
      `${scope} p{color:blue}`,
    );
  });

  it("ignores files that are not inside a view folder", async () => {
    const { root, outdir } = project({ "shared.client.ts": "", "cart/x.scss": "a{b:c}" });
    assert.deepEqual((await buildAssets({ root, outdir })).files, []);
  });

  it("builds the example's islands and styles", async () => {
    const root = fileURLToPath(new URL("../examples/basic/faces/", import.meta.url));
    const outdir = mkdtempSync(scratch);
    const { files } = await buildAssets({ root, outdir, conditions: ["source"] });
    assert.deepEqual(files.sort(), [
      "greeting/card/card.client.js",
      "greeting/card/card.styles.css",
      "home/page/page.client.js",
      "home/page/page.styles.css",
    ]);
  });
});
