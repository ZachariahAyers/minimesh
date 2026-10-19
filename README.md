# MiniMesh

[![CI](https://github.com/ZachariahAyers/minimesh/actions/workflows/ci.yml/badge.svg)](https://github.com/ZachariahAyers/minimesh/actions/workflows/ci.yml)

A framework for Node.js teams that build pages from independent micro-frontends, composed on the
server and hydrated in the browser as islands.

Documentation and a live demo: [ayers.repair/opensource/minimesh](https://ayers.repair/opensource/minimesh/).

## Features

- Compose faces from this server or any other into one server-rendered page
- Write faces in HTML, EJS, Markdown or Preact
- Hydrate each face as its own island, with a page-wide event bus between them
- Scope every face's styles so they cannot leak onto the page
- Scaffold projects and faces, develop with live reload, and audit pages with PageSpeed Insights

## Tech stack

TypeScript, Node.js, Fastify, Preact, esbuild, Sass.

## Getting started

Requires Node.js 22.18 or later.

```bash
git clone https://github.com/ZachariahAyers/minimesh.git && cd minimesh
npm ci && npm run example
```

Then open http://127.0.0.1:3000/home/page/. The [guide](docs/GUIDE.md) covers building your own.

## Development

```bash
npm test            # all suites
npm run lint        # Biome
npm run typecheck   # tsc
npm run build       # the package, into dist/
npm run site        # the documentation site, into site-dist/
npm run check       # all of the above
```

How it is put together: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

MIT. See [LICENSE](LICENSE).

---

Built by [Zachariah Ayers](https://ayers.repair).
