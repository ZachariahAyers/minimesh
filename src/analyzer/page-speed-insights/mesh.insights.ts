#!/usr/bin/env node

// Imports
import Ajv, { DefinedError } from "ajv";
import addFormats from "ajv-formats";
import axios, { AxiosResponse } from "axios";
import { Static, Type } from "@sinclair/typebox";
import path from "path";
import fse from "fs-extra";
import date from "date-and-time";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Lighthouse has no TS types, keep this as a commonJS import.
// @ts-expect-error
import ReportGenerator from "lighthouse/report/generator/report-generator.js";
import open from "open";
import type { Version } from "./types/version";
import type { CaptchaResult } from "./types/captcha.result";
import type { LoadingExperience } from "./types/loading.experience";
import type { LighthouseResult } from "./types/lighthouse.result";

/**
 * Available query parameter definitions for 'Strategy'
 * @link https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed#strategy
 * @category (Analyzer) [PageSpeed Insights]
 */
enum StrategyQueryParam {
  /**
   * Default UNDEFINED category.
   */
  STRATEGY_UNSPECIFIED = "STRATEGY_UNSPECIFIED",
  /**
   * Fetch and analyze the URL for desktop browsers.
   */ DESKTOP = "DESKTOP",
  /**
   * Fetch and analyze the URL for mobile devices.
   */ MOBILE = "MOBILE",
}

/**
 * Available query parameter definitions for 'Category'
 * @link https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed#category
 * @category (Analyzer) [PageSpeed Insights]
 */
enum CategoryQueryParam {
  /**
   * Default UNDEFINED category.
   */
  CATEGORY_UNSPECIFIED = "CATEGORY_UNSPECIFIED",
  /**
   * Accessibility (a11y), category pertaining to a website's capacity to be accessible to all users.
   */ ACCESSIBILITY = "ACCESSIBILITY",
  /**
   * Best Practices, category pertaining to a website's conformance to web best practice.
   */ BEST_PRACTICES = "BEST_PRACTICES",
  /**
   * Performance, category pertaining to a website's performance.
   */ PERFORMANCE = "PERFORMANCE",
  /**
   * Progressive Web App (PWA), category pertaining to a website's ability to be run as a PWA.
   */ PWA = "PWA",
  /**
   * Search Engine Optimization (SEO), category pertaining to a website's ability to be indexed by search engines.
   */ SEO = "SEO",
}

/**
 * Available API parameters which may be passed to the PageSpeed Insights API
 */
type ApiParameter = "url";

/**
 * Expected Arguments on process.arv
 */
type Argv = {
  [x: string]: unknown;
  url?: string;
  key?: string;
  open?: boolean;
  category?: keyof typeof CategoryQueryParam | string;
  strategy?: keyof typeof StrategyQueryParam | string;
  locale?: string;
};

/**
 * Available keys that may be passed as process arguments
 * @type {{url: TString, key: TString, open: TBoolean}}
 */
const yargsOpts = {
  url: Type.String(),
  key: Type.String(),
  open: Type.Boolean(),
  category: Type.String(),
  strategy: Type.String(),
  locale: Type.String(),
};

/**
 * PageSpeed Insights - LighthouseResponse
 * @description Response body to be returned from queries to the page-speed API.
 * @category (Analyzer) [PageSpeed Insights]
 * @link https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed#response
 */
export interface LighthouseResponse {
  /**
   * The CAPTCHA verify result from the page-speed API.
   */
  captchaResult: CaptchaResult;
  /**
   * Kind of result.
   */
  kind: string;
  /**
   * Canonicalized and final URL for the document, after following page redirects (if any).
   */
  id: string;
  /**
   * Metrics of end users' page loading experience.
   */
  loadingExperience: LoadingExperience;
  /**
   * Metrics of the aggregated page loading experience of the origin
   */
  originLoadingExperience: LoadingExperience;
  /**
   * Lighthouse response for the audit url as an object.
   */
  lighthouseResult: LighthouseResult;
  /**
   * The UTC timestamp of this analysis.
   */
  analysisUTCTimestamp: string;
  /**
   * The version of PageSpeed used to generate these results.
   */
  version: Version;
}

/**
 * Create the Yargs Parser
 */
const parser = yargs(hideBin(process.argv)).options(yargsOpts);

/**
 * The Current Working Directory (CWD) of the script being executed.
 * @type {string}
 */
const CWD = process.cwd();

/**
 * Default 'Reports' directory.
 */
const REPORTS_OUTPUT_DIR = path.join(CWD, "reports");

/**
 * Loader symbol collection to iterate through during the API fetch process.
 * @type {string[]}
 */
const LOADER_SYMBOLS = [
  "> ⠋ [              ]",
  "> ⠙ [==            ]",
  "> ⠹ [====          ]",
  "> ⠸ [======        ]",
  "> ⠼ [  ======      ]",
  "> ⠴ [    ======    ]",
  "> ⠦ [      ======  ]",
  "> ⠧ [        ======]",
  "> ⠇ [          ====]",
  "> ⠏ [            ==]",
];

/**
 * Static address of the PageSpeed Insights API.
 * @type {string}
 */
const PAGE_SPEED_API =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Setup AJV Types and HTTP String Schema
//@ts-ignore
const ajv = addFormats(new Ajv({}), ["uri"]).addKeyword("kind");

/**
 * Http Schema definition
 * @description This schema ensures the passed in URL is valid.
 * @type {TString}
 */
