"use client";

import { useLocale } from "@/components/app-providers";
import type { Messages } from "@/lib/i18n/messages";

type ActionKey = keyof Messages["actions"];

export function LocalizedAction({ action }: { action: ActionKey }) {
  const { t } = useLocale();
  return <>{t.actions[action]}</>;
}
