import { data as iso4217Data } from "currency-codes";

export interface CurrencyOption {
  code: string;
  name: string;
}

/** ISO 4217 active currency codes with English names (worldwide list). */
export const WORLD_CURRENCIES: CurrencyOption[] = iso4217Data
  .filter((row) => row.code && /^[A-Z]{3}$/.test(row.code))
  .map((row) => ({
    code: row.code,
    name: row.currency,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

export function currencyLabel(option: CurrencyOption): string {
  return `${option.code} — ${option.name}`;
}

/** Put `pinCodes` first (e.g. USD for price), then the rest A–Z by name. */
export function orderCurrenciesWithPins(
  currencies: CurrencyOption[],
  pinCodes: string[],
): CurrencyOption[] {
  const upper = pinCodes.map((c) => c.toUpperCase());
  const pinSet = new Set(upper);
  const pinned = upper
    .map((code) => currencies.find((c) => c.code === code))
    .filter((c): c is CurrencyOption => Boolean(c));
  const rest = currencies
    .filter((c) => !pinSet.has(c.code))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  return [...pinned, ...rest];
}
