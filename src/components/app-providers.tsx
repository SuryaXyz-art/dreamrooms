"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { messages, type Locale, type Messages } from "@/lib/i18n/messages";
import { walletConfig } from "@/lib/wallet/config";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const LOCALE_STORAGE_KEY = "dreamrooms-locale";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

function subscribeToLocale(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("dreamrooms-locale-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("dreamrooms-locale-change", onChange);
  };
}

export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(subscribeToLocale, readStoredLocale, () => "en");
  const setLocale = useCallback((nextLocale: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Locale remains active in this tab even when persistent storage is blocked.
    }
    window.dispatchEvent(new Event("dreamrooms-locale-change"));
  }, []);
  const [queryClient] = useState(() => new QueryClient());
  const value = useMemo(() => ({ locale, setLocale, t: messages[locale] }), [locale, setLocale]);
  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
  }, [locale]);
  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside AppProviders");
  return context;
}
