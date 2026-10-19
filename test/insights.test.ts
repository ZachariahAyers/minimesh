import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { formatReport, runInsights } from "../src/insights.ts";

const RESPONSE = {
  id: "https://example.com/",
  lighthouseResult: {
    categories: {
      performance: { id: "performance", title: "Performance", score: 0.93 },
      accessibility: { id: "accessibility", title: "Accessibility", score: 1 },
      seo: { id: "seo", title: "SEO", score: null },
    },
  },
  loadingExperience: { overall_category: "FAST" },
};

afterEach(() => mock.restoreAll());

function respond(body: unknown, status = 200) {
  return mock.method(globalThis, "fetch", async () => Response.json(body, { status }));
}

describe("insights", () => {
  it("asks for every category, the strategy and the key", async () => {
    const fetchMock = respond(RESPONSE);
    await runInsights({ url: "https://example.com", strategy: "DESKTOP", key: "k1" });
    const url = new URL(String(fetchMock.mock.calls[0]?.arguments[0]));
    assert.equal(
      url.origin + url.pathname,
      "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed",
    );
    assert.equal(url.searchParams.get("url"), "https://example.com");
    assert.equal(url.searchParams.get("strategy"), "DESKTOP");
    assert.equal(url.searchParams.get("key"), "k1");
    assert.deepEqual(url.searchParams.getAll("category"), [
      "PERFORMANCE",
      "ACCESSIBILITY",
      "BEST_PRACTICES",
      "SEO",
    ]);
  });

  it("defaults to mobile with no key", async () => {
    const fetchMock = respond(RESPONSE);
    await runInsights({ url: "https://example.com", categories: ["SEO"] });
    const url = new URL(String(fetchMock.mock.calls[0]?.arguments[0]));
    assert.equal(url.searchParams.get("strategy"), "MOBILE");
    assert.equal(url.searchParams.has("key"), false);
    assert.deepEqual(url.searchParams.getAll("category"), ["SEO"]);
  });

  it("turns scores into 0 to 100 and keeps the field verdict", async () => {
    respond(RESPONSE);
    const report = await runInsights({ url: "https://example.com" });
    assert.deepEqual(report.scores, {
      performance: { title: "Performance", score: 93 },
      accessibility: { title: "Accessibility", score: 100 },
      seo: { title: "SEO", score: null },
    });
    assert.equal(report.fieldCategory, "FAST");
    assert.deepEqual(report.raw, RESPONSE);
    const text = formatReport(report);
    assert.match(text, /Performance\s+93/);
    assert.match(text, /SEO\s+n\/a/);
    assert.match(text, /pagespeed\.web\.dev\/analysis\?url=https%3A%2F%2Fexample\.com%2F/);
  });

  it("reports the API's error message", async () => {
    respond({ error: { message: "Quota exceeded" } }, 429);
    await assert.rejects(runInsights({ url: "https://example.com" }), /Quota exceeded/);
  });
});
