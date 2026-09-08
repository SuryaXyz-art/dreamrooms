"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/app-providers";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet/wallet-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", key: "home" as const },
  { href: "/portfolio", key: "portfolio" as const },
  { href: "/status", key: "status" as const },
];

export function Navigation() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-bold tracking-tight" href="/">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center border border-ink text-xs font-black"
          >
            DR
          </span>
          <span>
            Dream<span className="text-muted">Rooms</span>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              className={cn(
                "rounded-lg px-3 py-2 text-sm text-muted hover:bg-panel-strong hover:text-ink",
                pathname === link.href && "bg-ink text-page",
              )}
              href={link.href}
              key={link.href}
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Switch language"
            onClick={() => setLocale(locale === "en" ? "hi" : "en")}
            variant="ghost"
          >
            {locale === "en" ? "हि" : "EN"}
          </Button>
          <WalletButton />
        </div>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:hidden"
      >
        {links.map((link) => (
          <Link
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-xs text-muted",
              pathname === link.href && "bg-ink text-page",
            )}
            href={link.href}
            key={link.href}
          >
            {t.nav[link.key]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
