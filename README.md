# URL Metadata Fetcher

An AI chat app where the model can call a real, server-side tool to fetch a webpage
and return its preview metadata (title, description, image, favicon, site name).
Results render as a proper link-preview card — not raw text or JSON — and the tool's
four lifecycle states (input streaming, input available, output available, output
error) each get a distinct visual treatment.

Built with Next.js (App Router), TypeScript, the Vercel AI SDK, and Zod.

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000, paste a URL into the chat (e.g. a Wikipedia article),
and watch the preview card render. Try a broken URL (e.g.
`https://this-domain-does-not-exist-xyz123.com`) to see the designed error state.

## Deploying

Deploy to Vercel and set the `OPENAI_API_KEY` environment variable in the project
settings. No other configuration is required.

## Tool contract: `fetchPageMetadata`

Defined in [`lib/tools/fetch-page-metadata.ts`](./lib/tools/fetch-page-metadata.ts).

**Name:** `fetchPageMetadata`

**Input schema (Zod):**

```ts
z.object({
  url: z.string().url(),
})
```

**Behavior:** Fetches the given URL server-side (8s timeout, follows redirects),
parses the HTML with `cheerio`, and extracts Open Graph / standard meta tags.

**Return shape:**

```ts
type FetchPageMetadataOutput =
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
```

The function never throws. Every failure path — invalid response status,
non-HTML content type, network failure, timeout — returns a structured
`status: "error"` object instead of an exception, so the UI always has something
well-typed to render.

**Example usage (conceptually):**

> User: "What's this page about? https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol"
>
> The model calls `fetchPageMetadata({ url: "https://en.wikipedia.org/wiki/..." })`,
> gets back title/description/image, and the UI renders a link preview card while
> the model comments on the fetched content.

## UI states

Implemented in [`components/link-preview-card.tsx`](./components/link-preview-card.tsx),
switching on the AI SDK's tool part `state` field:

| State | What it shows |
|---|---|
| `input-streaming` | A pulsing dot and the partial URL as the model forms the tool call |
| `input-available` | A skeleton/shimmer card while the fetch is in flight |
| `output-available` | The real result: thumbnail image, favicon + site name, title, description, linking out to the original page |
| `output-error` | A distinct amber-bordered card with a plain-language explanation of what went wrong |

Each state also updates a small segmented progress strip at the top of the card so
the current stage is visible at a glance.

## Project structure

```
app/
  api/chat/route.ts       -- streams chat responses, registers the tool
  layout.tsx               -- fonts + global styles
  page.tsx                 -- page shell
  globals.css
components/
  chat.tsx                 -- useChat wiring, renders message + tool parts
  link-preview-card.tsx     -- the 4-state UI component
lib/
  tools/fetch-page-metadata.ts  -- Zod schema + execute function (the tool itself)
```

## Notes / known limitations

- Pages that block bots or require authentication will return the designed error
  state, not a preview — this is expected, not a bug.
- No caching layer; each mention of a URL triggers a fresh fetch.
- Uses OpenAI's `gpt-4o-mini` by default; swap the model in `app/api/chat/route.ts`
  to use a different provider supported by the AI SDK.
