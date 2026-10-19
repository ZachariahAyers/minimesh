import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { startDev } from "../src/dev.ts";

// Outside node_modules, where Node refuses to strip types.
const scratch = fileURLToPath(new URL("../.cache/dev/", import.meta.url));
mkdirSync(scratch, { recursive: true });

async function until(check: () => boolean): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

describe("dev", () => {
  it("builds assets, runs the entry with MINIMESH_DEV=1, restarts it on change, and stops", async () => {
    const base = mkdtempSync(scratch);
    const root = join(base, "faces");
    mkdirSync(join(root, "a", "b"), { recursive: true });
    writeFileSync(join(root, "a", "b", "b.styles.scss"), "p { color: red; }");
    const marker = join(base, "env.txt");
    const entry = join(base, "server.ts");
    const source = (run: string) =>
      `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(marker)}, process.env.MINIMESH_DEV + " ${run}\\n");\n`;
    writeFileSync(entry, source("first"));
    const session = await startDev({ entry, root, outdir: join(base, "out") });
    try {
      await until(() => existsSync(marker));
      assert.equal(readFileSync(marker, "utf8"), "1 first\n");
      writeFileSync(entry, source("second"));
      await until(() => readFileSync(marker, "utf8").includes("second"));
      assert.equal(readFileSync(marker, "utf8"), "1 first\n1 second\n");
      assert.ok(existsSync(join(base, "out", "a", "b", "b.styles.css")));
    } finally {
      await session.stop();
    }
    assert.notEqual(session.server.exitCode ?? session.server.signalCode, null);
  });
});
