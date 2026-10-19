# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org).

## [2.0.0] - 2026-10-19

A rebuild on current tooling. The purpose is the same; the API is new.

### Changed

- TypeScript 7 in strict mode, ESM only, Node.js 22.18 or later. Built with tsdown, linted and
  formatted with Biome, tested with `node:test`.
- Fastify 5. `createMeshServer` returns the instance before it listens, so you add plugins and
  call `listen` yourself.
- Faces and views are named with `name`. Meshes are views with `mesh: true`.
- Preprocessors are plain functions that fill `context.data`, run shared, then face, then view.
- Child faces are `{ name, url }`. A path renders on the same server; an absolute URL is fetched
  with `fetch` and a timeout.
- The browser runtime is `minimesh/client`: `defineView(face, view, Class)` mounts a view per
  rendered element. Preact helpers are `minimesh/preact`.
- `minimesh build` replaces `mesh-build` and `mesh-serve`. It bundles islands with esbuild as ES
  modules and compiles styles scoped to their view; `@use` now works.

### Fixed

- Request headers, including `authorization` and cookies, were serialized into every page.
  The browser now receives only names, title, data, nesting level and base URL.
- Remote faces received the visitor's `authorization` header. They now receive only
  `user-agent`, `accept-language` and the headers you configure.
- Preprocessor data never reached the browser, because a `Map` serializes to `{}`.
- A failing child face left the request hanging. It now renders as an HTML comment.
- A face that embedded itself recursed forever. Nesting now stops at `maxNestLevel`.
- `peek` returned the oldest event instead of the newest.
- Asset rewriting replaced `.ts` anywhere in the markup. It now changes only `src` and `href`.
- Asset URLs no longer come from the `Host` header; set `publicUrl` for absolute URLs.

### Removed

- Built-in basic authentication with default `test`/`test` credentials. Use a Fastify hook.
- `@fastify/helmet`, `@fastify/cors`, `@fastify/compress` registered by default. Register what
  you need; assets send their own CORS header.
- The Vite dev server, live reload and the development content wrapper. Use
  `minimesh build --watch` with `node --watch`.
- The project generator (`meshgen`) and the PageSpeed Insights command (`mesh-insights`).
- Device detection from the user agent, code highlighting in Markdown, axios, and the bundled
  utility and hook re-exports.
- Generated API docs committed to the repository.

## [v1] - 2023-02-07

The original alpha, versioned `0.0.1-4` in its package.json and tagged `v1` in this repository.

[2.0.0]: https://github.com/ZachariahAyers/minimesh/compare/v1...v2.0.0
[v1]: https://github.com/ZachariahAyers/minimesh/tree/v1
