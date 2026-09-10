import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation";
import { LiveBackdrop } from "@/components/live-backdrop";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LiveBackdrop />
      <Navigation />
      <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 py-7 sm:px-8 sm:py-12">
        {children}
      </main>
    </>
  );
}

export function PageHeading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 border-b border-line pb-7 sm:mb-10 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          {eyebrow}
        </p>
        <h1 className="display-type text-4xl sm:text-6xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}
