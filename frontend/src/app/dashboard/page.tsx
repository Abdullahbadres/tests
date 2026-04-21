"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { salesPageApi } from "@/lib/sales-pages";
import { useAuth } from "@/hooks/useAuth";
import { SalesPage } from "@/types";

function productPath(page: SalesPage): string {
  const slug = page.product_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `/dashboard/${slug || "product"}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [pages, setPages] = useState<SalesPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        const { data } = await salesPageApi.list();
        setPages(data.data);
      } catch {
        toast.error("Failed to load pages");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [isLoading, user]);

  return (
    <main className="container-app py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-heading text-3xl">Dashboard</h1>
          <Link
            href="/features"
            className="text-sm font-medium text-cyan-400/90 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            How AI works
          </Link>
          {(user?.role ?? "user") === "super_admin" && (
            <Link
              href="/dashboard/admin"
              className="text-sm font-medium text-amber-400/90 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              Admin — users
            </Link>
          )}
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Create Sales Page
        </Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card
              key={page.id}
              role="button"
              tabIndex={0}
              className="relative cursor-pointer border-white/10 bg-white/5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
              onClick={() => router.push(productPath(page))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(productPath(page));
                }
              }}
            >
              <button
                type="button"
                aria-label={`Delete ${page.product_name}`}
                className="absolute top-3 right-3 rounded-md p-1 text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Delete "${page.product_name}"? This cannot be undone.`)) return;
                  try {
                    await salesPageApi.remove(page.id);
                    setPages((prev) => prev.filter((p) => p.id !== page.id));
                    toast.success("Sales page deleted");
                  } catch {
                    toast.error("Failed to delete page");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <CardHeader className="pr-10">
                <CardTitle>{page.product_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Status: {page.status}</p>
                <p>Template: {page.template}</p>
                <div className="flex gap-2">
                  <Link
                    href={productPath(page)}
                    className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                  >
                    View
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const res = await salesPageApi.exportHtml(page.id);
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sales-page-${page.id}.html`;
                      a.click();
                    }}
                  >
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
