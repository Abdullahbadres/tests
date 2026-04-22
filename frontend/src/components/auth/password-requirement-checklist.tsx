"use client";

import { cn } from "@/lib/utils";

export interface PasswordChecklistItem {
  label: string;
  ok: boolean;
}

type ChecklistVariant = "default" | "profile";

/**
 * Password requirement checklist.
 * - `default`: matches Register page styling (subtle border).
 * - `profile`: higher contrast and larger text for account settings dialog.
 */
export function PasswordRequirementChecklist({
  items,
  variant = "default",
}: {
  items: PasswordChecklistItem[];
  variant?: ChecklistVariant;
}) {
  const profile = variant === "profile";

  return (
    <div
      className={cn(
        "rounded-lg text-slate-100",
        profile
          ? "space-y-3 border border-slate-500/30 bg-slate-950/60 p-4 shadow-inner"
          : "space-y-2.5 border border-white/[0.06] bg-slate-950/40 p-3",
      )}
      role="status"
      aria-label="Password requirements"
    >
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div
            className={cn(
              "h-1.5 w-full overflow-hidden rounded-full",
              profile ? "bg-slate-700/80" : "bg-slate-800/60",
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out",
                profile
                  ? item.ok
                    ? "w-full bg-emerald-500/90"
                    : "w-0 bg-emerald-500/90"
                  : item.ok
                    ? "w-full bg-emerald-800/70"
                    : "w-0 bg-emerald-800/70",
              )}
            />
          </div>
          <p
            className={cn(
              "leading-snug",
              profile ? "text-sm" : "text-xs leading-relaxed",
              item.ok
                ? profile
                  ? "font-medium text-emerald-300"
                  : "text-emerald-500/70"
                : profile
                  ? "text-slate-300"
                  : "text-slate-500",
            )}
          >
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
