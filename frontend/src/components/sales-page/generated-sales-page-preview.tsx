import { Check, Quote } from "lucide-react";
import type { GeneratedContent, SalesPage, TemplateKey } from "@/types";
import { cn } from "@/lib/utils";

function benefitsList(b: GeneratedContent["benefits"]): NonNullable<GeneratedContent["benefits"]> {
  return Array.isArray(b) ? b : [];
}

function featuresList(f: GeneratedContent["features"]): NonNullable<GeneratedContent["features"]> {
  return Array.isArray(f) ? f : [];
}

function previewShellClass(template: TemplateKey): string {
  if (template === "bold") {
    return "border border-slate-200 bg-linear-to-br from-white via-slate-50 to-sky-50 text-slate-950 shadow-xl";
  }
  if (template === "elegant") {
    return "border border-amber-200/60 bg-linear-to-b from-amber-50 via-rose-50 to-amber-100/80 text-amber-950 shadow-xl";
  }
  return "border border-cyan-500/20 bg-linear-to-br from-[#041329] via-[#071c35] to-[#10223f] text-cyan-50 shadow-[0_0_60px_-20px_rgba(34,211,238,0.22)]";
}

function subtleClass(template: TemplateKey): string {
  if (template === "bold") return "text-slate-600";
  if (template === "elegant") return "text-amber-900/80";
  return "text-cyan-200/80";
}

function cardClass(template: TemplateKey): string {
  if (template === "bold") return "rounded-xl border border-slate-200 bg-linear-to-b from-white to-slate-100 p-4";
  if (template === "elegant") return "rounded-xl border border-amber-200/80 bg-linear-to-b from-white/95 to-amber-50/75 p-4";
  return "rounded-xl border border-cyan-200/15 bg-linear-to-b from-white/10 to-white/5 p-4";
}

function formatPriceNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Renders structured LLM output as a styled landing preview (not raw JSON).
 */
