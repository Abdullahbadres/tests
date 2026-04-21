"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CurrencySelect } from "@/components/currency-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchConversionRate,
  formatMoneyAmount,
  formatRateMultiplier,
} from "@/lib/exchange-rates";
import { getAxiosErrorMessage } from "@/lib/api";
import { salesPageApi } from "@/lib/sales-pages";
import { cn } from "@/lib/utils";
import { TemplateKey } from "@/types";

function parseAmount(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, "").replace(/\s/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

const DESC_MIN = 50;

const schema = z.object({
  product_name: z.string().min(1).max(100),
  product_description: z.string().min(DESC_MIN, `Description must be at least ${DESC_MIN} characters`),
  key_features: z.string().min(1),
  target_audience: z.string().min(1),
  price: z.string().min(1),
  uom: z.string().min(1).max(32),
  price_currency: z.string().length(3),
  display_currency: z.string().length(3),
  converted_price_display: z.string().max(64).optional(),
  unique_selling_points: z.string().optional(),
  template: z.enum(["modern", "bold", "elegant"]),
});

type FormValue = z.infer<typeof schema>;

function toProductSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function firstValidationMessage(errors: FieldErrors<FormValue>): string {
  for (const e of Object.values(errors)) {
    if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
      return e.message;
    }
  }
  return "Please complete all required fields correctly.";
}

type ConversionDetail =
  | {
      kind: "same";
      amount: number;
      currency: string;
    }
  | {
      kind: "cross";
      amount: number;
      from: string;
      to: string;
      rate: number;
      converted: number;
    };

