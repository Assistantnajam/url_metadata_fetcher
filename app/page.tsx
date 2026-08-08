import { Chat } from "@/components/chat";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <header className="border-b border-slate-line pb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-signal-teal">
          Tool-calling demo
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-medium text-ink">
          URL Metadata Fetcher
        </h1>
        <p className="mt-1.5 text-sm text-slate-soft">
          Share a link. The AI calls a live tool to fetch the page and renders a real preview
          card &mdash; not a JSON dump.
        </p>
      </header>

      <div className="min-h-0 flex-1">
        <Chat />
      </div>
    </main>
  );
}