export function GeneratedSalesPagePreview({
  page,
  uomQuantity,
  calculatedTotalBase,
  calculatedTotalConverted,
  onCtaClick,
}: {
  page: SalesPage;
  uomQuantity: string;
  calculatedTotalBase: number | null;
  calculatedTotalConverted: number | null;
  onCtaClick: () => void;
}) {
  const c = page.generated_content;
  const tpl = page.template;

  if (!c) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed p-10 text-center",
          tpl === "bold"
            ? "border-slate-300 bg-slate-50 text-slate-600"
            : tpl === "elegant"
              ? "border-amber-300/50 bg-amber-50/50 text-amber-900/70"
              : "border-white/15 bg-slate-900/40 text-slate-400",
        )}
      >
        <p className="text-sm leading-relaxed">
          No AI copy yet. Use <strong className="text-slate-200">Generate with AI</strong> on this page — it sends
          your <strong className="text-slate-200">saved product data</strong> to the LLM (no manual prompt typing
          here).
        </p>
      </div>
    );
  }

  const benefits = benefitsList(c.benefits);
  const features = featuresList(c.features);
  const testimonials = Array.isArray(c.social_proof?.testimonials) ? c.social_proof!.testimonials : [];
  const stats = Array.isArray(c.social_proof?.stats) ? c.social_proof!.stats : [];
  const included = Array.isArray(c.pricing?.included) ? c.pricing!.included : [];

  return (
    <article id="sales-page-preview" className={cn("overflow-hidden rounded-2xl", previewShellClass(tpl))}>
      {/* Hero */}
      <header
        className={cn(
          "px-6 pb-8 pt-10 md:px-12 md:pb-10 md:pt-14",
          tpl === "bold"
            ? "bg-linear-to-r from-sky-100/70 via-transparent to-cyan-100/60"
            : tpl === "elegant"
              ? "bg-linear-to-r from-amber-100/70 via-transparent to-rose-100/60"
              : "bg-linear-to-r from-cyan-500/15 via-transparent to-indigo-500/20",
        )}
      >
        <h1 className="font-heading text-3xl leading-tight tracking-tight md:text-5xl md:leading-[1.1]">
          {c.headline || page.product_name}
        </h1>
        {c.sub_headline ? (
          <p className={cn("mt-4 max-w-2xl text-lg leading-relaxed md:text-xl", subtleClass(tpl))}>
            {c.sub_headline}
          </p>
        ) : null}
      </header>

      {/* Product narrative */}
      {c.product_description ? (
        <section className={cn("border-t px-6 py-8 md:px-12", tpl === "bold" ? "border-slate-200" : tpl === "elegant" ? "border-amber-200/70" : "border-white/10")}>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-widest opacity-80">Overview</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-base leading-relaxed md:text-lg">{c.product_description}</p>
        </section>
      ) : null}

      {/* Benefits */}
      {benefits.length > 0 ? (
        <section
          className={cn(
            "border-t px-6 py-10 md:px-12",
            tpl === "bold"
              ? "border-slate-200 bg-linear-to-r from-slate-50/90 to-sky-50/80"
              : tpl === "elegant"
                ? "border-amber-200/70 bg-linear-to-r from-white/40 to-amber-100/35"
                : "border-white/10 bg-linear-to-r from-cyan-950/30 to-indigo-950/30",
          )}
        >
          <h2 className="font-heading text-xl md:text-2xl">Why it matters</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <li key={i} className={cardClass(tpl)}>
                <h3 className="font-semibold">{b.title}</h3>
                <p className={cn("mt-2 text-sm leading-relaxed", subtleClass(tpl))}>{b.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Features */}
      {features.length > 0 ? (
        <section className={cn("border-t px-6 py-10 md:px-12", tpl === "bold" ? "border-slate-200" : tpl === "elegant" ? "border-amber-200/70" : "border-white/10")}>
          <h2 className="font-heading text-xl md:text-2xl">Features</h2>
          <ul className="mt-6 space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    tpl === "bold"
                      ? "bg-slate-900 text-white"
                      : tpl === "elegant"
                        ? "bg-amber-800 text-amber-50"
                        : "bg-cyan-500/25 text-cyan-200",
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="font-medium">{f.title}</h3>
                  <p className={cn("mt-1 text-sm leading-relaxed", subtleClass(tpl))}>{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Social proof */}
      {testimonials.length > 0 || stats.length > 0 ? (
        <section
          className={cn(
            "border-t px-6 py-10 md:px-12",
            tpl === "bold"
              ? "border-slate-200 bg-linear-to-r from-slate-100/70 to-cyan-100/50"
              : tpl === "elegant"
                ? "border-amber-200/70 bg-linear-to-r from-amber-100/50 to-rose-100/40"
                : "border-white/10 bg-linear-to-r from-cyan-950/40 to-blue-950/40",
          )}
        >
          <h2 className="font-heading text-xl md:text-2xl">Social proof</h2>
          {testimonials.length > 0 ? (
            <ul className="mt-6 space-y-4">
              {testimonials.map((t, i) => (
                <li key={i} className={cn("flex gap-3 rounded-xl p-4", cardClass(tpl))}>
                  <Quote className="h-5 w-5 shrink-0 opacity-60" />
                  <div>
                    <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                    <p className={cn("mt-3 text-xs font-medium", subtleClass(tpl))}>
                      {t.name}
                      {t.role ? ` · ${t.role}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {stats.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "min-w-30 rounded-xl px-4 py-3 text-center",
                    tpl === "bold" ? "bg-white shadow-sm" : tpl === "elegant" ? "bg-white/80" : "bg-white/5",
                  )}
                >
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                  <p className={cn("text-xs", subtleClass(tpl))}>{s.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Pricing */}
      {c.pricing ? (
        <section className={cn("border-t px-6 py-10 md:px-12", tpl === "bold" ? "border-slate-200" : tpl === "elegant" ? "border-amber-200/70" : "border-white/10")}>
          <h2 className="font-heading text-xl md:text-2xl">Pricing</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className={cn("rounded-2xl p-6 md:p-8", cardClass(tpl))}>
              <p className="text-3xl font-bold tracking-tight md:text-4xl">{c.pricing.display_price}</p>
              {c.pricing.billing_note ? (
                <p className={cn("mt-2 text-sm", subtleClass(tpl))}>{c.pricing.billing_note}</p>
              ) : null}
              {c.pricing.value_statement ? (
                <p className="mt-4 text-base leading-relaxed">{c.pricing.value_statement}</p>
              ) : null}
              {included.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {included.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <aside
              className={cn(
                "rounded-2xl border p-6 md:p-8",
                tpl === "bold"
                  ? "border-slate-200 bg-slate-100"
                  : tpl === "elegant"
                    ? "border-amber-200/70 bg-white/70"
                    : "border-cyan-500/25 bg-cyan-950/20",
              )}
            >
              <p className="text-xs uppercase tracking-wider opacity-70">Total ({uomQuantity || "0"} {page.uom || "unit"})</p>
              <p className="mt-3 font-mono text-2xl font-semibold md:text-3xl">
                {formatPriceNumber(calculatedTotalBase)} {page.price_currency}
                {calculatedTotalConverted !== null && page.display_currency !== page.price_currency
                  ? ` (≈ ${formatPriceNumber(calculatedTotalConverted)} ${page.display_currency})`
                  : ""}
              </p>
            </aside>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      {c.cta ? (
        <section
          className={cn(
            "border-t px-6 py-12 text-center md:px-12",
            tpl === "bold" ? "border-slate-200 bg-slate-900 text-white" : tpl === "elegant" ? "border-amber-300/50 bg-amber-900 text-amber-50" : "border-cyan-500/30 bg-linear-to-br from-cyan-950 to-slate-950",
          )}
        >
          <button
            type="button"
            onClick={onCtaClick}
            className={cn(
              "inline-flex min-h-12 min-w-50 items-center justify-center rounded-xl px-8 text-base font-semibold shadow-lg transition hover:opacity-95",
              tpl === "bold"
                ? "bg-white text-slate-950"
                : tpl === "elegant"
                  ? "bg-amber-100 text-amber-950"
                  : "bg-linear-to-r from-cyan-400 to-sky-500 text-slate-950",
            )}
          >
            {c.cta.button_text || "Get started"}
          </button>
          {c.cta.supporting_text ? (
            <p className={cn("mx-auto mt-4 max-w-md text-sm", tpl === "bold" ? "text-slate-300" : "opacity-90")}>
              {c.cta.supporting_text}
            </p>
          ) : null}
          {c.cta.urgency_note ? (
            <p className="mt-3 text-xs font-medium opacity-80">{c.cta.urgency_note}</p>
          ) : null}
        </section>
      ) : null}

      {/* SEO */}
      {c.seo_meta?.title || c.seo_meta?.description ? (
        <footer
          className={cn(
            "border-t px-6 py-6 md:px-12",
            tpl === "bold" ? "border-slate-200 bg-slate-50" : tpl === "elegant" ? "border-amber-200/50 bg-amber-50/80" : "border-white/10 bg-black/30",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60"></p>
          {c.seo_meta.title ? <p className="mt-2 text-xs font-medium">{c.seo_meta.title}</p> : null}
          {c.seo_meta.description ? (
            <p className={cn("mt-1 text-xs leading-relaxed", subtleClass(tpl))}>{c.seo_meta.description}</p>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
