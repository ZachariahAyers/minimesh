import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import type { FastifyInstance } from "fastify";
import { createMeshServer, type Face, type MeshServerOptions } from "minimesh";
import { faces as exampleFaces } from "../examples/basic/faces.ts";

const exampleRoot = new URL("../examples/basic/faces/", import.meta.url);
const apps: FastifyInstance[] = [];

async function server(options: Partial<MeshServerOptions> & Pick<MeshServerOptions, "faces">) {
  const app = await createMeshServer({ root: tmpdir(), ...options });
  apps.push(app);
  return app;
}

function contextOf(html: string): Record<string, unknown> {
  const match = html.match(
    /<script type="application\/json" data-minimesh-context>([^<]*)<\/script>/,
  );
  assert.ok(match?.[1], "context script present");
  return JSON.parse(match[1]);
}

afterEach(async () => {
  mock.restoreAll();
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("the example", () => {
  it("composes the Preact card and the Markdown note into the EJS page", async () => {
    const app = await server({ root: exampleRoot, faces: exampleFaces });
    const response = await app.inject("/home/page/?name=Ada");
    assert.equal(response.statusCode, 200);
    assert.match(String(response.headers["content-type"]), /^text\/html/);
    const html = response.body;
    assert.match(html, /<title>MiniMesh example<\/title>/);
    assert.match(html, /<h2>Hello, Ada<\/h2>/);
    assert.match(html, /<strong>Preact<\/strong>/);
    assert.match(html, /<body data-minimesh-face="home" data-minimesh-view="page">/);
    // Each view's stylesheet ends up in the head, its scripts load as modules.
    const head = html.slice(0, html.indexOf("<body"));
    assert.match(head, /href="\/home\/page\/page\.styles\.css"/);
    assert.match(head, /href="\/greeting\/card\/card\.styles\.css"/);
    assert.match(html, /<script type="module" src="\/greeting\/card\/card\.client\.js"><\/script>/);
    assert.match(html, /src="\/home\/page\/page\.client\.js" type="module"/);
  });

  it("serves the card as a fragment whose context carries the preprocessed data", async () => {
    const app = await server({ root: exampleRoot, faces: exampleFaces });
    const html = (await app.inject("/greeting/card/?name=Grace")).body;
    assert.match(
      html,
      /^<script type="module" src="\/greeting\/card\/card\.client\.js"><\/script><link /,
    );
    assert.match(html, /<section class="minimesh-face" data-minimesh-face="greeting"/);
    const context = contextOf(html);
    assert.deepEqual(context.data, { name: "Grace" });
    assert.equal(context.mesh, false);
  });

  it("answers data, manifest and health routes", async () => {
    const app = await server({ root: exampleRoot, faces: exampleFaces });
    assert.deepEqual((await app.inject("/greeting/card/data/?name=Lin")).json(), { name: "Lin" });
    assert.deepEqual((await app.inject("/greeting/card/manifest/")).json(), {
      face: "greeting",
      view: "card",
      title: null,
      mesh: false,
      assets: ["/greeting/card/card.client.js", "/greeting/card/card.styles.css"],
      contentUrl: "/greeting/card/",
      dataUrl: "/greeting/card/data/",
    });
    assert.deepEqual((await app.inject("/health")).json(), { status: "ok" });
  });

  it("uses publicUrl for every URL it hands out", async () => {
    const app = await server({
      root: exampleRoot,
      faces: exampleFaces,
      publicUrl: "https://faces.example.com/",
    });
    const html = (await app.inject("/greeting/card/")).body;
    assert.match(html, /src="https:\/\/faces\.example\.com\/greeting\/card\/card\.client\.js"/);
    assert.equal(contextOf(html).baseUrl, "https://faces.example.com");
  });
});

describe("rendering", () => {
  it("runs shared, face and view preprocessors in that order", async () => {
    const order: string[] = [];
    const app = await server({
      shared: { preprocessors: [() => void order.push("shared")] },
      faces: [
        {
          name: "a",
          shared: { preprocessors: [() => void order.push("face")] },
          views: [
            { name: "b", template: "x", preprocessors: [async () => void order.push("view")] },
          ],
        },
      ],
    });
    await app.inject("/a/b/");
    assert.deepEqual(order, ["shared", "face", "view"]);
  });

  it("never sends request headers to the browser", async () => {
    const app = await server({ faces: [{ name: "a", views: [{ name: "b", template: "x" }] }] });
    const html = (await app.inject({ url: "/a/b/", headers: { authorization: "Bearer secret" } }))
      .body;
    assert.ok(!html.includes("secret"));
    assert.deepEqual(Object.keys(contextOf(html)).sort(), [
      "baseUrl",
      "data",
      "face",
      "faces",
      "mesh",
      "nestLevel",
      "title",
      "view",
    ]);
  });

  it("escapes data that tries to close the context script", async () => {
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "x",
              preprocessors: [
                ({ data }) => {
                  data.evil = "</script><script>alert(1)</script>";
                },
              ],
            },
          ],
        },
      ],
    });
    const html = (await app.inject("/a/b/")).body;
    assert.equal(html.match(/<\/script>/g)?.length, 1);
    assert.equal(
      (contextOf(html).data as { evil: string }).evil,
      "</script><script>alert(1)</script>",
    );
  });

  it("renders a mesh as a fragment when another face embeds it", async () => {
    const app = await server({
      faces: [{ name: "a", views: [{ name: "b", mesh: true, template: "<p>x</p>" }] }],
    });
    assert.match((await app.inject("/a/b/")).body, /^<!doctype html>/);
    const nested = (await app.inject({ url: "/a/b/", headers: { "x-minimesh-nest-level": "1" } }))
      .body;
    assert.match(nested, /^<section/);
  });

  it("re-reads template files when reloadTemplates is on, and caches them when off", async () => {
    const root = mkdtempSync(join(tmpdir(), "minimesh-"));
    mkdirSync(join(root, "a", "b"), { recursive: true });
    const file = join(root, "a", "b", "b.html");
    writeFileSync(file, "<p>one</p>");
    const faces: Face[] = [{ name: "a", views: [{ name: "b", templateFile: "b.html" }] }];
    const live = await server({ root, faces, reloadTemplates: true });
    const cached = await server({ root, faces, reloadTemplates: false });
    writeFileSync(file, "<p>two</p>");
    assert.match((await live.inject("/a/b/")).body, /two/);
    assert.match((await cached.inject("/a/b/")).body, /one/);
  });
});

