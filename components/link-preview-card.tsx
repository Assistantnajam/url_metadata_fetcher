import type { FetchPageMetadataOutput } from "@/lib/tools/fetch-page-metadata";

type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

const STAGES: { key: ToolState; label: string }[] = [
  { key: "input-streaming", label: "Link" },
  { key: "input-available", label: "Fetch" },
  { key: "output-available", label: "Preview" },
  { key: "output-error", label: "Error" },
];

function StageStrip({ state }: { state: ToolState }) {
  const activeIndex = state === "output-error" ? 3 : STAGES.findIndex((s) => s.key === state);

  return (
    <div className="flex items-center gap-1.5 px-4 pt-3">
      {STAGES.slice(0, 3).map((stage, i) => {
        const isError = state === "output-error";
        const isDone = i < activeIndex && !isError;
        const isActive = i === activeIndex && !isError;
        return (
          <div key={stage.key} className="flex flex-1 items-center gap-1.5">
            <div
              className={[
                "h-[3px] flex-1 rounded-full transition-colors duration-300",
                isError
                  ? "bg-signal-amber/30"
                  : isDone || isActive
                  ? "bg-signal-teal"
                  : "bg-slate-line",
              ].join(" ")}
            />
          </div>
        );
      })}
      <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-slate-soft">
        {state === "output-error" ? "error" : STAGES[activeIndex]?.label}
      </span>
    </div>
  );
}

/** State 1 — input is still being streamed/formed by the model. */
function InputStreamingCard({ partialUrl }: { partialUrl?: string }) {
  return (
    <div className="animate-crossfade overflow-hidden rounded-xl border border-slate-line bg-white">
      <StageStrip state="input-streaming" />
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-2 w-2 animate-pulse rounded-full bg-signal-blue" />
        <p className="font-mono text-xs text-slate-soft">
          {partialUrl ? partialUrl : "preparing link\u2026"}
        </p>
      </div>
    </div>
  );
}

/** State 2 — input confirmed, fetch in flight. */
function InputAvailableCard({ url }: { url: string }) {
  return (
    <div className="animate-crossfade overflow-hidden rounded-xl border border-slate-line bg-white">
      <StageStrip state="input-available" />
      <div className="flex gap-3 p-4">
        <div className="h-16 w-16 shrink-0 animate-shimmer rounded-lg bg-gradient-to-r from-slate-line via-paper to-slate-line bg-[length:200%_100%]" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-3/4 animate-shimmer rounded bg-gradient-to-r from-slate-line via-paper to-slate-line bg-[length:200%_100%]" />
          <div className="h-2.5 w-full animate-shimmer rounded bg-gradient-to-r from-slate-line via-paper to-slate-line bg-[length:200%_100%]" />
          <p className="pt-1 font-mono text-[11px] text-slate-soft">{url}</p>
        </div>
      </div>
    </div>
  );
}

/** State 3 — success. The real result, rendered as a link preview card. */
function OutputAvailableCard({ data }: { data: Extract<FetchPageMetadataOutput, { status: "success" }> }) {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-crossfade group block overflow-hidden rounded-xl border border-slate-line bg-white transition-shadow hover:shadow-md"
    >
      <StageStrip state="output-available" />
      <div className="flex gap-3 p-4">
        {data.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg border border-slate-line object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-line bg-paper font-mono text-[10px] text-slate-soft">
            no image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {data.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" />
            ) : null}
            <span className="truncate font-mono text-[10px] uppercase tracking-wide text-slate-soft">
              {data.siteName}
            </span>
          </div>
          <h3 className="mt-1 truncate font-display text-sm font-medium text-ink group-hover:text-signal-teal">
            {data.title}
          </h3>
          {data.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-soft">
              {data.description}
            </p>
          ) : null}
        </div>
      </div>
    </a>
  );
}

/** State 4 — the fetch failed or produced no usable metadata. */
function OutputErrorCard({ url, message }: { url: string; message: string }) {
  return (
    <div className="animate-crossfade overflow-hidden rounded-xl border border-signal-amber/30 bg-white">
      <StageStrip state="output-error" />
      <div className="flex gap-3 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-signal-amber/30 bg-signal-amber/5 text-signal-amber">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-medium text-ink">Couldn't load a preview</p>
          <p className="mt-1 text-xs leading-snug text-slate-soft">{message}</p>
          <p className="mt-1.5 truncate font-mono text-[10px] text-slate-soft/70">{url}</p>
        </div>
      </div>
    </div>
  );
}

export type LinkPreviewCardProps =
  | { state: "input-streaming"; partialUrl?: string }
  | { state: "input-available"; url: string }
  | { state: "output-available"; url: string; output: FetchPageMetadataOutput }
  | { state: "output-error"; url: string; errorText?: string };

/**
 * Single entry point that switches on the AI SDK tool part's `state` field
 * and renders one of the four required visual treatments.
 */
export function LinkPreviewCard(props: LinkPreviewCardProps) {
  switch (props.state) {
    case "input-streaming":
      return <InputStreamingCard partialUrl={props.partialUrl} />;
    case "input-available":
      return <InputAvailableCard url={props.url} />;
    case "output-available":
      if (props.output.status === "error") {
        return <OutputErrorCard url={props.output.url} message={props.output.message} />;
      }
      return <OutputAvailableCard data={props.output} />;
    case "output-error":
      return (
        <OutputErrorCard
          url={props.url}
          message={props.errorText ?? "The tool call failed unexpectedly."}
        />
      );
  }
}
