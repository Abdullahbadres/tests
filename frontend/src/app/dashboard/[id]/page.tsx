"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotFoundView } from "@/components/not-found-view";
import { GeneratedSalesPagePreview } from "@/components/sales-page/generated-sales-page-preview";
import { salesPageApi } from "@/lib/sales-pages";
import { SalesPage, SectionKey, TemplateKey } from "@/types";
import { cn } from "@/lib/utils";

const SECTION_REGEN: { key: SectionKey; label: string }[] = [
  { key: "headline", label: "Headline" },
  { key: "sub_headline", label: "Sub-headline" },
  { key: "product_description", label: "Description" },
  { key: "benefits", label: "Benefits" },
  { key: "features", label: "Features" },
  { key: "social_proof", label: "Social proof" },
  { key: "pricing", label: "Pricing" },
  { key: "cta", label: "CTA" },
];

function formatPriceNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function StatusBadge({ status }: { status: SalesPage["status"] }) {
  const map: Record<SalesPage["status"], string> = {
    pending: "bg-slate-500/20 text-slate-300",
    generating: "bg-amber-500/20 text-amber-200",
    completed: "bg-emerald-500/20 text-emerald-200",
    failed: "bg-rose-500/20 text-rose-200",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", map[status])}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function SalesPageDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const router = useRouter();
  const routeSlug = useMemo(() => (idParam ?? "").trim().toLowerCase(), [idParam]);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [resolveDone, setResolveDone] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState<SalesPage | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [uomQtyInput, setUomQtyInput] = useState("1");
  const currentPage = page ?? null;

  const slugify = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  useEffect(() => {
    let active = true;
    const resetTimer = setTimeout(() => {
      if (!active) return;
      setResolveDone(false);
      setResolvedId(null);
    }, 0);
    void (async () => {
      if (!routeSlug) return;
      const numeric = routeSlug.match(/^(\d+)/);
      if (numeric) {
        if (active) setResolvedId(numeric[1]);
        if (active) setResolveDone(true);
        return;
      }

      try {
        const first = await salesPageApi.list(1);
        const pages = first.data;
        const foundFirst = pages.data.find((p) => slugify(p.product_name) === routeSlug);
        if (foundFirst) {
          if (active) setResolvedId(String(foundFirst.id));
          if (active) setResolveDone(true);
          return;
        }

        for (let p = 2; p <= pages.last_page; p += 1) {
          const next = await salesPageApi.list(p);
          const found = next.data.data.find((item) => slugify(item.product_name) === routeSlug);
          if (found) {
            if (active) setResolvedId(String(found.id));
            if (active) setResolveDone(true);
            return;
          }
        }
      } catch {
        // handled by loading state/fallback UI
      }
      if (active) setResolveDone(true);
    })();
    return () => {
      active = false;
      clearTimeout(resetTimer);
    };
  }, [routeSlug, slugify]);

  const load = useCallback(async () => {
    if (!resolvedId) return;
    const { data } = await salesPageApi.show(resolvedId);
    setPage(data);
  }, [resolvedId]);

  useEffect(() => {
    if (!resolvedId) return;
    setPageLoading(true);
    let timer: ReturnType<typeof setInterval> | undefined;
    void (async () => {
      try {
        const { data } = await salesPageApi.show(resolvedId);
        setPage(data);
        if (data.status === "generating" || data.status === "pending") {
          timer = setInterval(async () => {
            const { data: d } = await salesPageApi.show(resolvedId);
            setPage(d);
            if (d.status === "completed" || d.status === "failed") {
              if (timer) clearInterval(timer);
            }
          }, 3000);
        }
      } catch {
        setPage(null);
      } finally {
        setPageLoading(false);
      }
    })();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resolvedId]);

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
      if (!resolvedId) return;
      await salesPageApi.generate(resolvedId);
      toast.success("AI generation started — using your saved product data on the server");
      await load();
    } catch {
      toast.error("Could not start generation");
    } finally {
      setGenLoading(false);
    }
  };

  const isBusy = (currentPage?.status === "generating") || genLoading;
  const unitPrice = useMemo(() => {
    const n = Number.parseFloat((currentPage?.price ?? "").replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }, [currentPage?.price]);
  const uomQty = useMemo(() => {
    const n = Number.parseFloat(uomQtyInput || "0");
    return Number.isFinite(n) ? n : 0;
  }, [uomQtyInput]);
  const totalBase = useMemo(() => (unitPrice !== null ? unitPrice * uomQty : null), [unitPrice, uomQty]);
  const convertedUnit = useMemo(() => {
    const c = Number.parseFloat((currentPage?.converted_price_display ?? "").replace(/,/g, "").trim());
    return Number.isFinite(c) ? c : null;
  }, [currentPage?.converted_price_display]);
  const totalConverted = useMemo(
    () => (convertedUnit !== null ? convertedUnit * uomQty : null),
    [convertedUnit, uomQty],
  );

  const handleContactByEmail = async () => {
    const cp = currentPage;
    if (!cp) return;
    const subject = encodeURIComponent(`Sales Page Proposal - ${cp.product_name}`);
    const body = encodeURIComponent(
      `Hi Abdullah,\n\n` +
        `Please find the proposal for "${cp.product_name}".\n` +
        `I have exported the HTML from the dashboard and will review before sending.\n\n` +
        `Best regards,`
    );
    const mailtoUrl = `mailto:abdullahbadres@gmail.com?subject=${subject}&body=${body}`;
    // Trigger mailto immediately while still inside direct user click gesture.
    window.location.href = mailtoUrl;

    // Fallback: if no default mail app handles mailto, open Gmail web compose.
    setTimeout(() => {
      const gmailComposeUrl =
        `https://mail.google.com/mail/?view=cm&fs=1&to=abdullahbadres@gmail.com&su=${subject}&body=${body}`;
      window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");
    }, 900);

    try {
      // Slight delay helps prevent external-protocol navigation from cancelling pending fetch/download.
      setTimeout(async () => {
        try {
          if (!resolvedId) return;
          const res = await salesPageApi.exportHtml(resolvedId);
          const fileName = `${cp.product_name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "sales-page"}.html`;
          const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/html" }));
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success("HTML exported");
        } catch {
          toast.error("Failed to export HTML");
        }
      }, 200);
    } catch {
      // no-op
    }
  };

  if (!resolveDone) {
    return (
      <main className="container-app flex min-h-[40vh] items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" aria-hidden />
      </main>
    );
  }

  if (!resolvedId) {
    return <NotFoundView />;
  }

  if (pageLoading && !currentPage) {
    return (
      <main className="container-app flex min-h-[40vh] items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" aria-hidden />
      </main>
    );
  }

  if (!currentPage) {
    return <NotFoundView />;
  }

  return (
    <main className="container-app py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-cyan-400/90 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <span className="truncate text-sm text-slate-300">{`dashboard/${currentPage.product_name}`}</span>
        <StatusBadge status={currentPage.status} />
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto gap-1.5"
          onClick={async () => {
            if (!confirm(`Delete "${currentPage.product_name}"? This action cannot be undone.`)) return;
            try {
              await salesPageApi.remove(currentPage.id);
              toast.success("Sales page deleted");
              router.push("/dashboard");
            } catch {
              toast.error("Failed to delete sales page");
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-slate-50 md:text-3xl">{currentPage.product_name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              <strong className="text-slate-200">LLM generation runs from this page</strong> — it sends your stored
              product/service fields (below) to the API. You don&apos;t type prompts manually here; copy is produced
              from that structured input and rendered as a styled page.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-cyan-400 to-sky-600 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 hover:opacity-95"
              disabled={isBusy}
              onClick={() => void handleGenerate()}
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {currentPage.generated_content ? "Regenerate with AI" : "Generate with AI"}
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500">
              Re-runs use the same saved product data (edit flow can be added later).
            </p>
          </div>
        </div>

        <div
          className="mt-5 border-t border-white/10 pt-5"
          aria-label="Source data sent to the LLM"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Source product data</h2>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-slate-500">Target audience</dt>
              <dd className="mt-0.5 text-slate-200">{currentPage.target_audience}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Price context</dt>
              <dd className="mt-0.5 font-mono text-slate-200">
                {currentPage.price} {currentPage.price_currency}
                {currentPage.converted_price_display && currentPage.display_currency !== currentPage.price_currency
                  ? ` (≈ ${currentPage.converted_price_display} ${currentPage.display_currency})`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">UOM (locked)</dt>
              <dd className="mt-0.5 text-slate-200">{currentPage.uom || "unit"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-500">Raw description (input)</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-slate-300">{currentPage.product_description}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-500">Key features (input)</dt>
              <dd className="mt-0.5 text-slate-300">
                {Array.isArray(currentPage.key_features) ? currentPage.key_features.join(" · ") : ""}
              </dd>
            </div>
            {currentPage.unique_selling_points ? (
              <div className="md:col-span-2">
                <dt className="text-slate-500">Unique selling points</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-300">{currentPage.unique_selling_points}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/20 bg-slate-900/50 p-5 md:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">UOM Calculator</h2>
        <p className="mt-1 text-sm text-slate-400">
          Type quantity for <span className="font-medium text-slate-200">{currentPage.uom || "unit"}</span>. Unit price is locked from create page.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="uom-qty" className="text-sm text-slate-300">
              Quantity ({currentPage.uom || "unit"})
            </label>
            <input
              id="uom-qty"
              className="h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400/60"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={uomQtyInput}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                const firstDot = v.indexOf(".");
                const normalized = firstDot >= 0 ? v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "") : v;
                setUomQtyInput(normalized);
              }}
            />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-slate-500">Unit price</p>
            <p className="mt-1 font-mono text-sm text-slate-100">
              {currentPage.price} {currentPage.price_currency} / {currentPage.uom || "unit"}
            </p>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
            <p className="text-xs text-cyan-200/80">Total ({uomQtyInput || "0"} {currentPage.uom || "unit"})</p>
            <p className="mt-1 font-mono text-sm text-cyan-100">
              {formatPriceNumber(totalBase)} {currentPage.price_currency}
              {totalConverted !== null && currentPage.display_currency !== currentPage.price_currency
                ? ` (≈ ${formatPriceNumber(totalConverted)} ${currentPage.display_currency})`
                : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-500">Template</span>
        {(["modern", "bold", "elegant"] as TemplateKey[]).map((tpl) => (
          <Button
            key={tpl}
            size="sm"
            variant={currentPage.template === tpl ? "default" : "secondary"}
            onClick={async () => {
              if (!resolvedId) return;
              await salesPageApi.updateTemplate(resolvedId, tpl);
              const { data } = await salesPageApi.show(resolvedId);
              setPage(data);
              toast.success(`Template: ${tpl}`);
            }}
          >
            {tpl}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={async () => {
            if (!resolvedId) return;
            const res = await salesPageApi.exportHtml(resolvedId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `sales-page-${resolvedId}.html`;
            a.click();
          }}
        >
          Export HTML
        </Button>
        <Link href="/features" className="ml-auto text-xs text-cyan-400/80 hover:text-cyan-300 hover:underline">
          How the AI pipeline works
        </Link>
      </div>

      {currentPage.status === "failed" ? (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
          Last generation failed. Check the API (OpenAI key, quota) and click <strong>Generate with AI</strong> again.
        </p>
      ) : null}

      <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs font-medium text-slate-400">Regenerate one section (optional)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SECTION_REGEN.map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant="secondary"
              disabled={!currentPage.generated_content || isBusy}
              className="gap-1"
              onClick={async () => {
                try {
                  if (!resolvedId) return;
                  await salesPageApi.regenerateSection(resolvedId, key);
                  toast.success(`${label} updated`);
                  const { data } = await salesPageApi.show(resolvedId);
                  setPage(data);
                } catch {
                  toast.error("Section regenerate failed");
                }
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {currentPage.status === "generating" && !currentPage.generated_content ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-4 text-amber-100">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <p className="text-sm">Generating persuasive copy and structure from your product data…</p>
        </div>
      ) : null}

      <GeneratedSalesPagePreview
        page={currentPage}
        uomQuantity={uomQtyInput || "0"}
        calculatedTotalBase={totalBase}
        calculatedTotalConverted={totalConverted}
        onCtaClick={() => void handleContactByEmail()}
      />
    </main>
  );
}
