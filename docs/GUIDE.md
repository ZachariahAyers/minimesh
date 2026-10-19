# MiniMesh guide

MiniMesh builds pages from **faces**: fragments of HTML that each team renders on the server it
owns. A **mesh** is a page that composes faces. Each face ships its own small script and hydrates
in the browser as an island; islands talk over one event bus. The page arrives finished, and a face
that fails becomes an empty slot instead of a broken page.

## Start a project

```sh
npx minimesh generate project shop
cd shop && npm install
npm run dev
```

`npm run dev` runs `minimesh dev`: it rebuilds scripts and styles on every change, restarts the
server when its code changes, and reloads open pages. Add pieces with the generator:

```sh
npx minimesh generate face cart/summary --template preact
npx minimesh generate preprocessor current-user
npx minimesh generate plugin orders
```

Run `npx minimesh generate` with no arguments to be asked instead. It also writes `service`,
`model` and `repository` stubs, and never overwrites a file.

## Faces and meshes

Each view lives in `faces/<face>/<view>/`. The server lists them:

```ts
import { createMeshServer } from "minimesh";
import { Summary } from "./faces/cart/summary/summary.view.ts";

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
          templateFile: "page.view.ejs", // prints <%- faces.cart %>
          faces: [{ name: "cart", url: "/cart/summary/" }],
        },
      ],
    },
    {
      name: "cart",
      views: [
        {
          name: "summary",
          template: Summary, // a Preact component
          assets: ["summary.client.ts", "summary.styles.scss"],
          preprocessors: [
            ({ data }) => {
              data.items = 3;
            },
          ],
        },
      ],
    },
  ],
});

await app.listen({ port: 3000 });
```

| Term | Meaning |
| - | - |
| Face | A named group of views, rendered at `/<face>/<view>/` as an HTML fragment. |
| Mesh | A view with `mesh: true`. Requested directly, it renders as a full page. |
| Child face | `faces: [{ name, url }]` renders another face into this view: a path on this server or an absolute URL on another. |
| Preprocessor | Runs before render and fills `data`. Shared ones run first, then the face's, then the view's. |
| Data | Public. It is serialized into the page for the view's script. Never put secrets in it. |
| Island | A `*.client.ts` file, bundled by `minimesh build` as a browser module. |

Templates can be HTML strings, Preact components, or files: `.html`, `.ejs` (with `data`,
`helpers`, `faces` and `title` in scope) and `.md`, whose fenced code is highlighted with
highlight.js classes. A preprocessor can swap the template for one request by setting
`context.template`, for example a compact variant when `context.device` is `"mobile"`.

## Browser code

```ts
// faces/cart/summary/summary.client.ts
import { defineView, MeshView } from "minimesh/client";
import { hydrateView } from "minimesh/preact";
import { Summary } from "./summary.view.ts";

class SummaryView extends MeshView<{ items: number }> {
  override onMount(): void {
    hydrateView(Summary, this);
    this.toMesh(`${this.context.data.items} items in the cart`);
  }
}

defineView("cart", "summary", SummaryView);
```

A view hears the `all` channel plus `faces` or `mesh`. Code outside any view can use `toAll`,
`toFaces`, `toMesh` and `onMessage` from `minimesh/client`. Styles in a view's folder are scoped
to that view; inside them, `:root`, `html` and `body` mean the view's own element.

## Routes, validation and authentication

Every view also answers `data/` (its data as JSON) and `manifest/`; the server answers `/health`.
`routeOptions` passes Fastify route options to a view's content and data routes, so a JSON
`schema` validates its query and parameters and a `preHandler` can require authentication. Add API
routes and shared authentication as Fastify plugins with the `plugins` option, and more static
folders with `staticDirs`. `createMeshServer` returns the Fastify instance before it listens, so
anything else Fastify offers works as usual.

## Faces on other servers

Set `publicUrl` on a server whose faces other servers embed, so its fragments use absolute URLs. A
remote face receives the page's `user-agent`, `accept-language` and query string, never its cookies
or credentials; give it its own with `{ name, url, headers: { authorization: "..." } }`. Assets are
served with `access-control-allow-origin: *`.

## Dev mode

`minimesh dev` sets `MINIMESH_DEV=1`, which turns on dev mode: pages reload when templates or built
assets change, a face requested on its own renders as a preview page (wrapped by `devWrapper` if you
give one), and the browser logs each view it mounts with a warning for deep nesting.

## Audit a page

```sh
npx minimesh insights https://example.com --strategy mobile
```

It prints the Lighthouse category scores from PageSpeed Insights and the real-visitor verdict, with
a link to the full report. `--out report.json` saves the full report for Lighthouse Viewer. Set
`PAGESPEED_API_KEY` for frequent, automated runs.

## More

- [API reference](API.md)
- [Architecture](ARCHITECTURE.md)
- [The example project](../examples/basic)
- [Changelog](../CHANGELOG.md)
- [License](../LICENSE)
