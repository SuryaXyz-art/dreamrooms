"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToastContextValue {
  showToast: (message: string) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const value = useMemo(() => ({ showToast: (next: string) => setMessage(next) }), []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <button
          aria-label="Dismiss notification"
          className={cn(
            "fixed bottom-5 left-5 right-5 z-40 rounded-xl border border-brand/50 bg-panel-strong px-4 py-3 text-left text-sm text-ink shadow-xl sm:left-auto sm:max-w-sm",
          )}
          onClick={() => setMessage(null)}
        >
          {message}
        </button>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