const HTTP_SCHEMA = Type.Strict(Type.String({ format: "uri" }));
type HTTPSchema = Static<typeof HTTP_SCHEMA>;

/**
 * Run the PageSpeed Insight API tools on a predefined HTTP/S address.
 * @param {string | undefined} urlToAnalyze The HTTP/S URL to run PageSpeed Insights on.
 * @param {string | undefined} pageInsightsApiKey PageInsights API Key - required for multiple requests per second/day
 * @param {string | undefined} reportsOutputDirectory Absolute directory to output report files to.
 * @param {CategoryQueryParam | undefined} category A Lighthouse category to run; if none are given, only Performance category will be run
 * @param {string | undefined} locale The locale used to localize formatted results
 * @param {StrategyQueryParam | undefined} strategy The analysis strategy (desktop or mobile) to use, and desktop is the default
 * @return {Promise<void>}
 * @category (Analyzer) [PageSpeed Insights]
 */
export async function runPageSpeedAnalysis(
  urlToAnalyze?: string,
  pageInsightsApiKey?: string,
  reportsOutputDirectory?: string,
  category?: CategoryQueryParam,
  locale?: string,
  strategy?: StrategyQueryParam
): Promise<void> {
  // Get the HTTP address from the process.args
  const argv: Argv = await parser.argv;
  const address = urlToAnalyze ?? argv.url;
  const apiKey = pageInsightsApiKey ?? argv.key;
  const apiCategory = category ?? argv.category;
  const apiStrategy = strategy ?? argv.strategy;
  const apiLocale = locale ?? argv.locale;

  // If address exists - run. If address does not exist, throw an error.
  if (!address) {
    console.error(
      `No "URL" was provided as an argument to the Insights tool. Please pass a "URL" as the second argument: i.e. "mesh-insights --url="https://www.google.com"`
    );
    return;
  }

  // Validate that a true HTTP/S address was passed in.
  const validate = ajv.compile<HTTPSchema>(HTTP_SCHEMA);
  if (!validate(address)) {
    console.error(
      `URL "${address}" ` +
        (validate.errors as DefinedError[])
          .map((error) => error.message)
          .join("\n")
    );
    return;
  }

  // Build the URL parameters
  const params: Record<ApiParameter, string> = {
    url: address,
    ...(null !== apiKey && { key: apiKey }),
    ...(null !== apiCategory && { category: apiCategory?.toUpperCase() }),
    ...(null !== apiLocale && { locale: apiLocale }),
    ...(null !== apiStrategy && { strategy: apiStrategy?.toUpperCase() }),
  };

  let loader: any;

  try {
    // Notify user we are fetching from the PageSpeed API
    console.info(`> Starting PageSpeed Analysis on URL: ${address}`);
    console.info(`> API Key ${apiKey ? "HAS" : "HAS NOT"} been provided.`);
    console.info(
      `> Running Strategy: ${apiStrategy?.toUpperCase() ?? "DESKTOP"}`
    );
    console.info(
      `> Running Category: ${apiCategory?.toUpperCase() ?? "PERFORMANCE"}`
    );

    /**
     * If user provided the --open parameter via CLI, we will open the generated report in their browser
     */
    if (argv.open) {
      console.info(
        `> The Generated report will open in your browser once inspection is complete...`
      );
    }

    console.info(`> Please wait for the PageSpeed inspections to complete...`);

    // Show a loading spinner / progress bar when the API fetch is ongoing.
    let loaderIterationCount = 0;
    loader = setInterval(() => {
      process.stdout.write(`\r${LOADER_SYMBOLS[loaderIterationCount++]}`);
      loaderIterationCount %= LOADER_SYMBOLS.length;
    }, 250);

    // Make the Axios request and destructure the Lighthouse data.
    const { data }: AxiosResponse<LighthouseResponse> = await axios.get(
      PAGE_SPEED_API,
      {
        params,
      }
    );

    // Clear the spinner / progress bar.
    process.stdout.write(`\r> PageSpeed Insights gathered successfully!\n`);
    clearInterval(loader);

    // Generate the HTML report
    const htmlReport = ReportGenerator.generateReport(
      data.lighthouseResult,
      "html"
    );

    // Generate a unique timestamp for the report
    const timeStamp = date.format(new Date(), "MM-DD-YYYY_hh-mm-ss-SSSA");

    // Write the Report file
    console.info(`> Writing report file...`);
    const reportDirectory = reportsOutputDirectory ?? REPORTS_OUTPUT_DIR;
    const reportFilePath = path.join(
      reportDirectory,
      `page-speed-insights_${timeStamp}.html`
    );
    await fse.outputFile(reportFilePath, htmlReport);

    // All Done! Notify the user
    console.info(`> Report Written!`);
    console.info(`> View Results: ${reportFilePath}`);

    // If the --open flag was passed, open the file in your browser
    if (argv.open) {
      open(reportFilePath, { app: { name: open.apps.edge } });
    }
  } catch (e) {
    // Clear the loader if it is running
    process.stdout.write(`\r> Error Occurred!!!\n`);
    clearInterval(loader);

    if ((<Error>e).message.includes("status code 429")) {
      console.error(
        `> You are accessing the PageSpeed Insights API too often!\n>> Please enter your API key: (i.e. mesh-insights --url=https://www.google.com --key=[api-key])\n>> Alternatively: Wait 1-2 minutes and try again.`
      );
      return;
    } else {
      throw new Error((<Error>e).stack);
    }
  }
}

/**
 * Run the Page Speed Analysis
 */
void runPageSpeedAnalysis();
