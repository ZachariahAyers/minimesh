import type { IncomingHttpHeaders } from "node:http";
import Bowser from "bowser";
import type { Device } from "../shared.ts";

const DEVICES: ReadonlySet<string> = new Set(["desktop", "mobile", "tablet", "tv", "bot"]);

/**
 * Classifies the visitor's device. The `Sec-CH-UA-Mobile` client hint wins when present;
 * otherwise the user agent is parsed. Anything unrecognised counts as desktop.
 */
export function detectDevice(headers: IncomingHttpHeaders): Device {
  if (headers["sec-ch-ua-mobile"] === "?1") return "mobile";
  const agent = headers["user-agent"];
  if (typeof agent !== "string" || agent === "") return "desktop";
  const type = Bowser.getParser(agent).getPlatformType(true);
  return DEVICES.has(type) ? (type as Device) : "desktop";
}