describe("child faces", () => {
  it("replaces a failing face with a comment and still renders the page", async () => {
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              mesh: true,
              template: "<p>page</p>",
              faces: [{ name: "gone", url: "/no/such/" }],
            },
          ],
        },
      ],
    });
    const response = await app.inject("/a/b/");
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /<p>page<\/p>/);
  });

  it("stops a face that embeds itself at the nesting limit", async () => {
    const levels: number[] = [];
    const app = await server({
      maxNestLevel: 2,
      faces: [
        {
          name: "loop",
          views: [
            {
              name: "me",
              template: "<i>me</i>",
              faces: [{ name: "me", url: "/loop/me/" }],
              preprocessors: [({ nestLevel }) => void levels.push(nestLevel)],
            },
          ],
        },
      ],
    });
    const response = await app.inject("/loop/me/");
    assert.equal(response.statusCode, 200);
    assert.deepEqual(levels.sort(), [0, 1, 2]);
    assert.equal(
      (await app.inject({ url: "/loop/me/", headers: { "x-minimesh-nest-level": "3" } }))
        .statusCode,
      508,
    );
  });

  it("fetches a remote face without forwarding cookies or credentials", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => new Response("<b>remote</b>"));
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "page",
              faces: [
                {
                  name: "r",
                  url: "https://faces.example.com/r/v/",
                  headers: { authorization: "Basic cmVtb3Rl" },
                },
              ],
            },
          ],
        },
      ],
    });
    await app.inject({
      url: "/a/b/?q=1",
      headers: { cookie: "session=1", authorization: "Bearer user", "user-agent": "test-agent" },
    });
    assert.equal(fetchMock.mock.callCount(), 1);
    const call = fetchMock.mock.calls[0];
    assert.ok(call);
    const [url, init] = call.arguments as unknown as [string, RequestInit];
    assert.equal(url, "https://faces.example.com/r/v/?q=1");
    const headers = init.headers as Record<string, string>;
    assert.equal(headers.cookie, undefined);
    assert.equal(headers.authorization, "Basic cmVtb3Rl");
    assert.equal(headers["user-agent"], "test-agent");
    assert.equal(headers["x-minimesh-nest-level"], "1");
  });

  it("gives child HTML to Preact templates only, which hydrate it", async () => {
    const { h } = await import("preact");
    const child = { name: "c", views: [{ name: "v", template: "<b>child</b>" }] };
    const app = await server({
      faces: [
        child,
        {
          name: "p",
          views: [
            {
              name: "preact",
              template: () => h("div", null, "x"),
              faces: [{ name: "c", url: "/c/v/" }],
            },
            { name: "html", template: "x", faces: [{ name: "c", url: "/c/v/" }] },
          ],
        },
      ],
    });
    const preact = contextOf((await app.inject("/p/preact/")).body);
    const html = contextOf((await app.inject("/p/html/")).body);
    assert.match(String((preact.faces as Record<string, string>).c), /<b>child<\/b>/);
    assert.deepEqual(html.faces, {});
  });
});

describe("configuration", () => {
  const view = { name: "v", template: "x" };

  it("rejects duplicate faces and views", async () => {
    await assert.rejects(
      server({
        faces: [
          { name: "a", views: [view] },
          { name: "a", views: [view] },
        ],
      }),
      /declared twice/,
    );
    await assert.rejects(server({ faces: [{ name: "a", views: [view, view] }] }), /declared twice/);
  });

  it("rejects names that are not URL-safe", async () => {
    await assert.rejects(server({ faces: [{ name: "../etc", views: [view] }] }), /must match/);
  });

  it("rejects a missing template file and an unknown template type", async () => {
    await assert.rejects(
      server({ faces: [{ name: "a", views: [{ name: "v", templateFile: "nope.html" }] }] }),
      /not found/,
    );
    const root = mkdtempSync(join(tmpdir(), "minimesh-"));
    mkdirSync(join(root, "a", "v"), { recursive: true });
    writeFileSync(join(root, "a", "v", "v.pug"), "p x");
    await assert.rejects(
      server({ root, faces: [{ name: "a", views: [{ name: "v", templateFile: "v.pug" }] }] }),
      /No renderer/,
    );
  });

  it("serves built assets with a CORS header so other origins can load them", async () => {
    const assetsDir = mkdtempSync(join(tmpdir(), "minimesh-"));
    mkdirSync(join(assetsDir, "a", "v"), { recursive: true });
    writeFileSync(join(assetsDir, "a", "v", "v.client.js"), "export {};");
    const app = await server({ assetsDir, faces: [{ name: "a", views: [view] }] });
    const response = await app.inject("/a/v/v.client.js");
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["access-control-allow-origin"], "*");
    assert.equal(response.body, "export {};");
  });
});
