# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org).

## [2.0.0] - 2026-10-19

Server-composed micro-frontends for Node.js: render faces on any server, compose them into pages, hydrate them as islands.

### Added

- A documentation site with a live demo, built by `npm run site` for
  [ayers.repair/opensource/minimesh](https://ayers.repair/opensource/minimesh/).
- TypeScript 7 in strict mode, ESM only, Node.js 22.18 or later. Built with tsdown, linted and
  formatted with Biome, tested with `node:test`.
- Fastify 5. `createMeshServer` returns the instance before it listens.
- Faces and views are named with `name`. Meshes are views with `mesh: true`.
- Preprocessors are plain functions that fill `context.data`, run shared, then face, then view.
  `context.template` sets the template.
- Child faces are `{ name, url, timeout, headers }`, rendered in parallel. A failing child face
  renders as an HTML comment, and `maxNestLevel` stops nesting with a 508 response.
- `View.assets`: scripts and styles loaded beside a face's markup, outside its hydration root.
- `routeOptions` passes Fastify route options to the content and data routes.
- `className` and `attributes` set the face container's class and attributes.
- `plugins`, `staticDirs` and `devWrapper` add plugins, static directories and a development wrapper.
- The browser runtime is `minimesh/client`: `defineView`, and `toAll`, `toFaces`, `toMesh` and
  `onMessage` for messages between faces. Preact helpers are `minimesh/preact`.
- Device detection uses the `Sec-CH-UA-Mobile` client hint and bowser (MIT). `device` reaches
  preprocessors and the browser.
- One `minimesh` command: `build` (esbuild and Sass, with `@use` support); `dev` (rebuild,
  `node --watch`, live reload, face previews); `generate`; and `insights`, which links to the full
  report on pagespeed.web.dev and saves the JSON for Lighthouse Viewer with `--out`.
- Markdown code highlighting with highlight.js.

### Security

- The browser receives route parameters and the query, never request headers or bodies.
- Remote faces receive only `user-agent`, `accept-language` and the headers you configure.
- Asset URLs never come from the `Host` header; set `publicUrl` for absolute URLs.
- No built-in authentication and no default Helmet policy: use `routeOptions.preHandler` or a
  plugin, and register Helmet yourself with a policy that fits.

[2.0.0]: https://github.com/ZachariahAyers/minimesh/tree/v2.0.0
