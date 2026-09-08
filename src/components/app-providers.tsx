"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [queryClient] = useState(() => new QueryClient());
  const value = useMemo(() => ({ locale, setLocale, t: messages[locale] }), [locale]);
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
