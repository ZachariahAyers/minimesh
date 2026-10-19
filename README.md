# MiniMesh

By [Zachariah Ayers](https://ayers.repair) · [GitHub](https://github.com/ZachariahAyers)

Server-composed micro-frontends for Node.js. Build each piece of a page, a **face**, on whatever
server owns it. Compose faces into a page, a **mesh**, on the server. Hydrate each face in the
browser as its own island, and let the islands talk over one event bus.

## Why

Most micro-frontend setups compose in the browser: a shell downloads every team's bundle, then
renders. MiniMesh composes on the server instead. The page arrives as finished HTML, each face
ships only its own small script, and a face that fails becomes an empty slot instead of a broken
page.

## Stack

- [Fastify](https://fastify.dev) 5 serves faces, data and assets
- Templates: HTML, [EJS](https://ejs.co), Markdown ([markdown-it](https://github.com/markdown-it/markdown-it)) or [Preact](https://preactjs.com) components
- [esbuild](https://esbuild.github.io) bundles each face's script; [Sass](https://sass-lang.com) compiles its styles, scoped to the face
- TypeScript 7, strict, ESM only, Node.js 22.18 or later

## Use

```sh
npm install minimesh fastify preact
```

A project keeps one folder per view: `faces/<face>/<view>/`.

```ts
// server.ts
import { createMeshServer } from "minimesh";
import { Card } from "./faces/greeting/card/card.view.ts";

const app = await createMeshServer({
  root: new URL("./faces/", import.meta.url),
  assetsDir: new URL("./dist/", import.meta.url),
  faces: [
    {
      name: "home",
      views: [
        {
          name: "page",
          mesh: true, // a full HTML page
          templateFile: "page.view.ejs", // prints <%- faces.greeting %>
          faces: [{ name: "greeting", url: "/greeting/card/" }],
        },
      ],
    },
    {
      name: "greeting",
      views: [
        {
          name: "card",
          template: Card, // a Preact component
          assets: ["card.client.ts", "card.styles.scss"],
          preprocessors: [
            ({ data }) => {
              data.name = "Ada";
            },
          ],
        },
      ],
    },
  ],
});

await app.listen({ port: 3000 });
```

```ts
// faces/greeting/card/card.client.ts
import { defineView, MeshView } from "minimesh/client";
import { hydrateView } from "minimesh/preact";
import { Card } from "./card.view.ts";

class CardView extends MeshView<{ name: string }> {
  override onMount(): void {
    hydrateView(Card, this);
    this.toMesh(`hello from ${this.context.data.name}`);
  }
}

defineView("greeting", "card", CardView);
```

Build the browser assets, then start the server:

```sh
npx minimesh build faces --outdir dist   # add --watch while developing
node server.ts
```

A runnable version lives in [`examples/basic`](examples/basic). From a clone, `npm run example`
builds it and serves it on port 3000.

### Concepts

| Term | Meaning |
| - | - |
| Face | A named group of views, rendered at `/<face>/<view>/` as an HTML fragment. |
| Mesh | A view with `mesh: true`. Requested directly, it renders as a full page. |
| Child face | `faces: [{ name, url }]` renders another face into this view. `url` is a path on this server or an absolute URL on another. |
| Preprocessor | A function that runs before render and fills `data`. Shared ones run first, then the face's, then the view's. |
| Data | Public. It is serialized into the page for the view's script. Never put secrets in it. |
| Island | A `*.client.ts` file. `minimesh build` bundles it as a browser module. |

Every view also answers `data/` (its data as JSON) and `manifest/` (its URLs and assets). The
server answers `/health`.

### Faces on other servers

Set `publicUrl` on a server whose faces other servers embed, so asset URLs in its fragments are
absolute. A remote face receives the page's `user-agent`, `accept-language` and query string, never
its cookies or credentials. Give a remote face its own credentials with
`{ name, url, headers: { authorization: "..." } }`. Assets are served with
`access-control-allow-origin: *` so pages on other origins can load them.

`createMeshServer` returns the Fastify instance before it listens, so add authentication,
`@fastify/helmet` or `@fastify/compress` with `app.register` the usual way.

## Structure

```text
src/
  index.ts        server entry: createMeshServer and its types
  server/         routes, rendering, child faces, HTML transforms
  client/         browser runtime: MeshView, defineView, event bus
  preact.ts       hydrateView and the Face component
  build.ts        island and style builder behind the CLI
  cli.ts          minimesh build
  shared.ts       names and types both sides agree on
test/             node:test suites, one per module
examples/basic/   a page composing a Preact face and a Markdown face
docs/             architecture notes
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how a request flows through the server.

## Develop

```sh
npm ci
npm run check   # lint, typecheck, test, build
```

## License

[MIT](LICENSE). Copyright Ayers Electronics Inc.
