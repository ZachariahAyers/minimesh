import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { createMeshServer, type Face } from "minimesh";
import { buildAssets } from "../src/build.ts";
import { generate, TEMPLATES } from "../src/generate.ts";

// Generated code imports "minimesh" and "preact"; this scratch folder resolves both to the repo.
const repo = fileURLToPath(new URL("..", import.meta.url));
// Outside node_modules, where Node refuses to strip types.
const scratch = join(repo, ".cache/generate");
mkdirSync(join(scratch, "node_modules"), { recursive: true });
if (!existsSync(join(scratch, "node_modules/minimesh"))) {
  symlinkSync(repo, join(scratch, "node_modules/minimesh"), "dir");
}

const apps: FastifyInstance[] = [];
after(() => Promise.all(apps.map((app) => app.close())));

describe("generate", () => {
  it("scaffolds a project whose page renders and whose assets build", async () => {
    const cwd = mkdtempSync(join(scratch, "case-"));
    const { files, next } = await generate({ kind: "project", name: "shop", cwd });
    assert.deepEqual(files.sort(), [
      "shop/.gitignore",
      "shop/faces/home/page/page.client.ts",
      "shop/faces/home/page/page.styles.scss",
      "shop/faces/home/page/page.view.ejs",
      "shop/package.json",
      "shop/server.ts",
      "shop/tsconfig.json",
    ]);
    assert.match(next, /npm run dev/);
    const pkg = JSON.parse(readFileSync(join(cwd, "shop/package.json"), "utf8"));
    assert.equal(pkg.scripts.dev, "minimesh dev server.ts --root faces --outdir dist");

    const root = join(cwd, "shop/faces");
    const app = await createMeshServer({
      root,
      faces: [
        { name: "home", views: [{ name: "page", mesh: true, templateFile: "page.view.ejs" }] },
      ],
    });
    apps.push(app);
    const html = (await app.inject("/home/page/")).body;
    assert.match(html, /<h1>shop<\/h1>/);
    assert.match(html, /src="\/home\/page\/page\.client\.js" type="module"/);
    const built = await buildAssets({ root, outdir: join(cwd, "out"), conditions: ["source"] });
    assert.deepEqual(built.files.sort(), ["home/page/page.client.js", "home/page/page.styles.css"]);
  });

  it("scaffolds a face in every template language, each one rendering", async () => {
    const cwd = mkdtempSync(join(scratch, "case-"));
    const faces: Face[] = [];
    for (const template of TEMPLATES) {
      const view = `${template}-view`;
      const result = await generate({ kind: "face", name: `cart/${view}`, cwd, template });
      assert.ok(result.files.includes(`faces/cart/${view}/${view}.client.ts`));
      assert.match(result.next, new RegExp(`name: "${view}"`));
      if (template === "preact") {
        const module = await import(join(cwd, `faces/cart/${view}/${view}.view.ts`));
        faces.push({ name: "x", views: [{ name: view, template: module.PreactView }] });
      } else {
        faces.push({
          name: `cart-${template}`,
          views: [{ name: view, templateFile: `${view}.view.${template}` }],
        });
      }
    }
    // Template files live under faces/cart/<view>; serve each from that folder.
    for (const face of faces) {
      const app = await createMeshServer({
        root: join(cwd, face.name === "x" ? "faces" : "faces"),
        faces: [{ ...face, name: "cart" }],
      });
      apps.push(app);
      const view = face.views[0]?.name ?? "";
      const response = await app.inject(`/cart/${view}/`);
      assert.equal(response.statusCode, 200, view);
      assert.match(response.body, /is ready/, view);
    }
    const built = await buildAssets({
      root: join(cwd, "faces"),
      outdir: join(cwd, "out"),
      conditions: ["source"],
    });
    assert.equal(built.files.length, TEMPLATES.length * 2);
  });

  it("writes typed stubs for preprocessors, plugins, services, models and repositories", async () => {
    const cwd = mkdtempSync(join(scratch, "case-"));
    const expected = {
      preprocessor: "preprocessors/user-card.ts",
      plugin: "plugins/user-card.ts",
      service: "services/user-card.service.ts",
      model: "models/user-card.model.ts",
      repository: "repositories/user-card.repository.ts",
    } as const;
    for (const [kind, file] of Object.entries(expected)) {
      const result = await generate({
        kind: kind as keyof typeof expected,
        name: "user-card",
        cwd,
      });
      assert.deepEqual(result.files, [file]);
    }
    const preprocessor = await import(join(cwd, expected.preprocessor));
    const data: Record<string, unknown> = {};
    await preprocessor.userCard({ request: { url: "/x/" }, data });
    assert.deepEqual(data, { path: "/x/" });
    const plugin = await import(join(cwd, expected.plugin));
    const app = await createMeshServer({ root: cwd, faces: [], plugins: [plugin.userCard] });
    apps.push(app);
    assert.deepEqual((await app.inject("/api/user-card")).json(), { ok: true });
    const model = await import(join(cwd, expected.model));
    assert.equal(new model.UserCardModel("7").id, "7");
    const service = await import(join(cwd, expected.service));
    assert.equal(typeof service.UserCardService, "function");
  });

  it("refuses bad names and never overwrites", async () => {
    const cwd = mkdtempSync(join(scratch, "case-"));
    await assert.rejects(generate({ kind: "face", name: "Cart/x", cwd }), /kebab-case/);
    await assert.rejects(generate({ kind: "face", name: "cart", cwd }), /<face>\/<view>/);
    await assert.rejects(generate({ kind: "service", name: "../x", cwd }), /kebab-case/);
    await generate({ kind: "service", name: "a", cwd });
    await assert.rejects(generate({ kind: "service", name: "a", cwd }), /already exists/);
  });
});
