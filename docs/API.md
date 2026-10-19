# API reference

Three entry points: `minimesh` for the server, `minimesh/client` for the browser, and
`minimesh/preact` for Preact helpers that run on both. The `minimesh` command covers building,
development, scaffolding and audits.

## minimesh

### `createMeshServer`

```ts
createMeshServer(options: MeshServerOptions): Promise<FastifyInstance>
```

Builds a Fastify server with three routes per view: `/<face>/<view>/` (HTML), `data/` (the
preprocessed data as JSON) and `manifest/` (URLs and assets). It also answers `/health`. The
server is returned before it listens.

### `MeshServerOptions`

| Option | Type | Meaning |
| - | - | - |
| `root` | `string \| URL` | Directory holding `<face>/<view>/` folders. |
| `faces` | `Face[]` | Every face this server renders. |
| `assetsDir` | `string \| URL` | Output of `minimesh build`, served at `/<face>/<view>/` with `access-control-allow-origin: *`. |
| `publicUrl` | `string` | Public origin (or path prefix) for every URL handed out. Set it when other servers embed these faces. |
| `shared` | `Shared` | Preprocessors, helpers, child faces and route options for every view. |
| `maxNestLevel` | `number` | Deepest nesting of faces inside faces. Default 4; deeper requests get 508. |
| `reloadTemplates` | `boolean` | Re-read template files per request. Default: on unless `NODE_ENV` is `production`. |
| `dev` | `boolean` | Live reload, face previews and browser logging. Default: `MINIMESH_DEV=1`. |
| `plugins` | `FastifyPlugin[]` | Registered before the face routes: API routes, authentication, decorators. |
| `staticDirs` | `{ root, prefix }[]` | More static directories, each under its own prefix. |
| `fastify` | `FastifyServerOptions` | Passed to `Fastify()`, for example `{ logger: true }`. |

### `Face`

`{ name: string; views: View[]; shared?: Shared }`. Names are URL-safe: letters, digits and
dashes.

### `View`

Everything in `Shared`, plus:

| Field | Meaning |
| - | - |
| `name` | The view's name; its folder is `<root>/<face>/<view>/`. |
| `title` | Page title when the view renders as a page. |
| `mesh` | Render as a full HTML page when requested directly. |
| `template` | An HTML string or a Preact component receiving `ViewContext` as props. |
| `templateFile` | `.html`, `.ejs` (strict mode; `data`, `helpers`, `faces`, `title` in scope) or `.md` (highlight.js classes on code). |
| `assets` | Scripts and stylesheets in the view's folder to load beside its markup. |
| `className`, `attributes` | Extra classes and attributes on the face's `<section>`. |

### `Shared`

| Field | Meaning |
| - | - |
| `preprocessors` | Run before render: shared, then face, then view. |
| `helpers` | Functions for EJS templates. Never sent to the browser. |
| `faces` | Child faces, as `FaceAddress[]`. |
| `routeOptions` | Fastify route options for the content and data routes: `schema`, `preHandler`, `config`. Later levels override earlier keys. |
| `devWrapper` | In dev mode, wraps a face previewed on its own. |

### `FaceAddress`

`{ name, url, timeout?, headers? }`. A path such as `/cart/summary/` renders on this server with
the caller's headers. An absolute URL is fetched with `user-agent`, `accept-language`, the query
string and `headers`, never the caller's cookies or credentials. `timeout` defaults to 5000 ms. A
failure renders as an HTML comment.

### `FaceContext`

What a preprocessor receives: `face`, `view`, `mesh`, `nestLevel`, `request`, `reply`, `device`,
`title`, `data` (public), `helpers`, `faces`, and `template`, which a preprocessor may set to
replace the view's template for this request.

### `Preprocessor`

`(context: FaceContext) => void | Promise<void>`.

### `ViewContext`

What the browser receives: `face`, `view`, `mesh`, `title`, `data`, `faces` (child HTML, for
Preact templates), `nestLevel`, `baseUrl`, `device`, `params` (`path` and `query`) and `dev`.
Request headers and bodies never leave the server.

### `PublicData`

`Record<string, unknown>`: the shape of `data`.

### `Device`

`"desktop" | "mobile" | "tablet" | "tv" | "bot"`, from the `Sec-CH-UA-Mobile` client hint or the
user agent.

## minimesh/client

### `defineView`

```ts
defineView(face: string, view: string, View: MeshViewClass): MeshView[]
```

Mounts `View` on every element rendered for that face and view, once each. It reads and removes
the element's context, joins the `all` channel plus `mesh` or `faces`, and calls `onMount`.

### `MeshView`

Base class for a view's browser code. `root` is its element and `context` its `ViewContext`.
Override `onMount()` and `onMessage(event)`. `toAll`, `toFaces` and `toMesh` send events;
`subscribe(address, listener)` listens until `destroy()`. `api(path, init)` fetches from the
server that rendered the view.

### `MeshViewClass`

`new (root: HTMLElement, context: ViewContext) => MeshView`.

### `EventBus`

`publish(event)`, `subscribe(address, listener)` (returns an unsubscribe function) and
`peek(address)` (the newest payload). A throwing listener is reported with `reportError` and the
rest still run.

### `events`

The page-wide `EventBus`, shared by every island through `globalThis`.

### `toAll`

`toAll(payload, topic?)` sends to every view.

### `toFaces`

`toFaces(payload, topic?)` sends to every face.

### `toMesh`

`toMesh(payload, topic?)` sends to the page's mesh.

### `onMessage`

`onMessage(listener, topic?)` listens on all three channels from code outside a view and returns
an unsubscribe function.

### `CHANNELS`

`{ all, faces, mesh }`: the channel names.

### `DEFAULT_TOPIC`

`"message"`: the topic used when none is given.

### `EventAddress`

`{ channel: string; topic: string }`.

### `MeshEvent`

`EventAddress & { payload }`.

### `EventListener`

`(event: MeshEvent) => void`.

## minimesh/preact

### `hydrateView`

`hydrateView(Component, view)` hydrates the view's element with the props the server used.

### `Face`

`<Face html={context.faces.name} />` places a child face in a Preact template. Hydration keeps its
markup and its island.

## The minimesh command

### `minimesh build`

`minimesh build <root> [--outdir dist/assets] [--watch]` bundles every `*.client.ts(x)` as a
browser module and compiles every `.scss`, `.sass` or `.css` file (except `_partials`) scoped to its
view.

### `minimesh dev`

`minimesh dev <server.ts> [--root faces] [--outdir dist]` rebuilds assets on change and runs the
server under `node --watch` with `MINIMESH_DEV=1`, so open pages reload on every change.

### `minimesh generate`

`minimesh generate <kind> <name>` scaffolds `project`, `face` (`<face>/<view>`, with
`--template html|ejs|md|preact` and `--mesh`), `preprocessor`, `plugin`, `service`, `model` or
`repository`. Run it bare to be asked. It never overwrites a file.

### `minimesh insights`

`minimesh insights <url>` runs PageSpeed Insights and prints each category's score. Options:
`--strategy mobile|desktop`, `--category` (repeatable), `--json`, and `--out report.json`, which
saves the full report for Lighthouse Viewer. Set `PAGESPEED_API_KEY` for frequent runs.
