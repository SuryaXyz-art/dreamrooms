"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid items-end bg-black/70 p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full rounded-t-3xl border bg-panel p-6 sm:mx-auto sm:max-w-lg sm:rounded-3xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold" id="dialog-title">
            {title}
          </h2>
          <Button aria-label="Close dialog" onClick={onClose} variant="ghost">
            ×
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}
