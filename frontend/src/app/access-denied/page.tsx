"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, Home, MapPinOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeReturnPath } from "@/lib/sanitize-return-path";

function LostTrailIllustration() {
  return (
    <div className="mx-auto w-full max-w-md">
      <svg
        viewBox="0 0 400 280"
        className="mx-auto h-44 w-full text-muted-foreground sm:h-48"
        aria-hidden
      >
        <ellipse cx="200" cy="248" rx="140" ry="18" className="fill-muted/40" />
        <path
          d="M80 200 Q 120 120 200 100 T 320 72"
          fill="none"
          className="stroke-current"
          strokeWidth="3"
          strokeDasharray="8 10"
          strokeLinecap="round"
        />
        <circle cx="80" cy="200" r="10" className="fill-primary/20 stroke-primary" strokeWidth="2" />
        <circle cx="200" cy="100" r="10" className="fill-primary/20 stroke-primary" strokeWidth="2" />
        <path
          d="M310 60 L330 40 L350 55 L335 75 Z"
          className="fill-amber-200 stroke-amber-600 dark:fill-amber-950/50 dark:stroke-amber-500"
          strokeWidth="2"
        />
        <circle cx="328" cy="56" r="4" className="fill-amber-600 dark:fill-amber-400" />
      </svg>
      <p className="mx-auto mt-4 max-w-md text-center text-lg font-medium leading-snug tracking-tight text-muted-foreground sm:text-xl">
        You are not on the map here
      </p>
    </div>
  );
}

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const rawFrom = searchParams.get("from");
  const safeBack = useMemo(() => sanitizeReturnPath(rawFrom), [rawFrom]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center gap-3 text-amber-600/90 dark:text-amber-400/90">
          <MapPinOff className="h-10 w-10 shrink-0" strokeWidth={1.5} />
          <Compass className="h-10 w-10 shrink-0 animate-pulse" strokeWidth={1.5} />
        </div>

        <LostTrailIllustration />

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:mt-7">
          Looks like you took a wrong turn
        </h1>
        <p className="mt-3 text-muted-foreground">
          You do not have access to this area, or the page is not available for your role.
        </p>

        {safeBack && (
          <p className="mt-2 text-xs text-muted-foreground">
            Requested path:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{safeBack}</code>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            data-testid="access-denied-home"
          >
            <Home className="h-4 w-4" />
            My home
          </Link>
          <Link
            href={safeBack ?? "/dashboard"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/20 px-4 text-sm font-medium"
            data-testid="access-denied-back"
          >
            Back to previous place
          </Link>
        </div>

        {!isLoading && user && (
          <p className="mt-6 text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
            {user.role ? <> ({user.role.replace(/_/g, " ")})</> : null}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-dvh items-center justify-center text-muted-foreground">Loading...</div>}
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
