import type { FastifyInstance, FastifyRequest } from "fastify";
import { NEST_HEADER } from "../shared.ts";
import { escapeHtml } from "./html.ts";
import type { FaceAddress } from "./types.ts";

const REMOTE = /^https?:\/\//i;
const DEFAULT_TIMEOUT = 5000;
/** Headers a remote face receives from the page request. Cookies and credentials stay here. */
const FORWARDED = ["user-agent", "accept-language"] as const;

/**
 * Renders child faces in parallel. A face on this server is rendered through `inject` with the
 * caller's headers; a remote face is fetched. A failed face becomes an HTML comment so the page
 * still renders.
 */
export async function renderChildren(
  app: FastifyInstance,
  request: FastifyRequest,
  addresses: FaceAddress[],
  nestLevel: number,
): Promise<Record<string, string>> {
  const search = new URL(request.url, "http://localhost").search;
  const entries = await Promise.all(
    addresses.map(async (address): Promise<[string, string]> => {
      try {
        const html = REMOTE.test(address.url)
          ? await fetchRemote(address, request, search, nestLevel)
          : await renderLocal(app, address, request, search, nestLevel);
        return [address.name, html];
      } catch (error) {
        request.log.warn({ err: error, face: address.name, url: address.url }, "face failed");
        return [address.name, `<!-- minimesh: face "${escapeHtml(address.name)}" unavailable -->`];
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function renderLocal(
  app: FastifyInstance,
  address: FaceAddress,
  request: FastifyRequest,
  search: string,
  nestLevel: number,
): Promise<string> {
  const { host: _host, "content-length": _length, ...headers } = request.headers;
  const response = await app.inject({
    method: "GET",
    url: withSearch(address.url, search),
    headers: { ...headers, [NEST_HEADER]: String(nestLevel + 1) },
  });
  if (response.statusCode !== 200) throw new Error(`status ${response.statusCode}`);
  return response.body;
}

async function fetchRemote(
  address: FaceAddress,
  request: FastifyRequest,
  search: string,
  nestLevel: number,
): Promise<string> {
  const headers: Record<string, string> = {
    accept: "text/html",
    [NEST_HEADER]: String(nestLevel + 1),
  };
  for (const name of FORWARDED) {
    const value = request.headers[name];
    if (typeof value === "string") headers[name] = value;
  }
  const response = await fetch(withSearch(address.url, search), {
    headers: { ...headers, ...address.headers },
    signal: AbortSignal.timeout(address.timeout ?? DEFAULT_TIMEOUT),
  });
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.text();
}

/** The page's query string reaches each child, unless the address sets its own. */
function withSearch(url: string, search: string): string {
  return url.includes("?") ? url : url + search;
}
