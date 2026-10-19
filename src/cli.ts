#!/usr/bin/env node
import { parseArgs } from "node:util";
import { buildAssets } from "./build.ts";

const USAGE = `Usage: minimesh build <root> [--outdir <dir>] [--watch]

Bundles every *.client.ts(x) under <root>/<face>/<view>/ into a browser module and compiles
every .scss/.css stylesheet scoped to its view.

  --outdir <dir>  Output directory (default: dist/assets)
  --watch         Rebuild on change
  --help          Show this message`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    outdir: { type: "string", default: "dist/assets" },
    watch: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

const [command, root] = positionals;
if (values.help || command !== "build" || root === undefined) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
}

const result = await buildAssets({ root, outdir: values.outdir, watch: values.watch });
console.log(`minimesh: built ${result.files.length} files into ${values.outdir}`);
if (values.watch) console.log("minimesh: watching for changes");
