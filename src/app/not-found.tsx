import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl content-center gap-4 px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="text-3xl font-semibold">Room not found.</h1>
      <p className="text-muted">
        This link does not point to a room in the current foundation fixture.
      </p>
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-page transition-colors hover:bg-muted"
        href="/"
      >
        Back to discovery
      </Link>
    </main>
  );
}
