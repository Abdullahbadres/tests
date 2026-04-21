"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { WORLD_CURRENCIES, currencyLabel, orderCurrenciesWithPins } from "@/lib/currencies";

type Props = {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  className?: string;
  /** ISO codes shown first (e.g. `["USD"]` for exact price in US dollars). */
  pinCodesFirst?: string[];
  "aria-label"?: string;
};

export function CurrencySelect({
  id,
  value,
  onChange,
  className,
  pinCodesFirst,
  "aria-label": ariaLabel,
}: Props) {
  const [q, setQ] = useState("");

  const baseList = useMemo(
    () =>
      pinCodesFirst?.length
        ? orderCurrenciesWithPins(WORLD_CURRENCIES, pinCodesFirst)
        : WORLD_CURRENCIES,
    [pinCodesFirst],
  );

  const options = useMemo(() => {
    const s = q.trim().toLowerCase();
    const selected = baseList.find((c) => c.code === value);
    let list = baseList;
    if (s) {
      list = baseList.filter(
        (c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s),
      );
    }
    if (selected && !list.some((c) => c.code === selected.code)) {
      return [selected, ...list];
    }
    return list;
  }, [q, value, baseList]);

  return (
    <div className={className}>
      <select
        id={id}
        aria-label={ariaLabel}
        className="h-10 w-full rounded-md border border-white/10 bg-slate-900 px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {currencyLabel(c)}
          </option>
        ))}
      </select>
    </div>
  );
}
