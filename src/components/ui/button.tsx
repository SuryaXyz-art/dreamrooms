import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        variant === "primary" && "border-ink bg-ink text-page hover:bg-muted hover:text-page",
        variant === "secondary" &&
          "border-line bg-panel-strong text-ink hover:border-ink hover:bg-panel",
        variant === "ghost" && "border-transparent text-muted hover:bg-panel-strong hover:text-ink",
        variant === "danger" && "border-ink bg-ink text-page hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
