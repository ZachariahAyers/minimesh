# MiniMesh

Server-composed micro-frontends: Fastify renders faces into pages, the browser hydrates each face
as an island. TypeScript 7, ESM only, Node 22.18+. Read `docs/ARCHITECTURE.md` before changing how a
request renders.

## Commands

- `npm ci` - install
- `npm run lint` - Biome lint and format check; `npm run lint:fix` applies fixes
- `npm run typecheck` - `tsc`, no emit
- `npm test` - all suites; one file: `node --conditions=source --test test/server.test.ts`
- `npm run build` - tsdown into `dist/`
- `npm run check` - all of the above, in CI order

## Map

- `src/shared.ts` - names and `ViewContext`, shared by server and browser. Change both sides together.
- `src/server/` - `server.ts` routes, `render.ts` templates, `children.ts` child faces, `html.ts` HTML transforms
- `src/client/` - browser runtime. Must never import from `src/server/` or `node:*`.
- `src/preact.ts` - Preact helpers, safe on server and browser
- `src/build.ts`, `src/cli.ts` - `minimesh build`
- `test/` - one `node:test` file per area; `examples/basic` is also a test fixture

## Conventions

- Relative imports end in `.ts`. Node strips types natively, so no enums, namespaces or
  parameter properties, and no JSX in `.ts` files run by Node. Use `import type` for types.
- Exported functions declare return types (`isolatedDeclarations`).
- Tests import the package by name (`minimesh`, `minimesh/client`); the `source` export condition
  points them at `src/`.
- Browser tests register happy-dom in `before` and import the runtime after.
- Comments say what the code does and why, never its history.
- Conventional commits, lower-case after the type: `fix: keep comments in mesh pages`.

## Done means

- `npm run check` passes.
- A behaviour change has a test that failed before the change.
- README, `docs/ARCHITECTURE.md` and `CHANGELOG.md` match the change.

## Do not

- Send request headers, cookies or credentials to the browser or to a remote face.
- Build URLs from the `Host` header; use `publicUrl`.
- Add a dependency for what a few lines of standard library do.
