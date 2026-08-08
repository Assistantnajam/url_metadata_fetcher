"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { LinkPreviewCard } from "@/components/link-preview-card";
import type { FetchPageMetadataOutput } from "@/lib/tools/fetch-page-metadata";

export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "streaming" || status === "submitted";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-6">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-line px-4 py-6 text-sm text-slate-soft">
            <p className="font-mono text-[10px] uppercase tracking-wider text-signal-teal">
              try it
            </p>
            <p className="mt-1.5">
              Paste a link, e.g. &ldquo;What is this?
              https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol&rdquo; &mdash; or try a
              broken URL like &ldquo;https://this-domain-does-not-exist-xyz123.com&rdquo; to see
              the error state.
            </p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-xl bg-ink px-4 py-2.5 text-sm text-paper"
                  : "max-w-[85%] space-y-3"
              }
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
                      {part.text}
                    </p>
                  );
                }

                if (part.type === "tool-fetchPageMetadata") {
                  const toolPart = part as unknown as {
                    state: "input-streaming" | "input-available" | "output-available" | "output-error";
                    input?: { url?: string };
                    output?: FetchPageMetadataOutput;
                    errorText?: string;
                  };

                  if (toolPart.state === "input-streaming") {
                    return (
                      <LinkPreviewCard
                        key={i}
                        state="input-streaming"
                        partialUrl={toolPart.input?.url}
                      />
                    );
                  }
                  if (toolPart.state === "input-available") {
                    return (
                      <LinkPreviewCard
                        key={i}
                        state="input-available"
                        url={toolPart.input?.url ?? ""}
                      />
                    );
                  }
                  if (toolPart.state === "output-available" && toolPart.output) {
                    return (
                      <LinkPreviewCard
                        key={i}
                        state="output-available"
                        url={toolPart.input?.url ?? ""}
                        output={toolPart.output}
                      />
                    );
                  }
                  if (toolPart.state === "output-error") {
                    return (
                      <LinkPreviewCard
                        key={i}
                        state="output-error"
                        url={toolPart.input?.url ?? ""}
                        errorText={toolPart.errorText}
                      />
                    );
                  }
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-line pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a link or ask about a webpage\u2026"
          disabled={isBusy}
          className="flex-1 rounded-lg border border-slate-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-soft/70 focus:outline-none focus:ring-2 focus:ring-signal-teal/40"
        />
        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity disabled:opacity-40"
        >
          {isBusy ? "Working\u2026" : "Send"}
        </button>
      </form>
    </div>
  );
}
