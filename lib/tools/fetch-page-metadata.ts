import { z } from "zod";
import { tool } from "ai";
import * as cheerio from "cheerio";

/**
 * Input schema for the fetchPageMetadata tool.
 * Kept intentionally small: one required field, validated as a real URL
 * before the tool ever runs.
 */
export const fetchPageMetadataInputSchema = z.object({
  url: z
    .string()
    .url()
    .describe("The full URL of the webpage to fetch a preview for, including https://"),
});

export type FetchPageMetadataInput = z.infer<typeof fetchPageMetadataInputSchema>;

/**
 * Return shape. A discriminated union on `status` so the UI can render
 * a success card or an error card from the same output type, with no
 * ambiguity about which fields are present.
 */
export type FetchPageMetadataOutput =
  | {
      status: "success";
      url: string;
      title: string;
      description: string | null;
      image: string | null;
      favicon: string | null;
      siteName: string;
    }
  | {
      status: "error";
      url: string;
      message: string;
    };

function resolveUrl(base: string, maybeRelative: string | undefined): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

/**
 * Fetches a webpage and extracts its preview metadata.
 * Never throws — all failure paths return a structured `status: "error"` result
 * so the caller (and the UI) can handle failure without a try/catch of their own.
 */
export async function fetchPageMetadataExecute({
  url,
}: FetchPageMetadataInput): Promise<FetchPageMetadataOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; URLMetadataFetcher/1.0; +https://example.com/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return {
        status: "error",
        url,
        message: `The page responded with status ${response.status}.`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return {
        status: "error",
        url,
        message: "That URL doesn't point to an HTML page, so no preview is available.",
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").first().text().trim() ||
      new URL(url).hostname;

    const description =
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="description"]').attr("content")?.trim() ||
      null;

    const image = resolveUrl(url, $('meta[property="og:image"]').attr("content"));

    const favicon =
      resolveUrl(
        url,
        $('link[rel="icon"]').attr("href") ||
          $('link[rel="shortcut icon"]').attr("href")
      ) ?? resolveUrl(url, "/favicon.ico");

    const siteName =
      $('meta[property="og:site_name"]').attr("content")?.trim() ||
      new URL(url).hostname;

    return {
      status: "success",
      url,
      title,
      description,
      image,
      favicon,
      siteName,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The request timed out before the page responded."
        : "Couldn't reach that URL. It may be down, blocking automated requests, or invalid.";
    return { status: "error", url, message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The tool as registered with the AI SDK. Passed into `streamText({ tools: { fetchPageMetadata } })`.
 */
export const fetchPageMetadataTool = tool({
  description:
    "Fetch a webpage and return its preview metadata: title, description, image, favicon, and site name. Call this whenever the user shares or references a URL and a visual preview of the page would help.",
  inputSchema: fetchPageMetadataInputSchema,
  execute: fetchPageMetadataExecute,
});
