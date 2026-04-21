/**
 * Real-time rates (proxied via `/api/exchange-rates/[base]` to avoid browser CORS).
 * Returns how many units of `to` equal 1 unit of `from`.
 */
export async function fetchConversionRate(from: string, to: string): Promise<number> {
  const f = from.trim().toLowerCase();
  const t = to.trim().toLowerCase();
  if (f === t) {
    return 1;
  }
  const res = await fetch(`/api/exchange-rates/${encodeURIComponent(f)}`);
  if (!res.ok) {
    throw new Error(`Exchange rate request failed (${res.status})`);
  }
  const data: Record<string, Record<string, number>> = await res.json();
  const rate = data[f]?.[t];
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error("Rate not available for this pair");
  }
  return rate;
}

export function formatMoneyAmount(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Display exchange rate multiplier (units of `to` per 1 unit of `from`). */
export function formatRateMultiplier(rate: number, maxFractionDigits = 6): string {
  if (!Number.isFinite(rate)) {
    return "—";
  }
  const abs = Math.abs(rate);
  const digits = abs >= 1 ? 4 : abs >= 0.01 ? 5 : maxFractionDigits;
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.min(digits, maxFractionDigits),
  });
}
