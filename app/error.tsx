"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-signal-amber">
        Something broke
      </p>
      <h1 className="mt-2 font-display text-xl font-medium text-ink">
        This page hit an unexpected error
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-soft">
        This wasn't a bad URL or a slow response &mdash; something in the app itself
        failed. Try again, and if it keeps happening, refresh the page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-paper"
      >
        Try again
      </button>
    </main>
  );
}