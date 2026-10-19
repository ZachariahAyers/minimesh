# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org).

## [2.0.0] - 2026-10-19

Built on current tooling.

### Added

- A documentation site with a live demo, built by `npm run site` for
  [ayers.repair/opensource/minimesh](https://ayers.repair/opensource/minimesh/).
- `View.assets`: scripts and styles loaded beside a face's markup, outside its hydration root.
- `maxNestLevel`, and a 508 response past it.

### Changed

- TypeScript 7 in strict mode, ESM only, Node.js 22.18 or later. Built with tsdown, linted and
  formatted with Biome, tested with `node:test`.
- Fastify 5. `createMeshServer` returns the instance before it listens.
- Faces and views are named with `name`. Meshes are views with `mesh: true`.
- Preprocessors are plain functions that fill `context.data`, run shared, then face, then view.
  `context.template` replaces `overrideTemplate`.
- Child faces are `{ name, url, timeout, headers }`, rendered in parallel.
- `routeOptions` replaces `paramsSchema` and `routeOpts`, on the content and data routes.
- `className` and `attributes` replace `htmlContainerCssClassNames` and `htmlContainerAttributes`.
- `plugins` replaces `manifest.controllers` and `hooks`; `staticDirs` replaces
  `assetDirectoryRoots`; `devWrapper` replaces `developmentOptions.contentWrapper`.
- The browser runtime is `minimesh/client`: `defineView` replaces `MeshClient.registerFaceCodeBehind`;
  `toAll`, `toFaces`, `toMesh` and `onMessage` replace the `events` helpers and
  `useOnMessageListener`. Preact helpers are `minimesh/preact`.
- Device detection uses the `Sec-CH-UA-Mobile` client hint and bowser (MIT), not ua-parser-js,
  whose current major is AGPL-3.0. `device` reaches preprocessors and the browser.
- One `minimesh` command: `build` (esbuild and Sass, with `@use` support) replaces `mesh-build`;
  `dev` (rebuild, `node --watch`, live reload, face previews) replaces `mesh-serve` and its Vite
  server; `generate` replaces `meshgen` and `mesh-generate` with no plop or Handlebars; `insights`
  replaces `mesh-insights`.
- Markdown code highlighting stays on highlight.js.

### Fixed

- Request headers, including `authorization` and cookies, were serialized into every page. The
  browser now receives route parameters and the query, never headers or bodies.
- Remote faces received the visitor's `authorization` header. They now receive only `user-agent`,
  `accept-language` and the headers you configure.
- Preprocessor data never reached the browser, because a `Map` serializes to `{}`.
- A failing child face left the request hanging. It now renders as an HTML comment.
- A face that embedded itself recursed forever.
- `peek` returned the oldest event instead of the newest.
- Asset rewriting replaced `.ts` anywhere in the markup. It now changes only `src` and `href`.
- Asset URLs no longer come from the `Host` header; set `publicUrl` for absolute URLs.
- Built-in basic authentication shipped with default `test`/`test` credentials, and Helmet's
  default policy blocked faces from other origins. Both are gone; use `routeOptions.preHandler` or a
  plugin, and register Helmet yourself with a policy that fits.

### Removed

These exports are covered by the platform today:

- `utils`: `isValidHttpUrl` is `URL.canParse` (Node.js 19.9); `hash` is `crypto.hash` (Node.js
  21.7); `omit`, `combine` and `coalesce` are object spread and `??`; the array, string, number and
  boolean helpers are built-in methods such as `Object.groupBy` and `Array.prototype.toSorted`; the
  `verify*` validators are JSON Schema in `routeOptions.schema`, which Fastify validates.
- `hooks`: type aliases of Fastify's own `onRequestHookHandler` and siblings, which Fastify exports.
- `http`: an axios wrapper. Use `fetch` or `MeshView.api`; status codes are `node:http`'s
  `STATUS_CODES`.
- `mesh-insights` rendered the Lighthouse HTML report locally, which needs the lighthouse package
  (28 dependencies including puppeteer-core, 19 MB). `minimesh insights` links to the full report on
  pagespeed.web.dev and `--out` saves the JSON for Lighthouse Viewer.

[2.0.0]: https://github.com/ZachariahAyers/minimesh/tree/v2.0.0
