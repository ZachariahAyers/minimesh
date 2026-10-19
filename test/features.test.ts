import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";
import { createMeshServer, type MeshServerOptions } from "minimesh";
import { detectDevice } from "../src/server/device.ts";

const apps: FastifyInstance[] = [];

async function server(options: Partial<MeshServerOptions> & Pick<MeshServerOptions, "faces">) {
  const app = await createMeshServer({ root: tmpdir(), dev: false, ...options });
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
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("device detection", () => {
  it("classifies phones, tablets and desktops from the user agent", () => {
    assert.equal(detectDevice({ "user-agent": IPHONE }), "mobile");
    assert.equal(detectDevice({ "user-agent": IPAD }), "tablet");
    assert.equal(detectDevice({ "user-agent": DESKTOP }), "desktop");
  });

  it("trusts the mobile client hint and defaults to desktop", () => {
    assert.equal(detectDevice({ "sec-ch-ua-mobile": "?1", "user-agent": DESKTOP }), "mobile");
    assert.equal(detectDevice({}), "desktop");
  });

  it("reaches preprocessors and the browser", async () => {
    let seen = "";
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "x",
              preprocessors: [
                ({ device }) => {
                  seen = device;
                },
              ],
            },
          ],
        },
      ],
    });
    const html = (await app.inject({ url: "/a/b/", headers: { "user-agent": IPHONE } })).body;
    assert.equal(seen, "mobile");
    assert.equal(contextOf(html).device, "mobile");
  });
});

describe("request context", () => {
  it("sends route params and the query to the browser", async () => {
    const app = await server({ faces: [{ name: "a", views: [{ name: "b", template: "x" }] }] });
    const html = (await app.inject("/a/b/?page=2")).body;
    assert.deepEqual(contextOf(html).params, { path: {}, query: { page: "2" } });
  });

  it("lets a preprocessor pick the template for this request", async () => {
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "<p>default</p>",
              preprocessors: [
                (context) => {
                  if (context.device === "mobile") context.template = "<p>compact</p>";
                },
              ],
            },
          ],
        },
      ],
    });
    assert.match(
      (await app.inject({ url: "/a/b/", headers: { "user-agent": IPHONE } })).body,
      /compact/,
    );
    assert.match(
      (await app.inject({ url: "/a/b/", headers: { "user-agent": DESKTOP } })).body,
      /default/,
    );
  });
});

describe("route options", () => {
  it("validates the query with a schema on content and data routes", async () => {
    const app = await server({
      shared: {
        routeOptions: {
          schema: {
            querystring: {
              type: "object",
              properties: { page: { type: "integer", minimum: 1 } },
            },
          },
        },
      },
      faces: [{ name: "a", views: [{ name: "b", template: "x" }] }],
    });
    assert.equal((await app.inject("/a/b/?page=0")).statusCode, 400);
    assert.equal((await app.inject("/a/b/data/?page=0")).statusCode, 400);
    assert.equal((await app.inject("/a/b/?page=3")).statusCode, 200);
  });

  it("runs a view's preHandler, for example to require authentication", async () => {
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "x",
              routeOptions: {
                preHandler: async (request, reply) => {
                  if (request.headers.authorization !== "Bearer ok") await reply.code(401).send();
                },
              },
            },
          ],
        },
      ],
    });
    assert.equal((await app.inject("/a/b/")).statusCode, 401);
    assert.equal(
      (await app.inject({ url: "/a/b/", headers: { authorization: "Bearer ok" } })).statusCode,
      200,
    );
  });
});

describe("wrapper", () => {
  it("adds classes and escaped attributes to the face's section", async () => {
    const app = await server({
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "x",
              className: "card wide",
              attributes: { "aria-label": 'Cart "summary"' },
            },
          ],
        },
      ],
    });
    const html = (await app.inject("/a/b/")).body;
    assert.match(
      html,
      /<section class="minimesh-face card wide" [^>]*aria-label="Cart &quot;summary&quot;">/,
    );
  });

  it("refuses an attribute name that could break the markup", async () => {
    const app = await server({
      faces: [
        { name: "a", views: [{ name: "b", template: "x", attributes: { 'x" onload="y': "1" } }] },
      ],
    });
    assert.equal((await app.inject("/a/b/")).statusCode, 500);
  });
});

