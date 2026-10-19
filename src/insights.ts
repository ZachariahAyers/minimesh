/** PageSpeed Insights API v5. https://developers.google.com/speed/docs/insights/v5/get-started */
const ENDPOINT = "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed";

export const CATEGORIES = ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"] as const;
export type Category = (typeof CATEGORIES)[number];
export type Strategy = "MOBILE" | "DESKTOP";

export interface InsightsOptions {
  url: string;
  strategy?: Strategy;
  categories?: readonly Category[];
  /** Recommended for frequent, automated queries. */
  key?: string;
  locale?: string;
}

export interface InsightsReport {
  url: string;
  strategy: Strategy;
  /** Category scores from 0 to 100, or null where Lighthouse gave none. */
  scores: Record<string, { title: string; score: number | null }>;
  /** Field data verdict from real visitors (Chrome UX Report), when Google has enough of it. */
  fieldCategory: string | null;
  /** The full PageSpeed Insights report, as Lighthouse Viewer accepts it. */
  raw: unknown;
}

interface ApiResponse {
  id?: string;
  lighthouseResult?: { categories?: Record<string, { title?: string; score?: number | null }> };
  loadingExperience?: { overall_category?: string };
  error?: { message?: string };
}

/** Runs PageSpeed Insights against a public URL. */
export async function runInsights(options: InsightsOptions): Promise<InsightsReport> {
  const strategy = options.strategy ?? "MOBILE";
  const query = new URLSearchParams({ url: options.url, strategy });
  for (const category of options.categories ?? CATEGORIES) query.append("category", category);
  if (options.key !== undefined) query.set("key", options.key);
  if (options.locale !== undefined) query.set("locale", options.locale);

  const response = await fetch(`${ENDPOINT}?${query}`);
  const body = (await response.json()) as ApiResponse;
  if (!response.ok) {
    throw new Error(`PageSpeed Insights: ${body.error?.message ?? `status ${response.status}`}`);
  }
  const scores: InsightsReport["scores"] = {};
  for (const [id, category] of Object.entries(body.lighthouseResult?.categories ?? {})) {
    scores[id] = {
      title: category.title ?? id,
      score: typeof category.score === "number" ? Math.round(category.score * 100) : null,
    };
  }
  return {
    url: body.id ?? options.url,
    strategy,
    scores,
    fieldCategory: body.loadingExperience?.overall_category ?? null,
    raw: body,
  };
}

/** A plain-text summary for the terminal. */
export function formatReport(report: InsightsReport): string {
  const width = Math.max(...Object.values(report.scores).map((entry) => entry.title.length), 0);
  const lines = Object.values(report.scores).map(
    (entry) => `  ${entry.title.padEnd(width)}  ${entry.score === null ? "n/a" : entry.score}`,
  );
  return [
    `${report.url} (${report.strategy.toLowerCase()})`,
    ...lines,
    `  Field data: ${report.fieldCategory ?? "not enough real-user data"}`,
    `  Full report: https://pagespeed.web.dev/analysis?url=${encodeURIComponent(report.url)}`,
  ].join("\n");
}
