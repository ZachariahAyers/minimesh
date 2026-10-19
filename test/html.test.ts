import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assetTags,
  builtName,
  escapeHtml,
  fragment,
  page,
  rewriteAssets,
  scriptJson,
} from "../src/server/html.ts";
import type { ViewContext } from "../src/shared.ts";

const context: ViewContext = {
  face: "cart",
  view: "summary",
  mesh: false,
  title: "Cart",
  data: { total: 3 },
  faces: {},
  nestLevel: 1,
  baseUrl: "",
};

describe("escaping", () => {
  it("escapes every HTML-significant character", () => {
    assert.equal(
      escapeHtml(`<a href="x">'&'</a>`),
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });

  it("keeps JSON from closing its script element and still parses back", () => {
    const value = { html: "</script><script>alert(1)</script>", line: " " };
    const json = scriptJson(value);
    assert.ok(!json.includes("</script"));
    assert.ok(!json.includes("<"));
    assert.deepEqual(JSON.parse(json), value);
  });
});

describe("builtName", () => {
  it("maps sources to the files the build writes", () => {
    assert.equal(builtName("card.client.ts"), "card.client.js");
    assert.equal(builtName("card.client.tsx"), "card.client.js");
    assert.equal(builtName("card.styles.scss"), "card.styles.css");
    assert.equal(builtName("logo.svg"), "logo.svg");
  });
});

describe("rewriteAssets", () => {
  it("points relative assets at the view and turns TypeScript scripts into modules", () => {
    const html = rewriteAssets(
      '<link rel="stylesheet" href="a.styles.scss"><script src="a.client.ts"></script>',
      "/cart/summary/",
    );
    assert.match(html, /href="\/cart\/summary\/a\.styles\.css"/);
    assert.match(html, /src="\/cart\/summary\/a\.client\.js"/);
    assert.match(html, /type="module"/);
  });

  it("leaves absolute, root-relative and fragment URLs alone", () => {
    const source =
      '<script src="https://cdn.example.com/x.js"></script><link href="/site.css"><link href="#a">';
    assert.equal(rewriteAssets(source, "/cart/summary/"), source);
  });

  it("does not touch text that merely mentions .ts", () => {
    const source = "<p>Edit config.ts and styles.scss</p>";
    assert.equal(rewriteAssets(source, "/cart/summary/"), source);
  });
});

describe("assetTags", () => {
  it("emits a stylesheet link or a module script per file", () => {
    assert.equal(
      assetTags(["x.client.ts", "x.styles.scss"], "/f/v/"),
      '<script type="module" src="/f/v/x.client.js"></script><link rel="stylesheet" href="/f/v/x.styles.css">',
    );
  });
});

describe("fragment", () => {
  it("wraps markup with its face markers and context, assets outside", () => {
    const html = fragment("<p>hi</p>", context, "<link>");
    assert.ok(html.startsWith('<link><section class="minimesh-face"'));
    assert.match(html, /data-minimesh-face="cart" data-minimesh-view="summary"/);
    assert.match(html, /<p>hi<\/p><script type="application\/json" data-minimesh-context>/);
  });
});

describe("page", () => {
  const meshContext = { ...context, mesh: true, title: "Shop & Co" };

  it("adds a document shell to bare markup", () => {
    const html = page("<p>hi</p>", meshContext);
    assert.match(html, /^<!doctype html>/i);
    assert.match(html, /<title>Shop &amp; Co<\/title>/);
    assert.match(html, /<body data-minimesh-face="cart" data-minimesh-view="summary">/);
  });

  it("keeps the template's own doctype and head", () => {
    const html = page(
      "<!DOCTYPE html><html><head><title>Own</title></head><body><p>x</p></body></html>",
      meshContext,
    );
    assert.match(html, /^<!DOCTYPE html>/);
    assert.match(html, /<title>Own<\/title>/);
    assert.equal(html.match(/<head>/g)?.length, 1);
  });

  it("moves face stylesheets into the head once and drops repeated module scripts", () => {
    const face =
      '<link rel="stylesheet" href="/f/v/x.css"><script type="module" src="/f/v/x.js"></script><section>a</section>';
    const html = page(`<html><head></head><body>${face}${face}</body></html>`, meshContext);
    const [head, body] = html.split("<body");
    assert.equal(head?.match(/x\.css/g)?.length, 1);
    assert.equal(body?.match(/x\.css/g), null);
    assert.equal(html.match(/x\.js/g)?.length, 1);
    assert.equal(body?.match(/<section>/g)?.length, 2);
  });

  it("puts the view context last in the body", () => {
    const html = page("<html><head></head><body><p>x</p></body></html>", meshContext);
    assert.match(
      html,
      /<script type="application\/json" data-minimesh-context>[^<]*<\/script><\/body>/,
    );
  });

  it("keeps HTML comments, such as a failed face's placeholder", () => {
    const html = page("<body><!-- minimesh: face unavailable --></body>", meshContext);
    assert.match(html, /<!-- minimesh: face unavailable -->/);
  });
});
