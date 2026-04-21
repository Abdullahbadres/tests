"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

function prettyName(segment: string) {
  if (segment === "") return "Home";
  if (/^\d+$/.test(segment)) return `Page ${segment}`;
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AppBreadcrumb() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, i) => {
      const href = `/${segments.slice(0, i + 1).join("/")}`;
      return { href, label: prettyName(segment) };
    });
  }, [pathname]);

  return (
    <nav className="container-app pt-4 text-sm text-slate-400" aria-label="Breadcrumb">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/" className="hover:text-slate-200">
          Home
        </Link>
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <span>/</span>
            <Link href={crumb.href} className="hover:text-slate-200">
              {crumb.label}
            </Link>
          </span>
        ))}
      </div>
    </nav>
  );
}