export default function CreatePage() {
  const router = useRouter();
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [conversion, setConversion] = useState<ConversionDetail | null>(null);

  const form = useForm<FormValue>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
      template: "modern",
      uom: "unit",
      price_currency: "USD",
      display_currency: "EUR",
      converted_price_display: "",
    },
  });

  const { setValue } = form;
  const price = form.watch("price");
  const priceCurrency = form.watch("price_currency");
  const displayCurrency = form.watch("display_currency");

  const refreshConversion = useCallback(async () => {
    const amount = parseAmount(price ?? "");
    const from = (priceCurrency ?? "").toUpperCase();
    const to = (displayCurrency ?? "").toUpperCase();

    if (!from || !to) {
      setConversion(null);
      setRateError(null);
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setConversion(null);
      setRateError(null);
      setValue("converted_price_display", "");
      return;
    }

    if (from === to) {
      setRateLoading(false);
      setRateError(null);
      const same = formatMoneyAmount(amount);
      setConversion({ kind: "same", amount, currency: to });
      setValue("converted_price_display", same);
      return;
    }

    setRateLoading(true);
    setRateError(null);
    try {
      const rate = await fetchConversionRate(from, to);
      const converted = amount * rate;
      const formatted = formatMoneyAmount(converted);
      setValue("converted_price_display", formatted);
      setConversion({
        kind: "cross",
        amount,
        from,
        to,
        rate,
        converted,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load rate";
      setRateError(msg);
      setConversion(null);
      setValue("converted_price_display", "");
    } finally {
      setRateLoading(false);
    }
  }, [price, priceCurrency, displayCurrency, setValue]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshConversion();
    }, 350);
    return () => window.clearTimeout(t);
  }, [refreshConversion]);

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        const sameCurrency = values.price_currency === values.display_currency;
        const { data } = await salesPageApi.create({
          product_name: values.product_name,
          product_description: values.product_description,
          key_features: values.key_features.split(",").map((item) => item.trim()),
          target_audience: values.target_audience,
          price: values.price,
          uom: values.uom.trim(),
          price_currency: values.price_currency,
          display_currency: values.display_currency,
          converted_price_display: sameCurrency ? undefined : values.converted_price_display || undefined,
          unique_selling_points: values.unique_selling_points,
          template: values.template as TemplateKey,
        });
        toast.success("Generation started");
        const slug = toProductSlug(data.product_name || values.product_name);
        router.push(`/dashboard/${slug || "product"}`);
      } catch (err) {
        toast.error(getAxiosErrorMessage(err, "Failed to create sales page"));
      }
    },
    (errors) => {
      toast.error(firstValidationMessage(errors));
    },
  );

  const descLen = form.watch("product_description")?.length ?? 0;
  const descOk = useMemo(() => descLen >= DESC_MIN, [descLen]);

  return (
    <main className="container-app py-8">
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Input
            placeholder="Product Name"
            aria-invalid={!!form.formState.errors.product_name}
            className={cn(form.formState.errors.product_name && "border-amber-500/80 ring-1 ring-amber-500/40")}
            {...form.register("product_name")}
          />
          {form.formState.errors.product_name && (
            <p className="text-xs text-amber-400">{form.formState.errors.product_name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Input
            placeholder="Target Audience"
            aria-invalid={!!form.formState.errors.target_audience}
            className={cn(form.formState.errors.target_audience && "border-amber-500/80 ring-1 ring-amber-500/40")}
            {...form.register("target_audience")}
          />
          {form.formState.errors.target_audience && (
            <p className="text-xs text-amber-400">{form.formState.errors.target_audience.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="price-amount" className="text-sm text-slate-300">
            Price (exact amount)
          </label>
          <p className="text-xs text-slate-500">
            Type the real price in the currency you pick below (USD is listed first).
          </p>
          <Input
            id="price-amount"
            placeholder="e.g. 99.99"
            inputMode="decimal"
            aria-invalid={!!form.formState.errors.price}
            className={cn(form.formState.errors.price && "border-amber-500/80 ring-1 ring-amber-500/40")}
            {...form.register("price")}
          />
          {form.formState.errors.price && (
            <p className="text-xs text-amber-400">{form.formState.errors.price.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="uom" className="text-sm text-slate-300">
            Unit of measurement (UOM)
          </label>
          <p className="text-xs text-slate-500">
            Example: pcs, box, kg, meter. This UOM is locked after product is created.
          </p>
          <Input
            id="uom"
            placeholder="e.g. pcs"
            aria-invalid={!!form.formState.errors.uom}
            className={cn(form.formState.errors.uom && "border-amber-500/80 ring-1 ring-amber-500/40")}
            {...form.register("uom")}
          />
          {form.formState.errors.uom && (
            <p className="text-xs text-amber-400">{form.formState.errors.uom.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <span className="text-sm text-slate-300">Price currency (exact price)</span>
          <p className="text-xs text-slate-500">How much the product costs in this currency.</p>
          <Controller
            name="price_currency"
            control={form.control}
            render={({ field }) => (
              <CurrencySelect
                value={field.value}
                onChange={field.onChange}
                pinCodesFirst={["USD"]}
                aria-label="Price currency — exact amount"
              />
            )}
          />
        </div>
        <div className="space-y-1 md:col-span-2 md:grid md:grid-cols-2 md:gap-4">
          <div className="space-y-1">
            <span className="text-sm text-slate-300">Rate currency (real-time conversion)</span>
            <p className="text-xs text-slate-500">
              Convert the price above using the live rate (default EUR; EUR is listed first here).
            </p>
            <Controller
              name="display_currency"
              control={form.control}
              render={({ field }) => (
                <CurrencySelect
                  value={field.value}
                  onChange={field.onChange}
                  pinCodesFirst={["EUR", "USD"]}
                  aria-label="Display currency for live conversion"
                />
              )}
            />
          </div>
          <div className="mt-2 flex flex-col justify-center rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 text-sm md:mt-0 md:self-start">
            <p className="text-xs font-medium uppercase tracking-wide text-cyan-300/90">
              Conversion Calculation
            </p>
            {rateLoading ? (
              <p className="mt-2 text-slate-400">Loading rate…</p>
            ) : rateError ? (
              <p className="mt-2 text-amber-300/90">{rateError}</p>
            ) : conversion?.kind === "same" ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-slate-400">Same currency — no conversion.</p>
                <p className="font-mono text-base text-slate-100">
                  {formatMoneyAmount(conversion.amount)} {conversion.currency} × 1 ={" "}
                  {formatMoneyAmount(conversion.amount)} {conversion.currency}
                </p>
              </div>
            ) : conversion?.kind === "cross" ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-400">
                  Mid rate:{" "}
                  <span className="text-slate-300">
                    1 {conversion.from} = {formatRateMultiplier(conversion.rate)} {conversion.to}
                  </span>
                </p>
                <p className="font-mono text-[0.95rem] leading-relaxed break-words text-cyan-50">
                  {formatMoneyAmount(conversion.amount)} {conversion.from} ×{" "}
                  {formatRateMultiplier(conversion.rate)} ={" "}
                  {formatMoneyAmount(conversion.converted)} {conversion.to}
                </p>
                <p className="text-xs text-slate-500">
                  The amount you entered ({conversion.from}) is multiplied by the live rate to get{" "}
                  {conversion.to}.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-slate-500">Enter a valid price to the conversion calculation.</p>
            )}
          </div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="template-style" className="text-sm text-slate-300">
            Page style
          </label>
          <select
            id="template-style"
            className={cn(
              "h-11 w-full rounded-lg border bg-slate-900 px-3 text-sm transition-colors",
              form.formState.errors.template
                ? "border-amber-500/80 ring-1 ring-amber-500/40"
                : "border-white/10 hover:border-cyan-400/30",
            )}
            {...form.register("template")}
          >
            <option value="modern">Modern — dark, high-contrast</option>
            <option value="bold">Bold — light, punchy</option>
            <option value="elegant">Elegant — warm, refined</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="product-desc" className="text-sm text-slate-300">
              Product description
            </label>
            <span
              className={cn(
                "text-xs tabular-nums",
                descOk ? "text-emerald-400/90" : "text-slate-500",
              )}
            >
              {descLen} / {DESC_MIN} min
            </span>
          </div>
          <Textarea
            id="product-desc"
            className={cn(
              "min-h-[120px]",
              form.formState.errors.product_description && "border-amber-500/80 ring-1 ring-amber-500/40",
            )}
            placeholder="Product description (minimum 50 characters required)"
            aria-invalid={!!form.formState.errors.product_description}
            {...form.register("product_description")}
          />
          {form.formState.errors.product_description && (
            <p className="text-xs text-amber-400">{form.formState.errors.product_description.message}</p>
          )}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Textarea
            className={cn(form.formState.errors.key_features && "border-amber-500/80 ring-1 ring-amber-500/40")}
            placeholder="Features separated by commas"
            aria-invalid={!!form.formState.errors.key_features}
            {...form.register("key_features")}
          />
          {form.formState.errors.key_features && (
            <p className="text-xs text-amber-400">{form.formState.errors.key_features.message}</p>
          )}
        </div>
        <Textarea
          className="md:col-span-2"
          placeholder="Unique selling points (optional)"
          {...form.register("unique_selling_points")}
        />
        <motion.button
          type="submit"
          disabled={form.formState.isSubmitting}
          aria-busy={form.formState.isSubmitting}
          whileHover={form.formState.isSubmitting ? undefined : { scale: 1.015 }}
          whileTap={form.formState.isSubmitting ? undefined : { scale: 0.985 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "group md:col-span-2 relative flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border font-semibold shadow-lg transition-[box-shadow,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400",
            "border-cyan-400/40 bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 text-slate-950",
            "shadow-[0_0_28px_-8px_rgba(34,211,238,0.55)] hover:shadow-[0_0_36px_-6px_rgba(34,211,238,0.65)]",
            "disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
          )}
        >
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-0"
            aria-hidden
          />
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" aria-hidden />
              <span>Generate Sales Page</span>
            </>
          )}
        </motion.button>
      </form>
    </main>
  );
}
