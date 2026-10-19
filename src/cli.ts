#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import pkg from "../package.json" with { type: "json" };
import { buildAssets } from "./build.ts";
import { startDev } from "./dev.ts";
import { generate, KINDS, type Kind, TEMPLATES, type TemplateKind } from "./generate.ts";
import { CATEGORIES, type Category, formatReport, runInsights, type Strategy } from "./insights.ts";

const USAGE = `minimesh ${pkg.version}

Usage:
  minimesh build <root> [--outdir dist/assets] [--watch]
      Bundle every *.client.ts(x) under <root>/<face>/<view>/ and compile its styles, scoped.
  minimesh dev <server.ts> [--root faces] [--outdir dist]
      Rebuild on change and run the server with live reload.
  minimesh generate <${KINDS.join("|")}> <name> [--template ${TEMPLATES.join("|")}] [--mesh]
      Scaffold a project or a piece of one. A face name is <face>/<view>. Prompts when run bare.
  minimesh insights <url> [--strategy mobile|desktop] [--category performance ...] [--json] [--out report.json]
      Run PageSpeed Insights. Set PAGESPEED_API_KEY for frequent, automated runs.

Options:
  --help, --version`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    outdir: { type: "string" },
    root: { type: "string", default: "faces" },
    watch: { type: "boolean", default: false },
    template: { type: "string", default: "ejs" },
    mesh: { type: "boolean", default: false },
    strategy: { type: "string", default: "mobile" },
    category: { type: "string", multiple: true },
    json: { type: "boolean", default: false },
    out: { type: "string" },
    help: { type: "boolean", default: false },
    version: { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(`minimesh: ${message}`);
  process.exit(1);
}

async function ask(question: string, choices?: readonly string[]): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = choices === undefined ? "" : ` (${choices.join(", ")})`;
  const answer = (await rl.question(`${question}${hint}: `)).trim();
  rl.close();
  return answer;
}

const [command, first] = positionals;

if (values.version) {
  console.log(pkg.version);
} else if (values.help || command === undefined) {
  console.log(USAGE);
  process.exit(values.help ? 0 : 1);
} else if (command === "build") {
  if (first === undefined) fail("build needs a root directory.");
  const outdir = values.outdir ?? "dist/assets";
  const result = await buildAssets({ root: first, outdir, watch: values.watch });
  console.log(`minimesh: built ${result.files.length} files into ${outdir}`);
  if (values.watch) console.log("minimesh: watching for changes");
} else if (command === "dev") {
  if (first === undefined) fail("dev needs the server entry file, such as server.ts.");
  const session = await startDev({
    entry: first,
    root: values.root,
    outdir: values.outdir ?? "dist",
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => void session.stop().then(() => process.exit(0)));
  }
} else if (command === "generate" || command === "g") {
  const interactive = process.stdin.isTTY === true && first === undefined;
  const kind = (first ?? (interactive ? await ask("What to generate", KINDS) : "")) as Kind;
  if (!KINDS.includes(kind)) fail(`generate needs one of ${KINDS.join(", ")}.`);
  const name =
    positionals[2] ??
    (interactive ? await ask(kind === "face" ? "Name (<face>/<view>)" : "Name") : "");
  const template = (
    interactive && kind === "face" ? await ask("Template", TEMPLATES) : values.template
  ) as TemplateKind;
  const result = await generate({
    kind,
    name,
    cwd: process.cwd(),
    template,
    mesh: values.mesh,
  }).catch((error: Error) => fail(error.message));
  for (const file of result.files) console.log(`  created ${file}`);
  console.log(`\n${result.next}`);
} else if (command === "insights") {
  if (first === undefined) fail("insights needs a URL.");
  const categories = (values.category ?? []).map((name) => name.toUpperCase().replace("-", "_"));
  for (const category of categories) {
    if (!CATEGORIES.includes(category as Category)) fail(`unknown category "${category}".`);
  }
  const report = await runInsights({
    url: first,
    strategy: values.strategy.toUpperCase() as Strategy,
    ...(categories.length > 0 && { categories: categories as Category[] }),
    ...(process.env.PAGESPEED_API_KEY && { key: process.env.PAGESPEED_API_KEY }),
  }).catch((error: Error) => fail(error.message));
  if (values.out !== undefined) await writeFile(values.out, JSON.stringify(report.raw, null, 2));
  const { raw: _raw, ...summary } = report;
  console.log(values.json ? JSON.stringify(summary, null, 2) : formatReport(report));
} else {
  fail(`unknown command "${command}". Run minimesh --help.`);
}
