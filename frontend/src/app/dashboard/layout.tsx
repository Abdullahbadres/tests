"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side protection: Laravel session cookie ≠ authenticated user (session can be anonymous).
 * Cookie-only middleware checks can trigger 401 on /api/user and /api/sales-pages.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="container-app py-16 text-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-app py-16 text-center text-slate-400">
        Redirecting to login...
      </div>
    );
  }

  return <>{children}</>;
}
