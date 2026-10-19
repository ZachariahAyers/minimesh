import { existsSync, type FSWatcher, watch } from "node:fs";
import type { ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { LIVE_PATH } from "../shared.ts";

const DEBOUNCE_MS = 50;

/**
 * Serves a server-sent event stream at LIVE_PATH and sends "reload" when a watched directory
 * changes. A page also reloads when the stream comes back after a server restart.
 */
export function registerLiveReload(app: FastifyInstance, directories: string[]): void {
  const clients = new Set<ServerResponse>();
  let timer: NodeJS.Timeout | undefined;
  const broadcast = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      for (const client of clients) client.write("data: reload\n\n");
    }, DEBOUNCE_MS);
  };
  const watchers: FSWatcher[] = directories
    .filter((directory) => existsSync(directory))
    .map((directory) => watch(directory, { recursive: true }, broadcast));

  app.get(LIVE_PATH, (request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    reply.raw.write(": connected\n\n");
    clients.add(reply.raw);
    request.raw.on("close", () => clients.delete(reply.raw));
  });

  app.get(`${LIVE_PATH}.js`, (_request, reply) => {
    reply.type("text/javascript; charset=utf-8").send(CLIENT);
  });

  app.addHook("onClose", async () => {
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
    for (const client of clients) client.end();
  });
}

/** Follows the stream from the page; reconnecting after the server restarted also reloads. */
const CLIENT = `const stream = new EventSource(new URL("${LIVE_PATH}", import.meta.url));
let down = false;
stream.onmessage = () => location.reload();
stream.onerror = () => { down = true; };
stream.onopen = () => { if (down) location.reload(); };
`;

/** The tag a dev page loads the reload client with. */
export function liveScript(baseUrl: string): string {
  return `<script type="module" src="${baseUrl}${LIVE_PATH}.js"></script>`;
}
