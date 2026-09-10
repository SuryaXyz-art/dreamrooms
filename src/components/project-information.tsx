"use client";

import { useLocale } from "@/components/app-providers";

export function ProjectInformation() {
  const { t } = useLocale();
  return (
    <section
      className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
      aria-labelledby="about-dreamrooms"
    >
      <div className="rounded-xl border border-line bg-panel p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
          {t.project.eyebrow}
        </p>
        <h2 className="display-type mt-4 text-3xl sm:text-5xl" id="about-dreamrooms">
          {t.project.title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted">{t.project.body}</p>
        <p className="mt-7 border-t border-line pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {t.project.testnet}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {t.project.steps.map((step, index) => (
          <article className="rounded-xl border border-line bg-panel-strong p-5" key={step.title}>
            <p className="font-mono text-sm text-muted">0{index + 1}</p>
            <h3 className="mt-6 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
          </article>
        ))}
      </div>
      <div className="lg:col-span-2 rounded-xl border border-line bg-panel p-6 sm:p-8">
        <h2 className="text-lg font-semibold">{t.home.how}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {t.project.faq.map((item) => (
            <details
              className="group rounded-lg border border-line bg-panel-strong p-4"
              key={item.question}
            >
              <summary className="cursor-pointer list-none font-semibold marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
                <span className="mr-2 text-muted">+</span>
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
