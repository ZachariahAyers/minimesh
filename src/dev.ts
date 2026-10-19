import { type ChildProcess, spawn } from "node:child_process";
import { buildAssets } from "./build.ts";

export interface DevOptions {
  /** The server entry file, such as "server.ts". */
  entry: string;
  /** Directory that holds `<face>/<view>/` folders. */
  root: string;
  /** Where built assets go. */
  outdir: string;
  /** Extra package.json export conditions for resolving island imports. */
  conditions?: string[];
}

export interface DevSession {
  /** The server process, restarted by `node --watch` when its source changes. */
  server: ChildProcess;
  stop: () => Promise<void>;
}

/**
 * Development loop: rebuilds islands and styles on change, and runs the server under
 * `node --watch` with MINIMESH_DEV=1, so its pages reload when anything changes.
 */
export async function startDev(options: DevOptions): Promise<DevSession> {
  const build = await buildAssets({
    root: options.root,
    outdir: options.outdir,
    watch: true,
    ...(options.conditions && { conditions: options.conditions }),
  });
  const server = spawn(process.execPath, ["--watch", options.entry], {
    stdio: "inherit",
    env: { ...process.env, MINIMESH_DEV: "1" },
  });
  const exited = new Promise<void>((resolve) => server.once("exit", () => resolve()));
  return {
    server,
    stop: async () => {
      if (server.exitCode === null && server.signalCode === null) server.kill("SIGTERM");
      await exited;
      await build.stop();
    },
  };
}
