import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { MeshEvent, MeshView as MeshViewType } from "minimesh/client";
import { fragment, page } from "../src/server/html.ts";
import type { ViewContext } from "../src/shared.ts";

before(() => GlobalRegistrator.register({ url: "http://localhost:3000" }));
after(() => GlobalRegistrator.unregister());

// Loaded after the DOM is registered, as in a browser.
const client = async () => import("minimesh/client");

function context(overrides: Partial<ViewContext>): ViewContext {
  return {
    face: "f",
    view: "v",
    mesh: false,
    title: "t",
    data: {},
    faces: {},
    nestLevel: 1,
    baseUrl: "",
    ...overrides,
  };
}

describe("EventBus", () => {
  it("delivers to subscribers of the same address only", async () => {
    const { EventBus } = await client();
    const bus = new EventBus();
    const seen: unknown[] = [];
    bus.subscribe({ channel: "c", topic: "t" }, (event) => seen.push(event.payload));
    bus.subscribe({ channel: "c", topic: "other" }, () => seen.push("wrong"));
    bus.publish({ channel: "c", topic: "t", payload: 1 });
    assert.deepEqual(seen, [1]);
  });

  it("stops delivering after unsubscribe", async () => {
    const { EventBus } = await client();
    const bus = new EventBus();
    let count = 0;
    const off = bus.subscribe({ channel: "c", topic: "t" }, () => void count++);
    off();
    bus.publish({ channel: "c", topic: "t", payload: 1 });
    assert.equal(count, 0);
  });

  it("peeks the newest payload", async () => {
    const { EventBus } = await client();
    const bus = new EventBus();
    assert.equal(bus.peek({ channel: "c", topic: "t" }), undefined);
    bus.publish({ channel: "c", topic: "t", payload: "old" });
    bus.publish({ channel: "c", topic: "t", payload: "new" });
    assert.equal(bus.peek({ channel: "c", topic: "t" }), "new");
  });

  it("keeps delivering when one listener throws, and reports the error", async () => {
    const { EventBus } = await client();
    const bus = new EventBus();
    const reported: unknown[] = [];
    const original = globalThis.reportError;
    globalThis.reportError = (error) => void reported.push(error);
    let reached = false;
    bus.subscribe({ channel: "c", topic: "t" }, () => {
      throw new Error("boom");
    });
    bus.subscribe({ channel: "c", topic: "t" }, () => {
      reached = true;
    });
    bus.publish({ channel: "c", topic: "t", payload: 1 });
    globalThis.reportError = original;
    assert.equal(reached, true);
    assert.match(String(reported[0]), /boom/);
  });

  it("shares one page-wide bus across copies of the runtime", async () => {
    const { events } = await client();
    const holder = globalThis as unknown as Record<symbol, unknown>;
    assert.equal(holder[Symbol.for("minimesh.events")], events);
  });
});

describe("defineView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts once per rendered element with its own context", async () => {
    const { defineView, MeshView } = await client();
    document.body.innerHTML =
      fragment("<p>a</p>", context({ data: { n: 1 } })) +
      fragment("<p>b</p>", context({ data: { n: 2 } }));
    const mounted: unknown[] = [];
    class View extends MeshView {
      override onMount() {
        mounted.push(this.context.data.n);
      }
    }
    const first = defineView("f", "v", View);
    const again = defineView("f", "v", View);
    assert.deepEqual(mounted, [1, 2]);
    assert.equal(first.length, 2);
    assert.equal(again.length, 0);
    assert.equal(document.querySelectorAll("script[data-minimesh-context]").length, 0);
    assert.equal(first[0]?.root.tagName, "SECTION");
  });

  it("ignores elements of other views", async () => {
    const { defineView, MeshView } = await client();
    document.body.innerHTML = fragment("x", context({ view: "other" }));
    assert.equal(defineView("f", "v", MeshView).length, 0);
  });

  it("routes messages: faces hear all and faces, the mesh hears all and mesh", async () => {
    const { defineView, events, MeshView, CHANNELS, DEFAULT_TOPIC } = await client();
    const heard: Record<string, unknown[]> = { face: [], mesh: [] };
    class Recorder extends MeshView {
      override onMessage(event: MeshEvent) {
        heard[this.context.mesh ? "mesh" : "face"]?.push(event.payload);
      }
    }
    document.documentElement.innerHTML = page(
      `<head></head><body>${fragment("x", context({ face: "child" }))}</body>`,
      context({ face: "page", mesh: true, nestLevel: 0 }),
    )
      .replace(/^<!doctype html>/i, "")
      .replace(/^<html[^>]*>|<\/html>$/g, "");
    const views: MeshViewType[] = [
      ...defineView("child", "v", Recorder),
      ...defineView("page", "v", Recorder),
    ];
    assert.equal(views.length, 2);
    for (const channel of Object.values(CHANNELS)) {
      events.publish({ channel, topic: DEFAULT_TOPIC, payload: channel });
    }
    assert.deepEqual(heard.face, [CHANNELS.all, CHANNELS.faces]);
    assert.deepEqual(heard.mesh, [CHANNELS.all, CHANNELS.mesh]);
    for (const view of views) view.destroy();
    events.publish({ channel: CHANNELS.all, topic: DEFAULT_TOPIC, payload: "after" });
    assert.equal(heard.face?.length, 2);
  });

  it("sends with toAll, toFaces and toMesh on the default topic", async () => {
    const { events, MeshView, CHANNELS, DEFAULT_TOPIC } = await client();
    const view = new MeshView(document.body, context({}));
    const got: string[] = [];
    const offs = Object.values(CHANNELS).map((channel) =>
      events.subscribe({ channel, topic: DEFAULT_TOPIC }, (event) => got.push(event.channel)),
    );
    view.toAll(1);
    view.toFaces(1);
    view.toMesh(1);
    for (const off of offs) off();
    assert.deepEqual(got, [CHANNELS.all, CHANNELS.faces, CHANNELS.mesh]);
  });
});