describe("plugins and static directories", () => {
  it("registers plugins before the faces, so their routes and decorators exist", async () => {
    const app = await server({
      plugins: [
        async (instance: FastifyInstance) => {
          instance.get("/api/ping", async () => ({ pong: true }));
        },
      ],
      faces: [{ name: "a", views: [{ name: "b", template: "x" }] }],
    });
    assert.deepEqual((await app.inject("/api/ping")).json(), { pong: true });
  });

  it("serves each extra directory under its prefix", async () => {
    const one = mkdtempSync(join(tmpdir(), "minimesh-static-"));
    const two = mkdtempSync(join(tmpdir(), "minimesh-static-"));
    writeFileSync(join(one, "a.txt"), "one");
    writeFileSync(join(two, "b.txt"), "two");
    const app = await server({
      staticDirs: [
        { root: one, prefix: "/one/" },
        { root: two, prefix: "/two/" },
      ],
      faces: [{ name: "a", views: [{ name: "b", template: "x" }] }],
    });
    assert.equal((await app.inject("/one/a.txt")).body, "one");
    assert.equal((await app.inject("/two/b.txt")).body, "two");
  });
});

describe("markdown", () => {
  it("highlights fenced code with highlight.js classes", async () => {
    const root = mkdtempSync(join(tmpdir(), "minimesh-md-"));
    mkdirSync(join(root, "a", "b"), { recursive: true });
    writeFileSync(
      join(root, "a", "b", "b.md"),
      "```ts\nconst x: number = 1;\n```\n\n```\n<raw>\n```\n",
    );
    const app = await server({
      root,
      faces: [{ name: "a", views: [{ name: "b", templateFile: "b.md" }] }],
    });
    const html = (await app.inject("/a/b/")).body;
    assert.match(
      html,
      /<pre class="hljs"><code class="hljs language-ts"><span class="hljs-keyword">const<\/span>/,
    );
    assert.match(html, /<pre class="hljs"><code class="hljs">&lt;raw&gt;/);
  });
});

describe("dev mode", () => {
  it("previews a face requested on its own as a page, applying devWrapper", async () => {
    const app = await server({
      dev: true,
      faces: [
        {
          name: "a",
          views: [
            {
              name: "b",
              template: "<p>face</p>",
              devWrapper: (html) => `<main class="preview">${html}</main>`,
            },
          ],
        },
      ],
    });
    const html = (await app.inject("/a/b/")).body;
    assert.match(html, /^<!doctype html>/i);
    assert.match(
      html,
      /<main class="preview"><section class="minimesh-face" data-minimesh-face="a"/,
    );
    assert.match(html, /<body>/, "the body is not marked, so the face mounts once");
    assert.match(html, /<script type="module" src="\/_minimesh\/live\.js"><\/script>/);
    assert.equal(contextOf(html).dev, true);
    const nested = (await app.inject({ url: "/a/b/", headers: { "x-minimesh-nest-level": "1" } }))
      .body;
    assert.match(nested, /^<section/);
  });

  it("is off unless asked for: no preview, no live reload route", async () => {
    const app = await server({ faces: [{ name: "a", views: [{ name: "b", template: "x" }] }] });
    assert.match((await app.inject("/a/b/")).body, /^<section/);
    assert.equal((await app.inject("/_minimesh/live.js")).statusCode, 404);
  });

  it("streams a reload event when a watched file changes", async () => {
    const root = mkdtempSync(join(tmpdir(), "minimesh-live-"));
    const app = await server({ root, dev: true, faces: [] });
    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    assert.ok(address !== null && typeof address === "object");
    const response = await fetch(`http://127.0.0.1:${address.port}/_minimesh/live`);
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    const reader = response.body?.getReader();
    assert.ok(reader);
    const decoder = new TextDecoder();
    let text = decoder.decode((await reader.read()).value);
    assert.match(text, /: connected/);
    writeFileSync(join(root, "changed.ejs"), "x");
    while (!text.includes("data: reload")) text += decoder.decode((await reader.read()).value);
    await reader.cancel();
    const script = await fetch(`http://127.0.0.1:${address.port}/_minimesh/live.js`);
    assert.match(String(script.headers.get("content-type")), /javascript/);
    assert.match(await script.text(), /new EventSource/);
  });
});
