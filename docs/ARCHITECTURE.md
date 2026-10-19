# Architecture

MiniMesh has three parts that share one contract, `src/shared.ts`: the attribute names, the nesting
header and the `ViewContext` the server sends to the browser.

## Server: one request

`createMeshServer` (`src/server/server.ts`) validates the face list, then registers three routes
per view. A request for `/<face>/<view>/` runs:

1. **Nesting check.** The `x-minimesh-nest-level` header says how deep this render is. Past
   `maxNestLevel` the server answers 508, which stops a face that embeds itself.
2. **Preprocessors.** Shared, then face, then view. They read `request` and fill `data`.
3. **Child faces** (`src/server/children.ts`), in parallel. A path on this server goes through
   `app.inject` with the caller's headers, so hooks such as authentication still apply. An absolute
   URL is fetched with a timeout and only `user-agent`, `accept-language` and the address's own
   headers. A failure becomes an HTML comment; the page still renders.
4. **Render** (`src/server/render.ts`). A string is used as is. A Preact component renders with
   `preact-render-to-string`. A template file renders by extension: `.html` as is, `.ejs` in strict
   mode with `data`, `helpers`, `faces` and `title`, `.md` with markdown-it.
5. **Asset rewrite** (`src/server/html.ts`). Relative `<script src>` and `<link href>` point at the
   view's built files under `publicUrl` (or root-relative), so the markup still works inside another
   page. `.ts` becomes a module script `.js`; `.scss` becomes `.css`.
6. **Wrap.** A face becomes a `<section>` carrying its face and view names, with its context in a
   `<script type="application/json">` as the last child and its listed `assets` just before it. A
   mesh at nesting level 0 becomes a full page: a shell is added if missing, face stylesheets move
   into the head once each, repeated module scripts are dropped, and the context goes last in the
   body.

`data/` runs only the preprocessors. `manifest/` describes the view without rendering it.

The context sent to the browser holds the names, title, data, nesting level and base URL. It never
holds request headers. Child HTML is included only for Preact templates, which need it to hydrate.

## Browser

Each island is bundled whole, so each carries its own copy of the runtime (`src/client`). The event
bus therefore lives on `globalThis` under `Symbol.for("minimesh.events")`, where every copy finds the
same instance.

`defineView(face, view, Class)` finds every element the server marked for that view, reads and
removes its context script, constructs the view, joins it to the `all` channel and to `mesh` or
`faces`, and calls `onMount`. An element mounts once.

`hydrateView` (`src/preact.ts`) hydrates the element with the same props the server rendered with.
Preact does not re-apply `dangerouslySetInnerHTML` during hydration, so the `Face` component keeps
child faces, and their islands, intact.

## Build

`minimesh build <root>` (`src/build.ts`) treats `<root>/<face>/<view>/` as the layout. Every
`*.client.ts(x)` is an esbuild entry, bundled as an ES module for the browser with Preact's JSX
runtime. Every `.scss`, `.sass` or `.css` file not starting with `_` compiles in two passes: first
the file alone, so `@use` stays top-level, then nested under
`[data-minimesh-face=…][data-minimesh-view=…]`. Inside a view's styles, `:root`, `html` and `body`
mean the view's own root element.

## Known limits

- Each island bundles its own copy of the runtime and of Preact. An import map shared by all islands
  would remove the duplication.
- Style source maps are not emitted, because the second pass shifts every line.
- A Preact template used as a mesh hydrates the whole `<body>`; Preact templates suit faces best.
