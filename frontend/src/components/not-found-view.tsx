"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, RotateCcw, SearchX, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MissingPlanetIllustration() {
  return (
    <div className="mx-auto w-full max-w-md">
      <svg viewBox="0 0 420 260" className="mx-auto h-44 w-full text-muted-foreground sm:h-48" aria-hidden>
        <defs>
          <radialGradient id="nfGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="210" cy="228" rx="150" ry="18" className="fill-muted/40" />
        <circle cx="210" cy="120" r="70" fill="url(#nfGlow)" />
        <circle cx="210" cy="120" r="46" className="fill-primary/15 stroke-primary" strokeWidth="2" />
        <path d="M132 124 Q 210 66 288 124" fill="none" className="stroke-primary/70" strokeWidth="3" />
        <circle cx="146" cy="95" r="4" className="fill-primary/80" />
        <circle cx="282" cy="95" r="4" className="fill-primary/80" />
        <path d="M176 144 Q 210 166 244 144" fill="none" className="stroke-primary/70" strokeWidth="3" />
        <path
          d="M322 52 l18 -12 l14 18 l-16 12 z"
          className="fill-amber-200 stroke-amber-600 dark:fill-amber-950/50 dark:stroke-amber-500"
          strokeWidth="2"
        />
      </svg>
      <p className="mt-4 text-center text-lg font-medium tracking-tight text-muted-foreground sm:text-xl">
        We searched the map, but this page is missing
      </p>
    </div>
  );
}

export function NotFoundView() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mb-6 flex items-center justify-center gap-3 text-sky-600/90 dark:text-sky-400/90">
          <SearchX className="h-10 w-10 shrink-0" strokeWidth={1.5} />
          <Sparkles className="h-10 w-10 shrink-0 animate-pulse" strokeWidth={1.5} />
        </div>

        <MissingPlanetIllustration />

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">404 - Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The link may be outdated, mistyped, or no longer exists.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            data-testid="not-found-action-home"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex items-center justify-center gap-2")}
          >
            <Home className="h-4 w-4" />
            Take me home
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            data-testid="not-found-action-back"
            onClick={() => router.back()}
          >
            <RotateCcw className="h-4 w-4" />
            Return to previous page
          </Button>
        </div>
      </div>
    </div>
  );
}
