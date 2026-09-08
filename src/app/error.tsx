"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl content-center gap-4 px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-failure">
        Something went wrong
      </p>
      <h1 className="text-3xl font-semibold">This room needs a refresh.</h1>
      <p className="text-muted">The error was contained. Try again, or return to discovery.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
