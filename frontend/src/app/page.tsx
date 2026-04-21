"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  LayoutDashboard,
  Newspaper,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const publicArticles = [
  {
    title: "How AI transforms raw product notes into high-converting sales pages",
    summary: "Learn the exact flow from product input to persuasive copy and section structure.",
    href: "/features",
    tag: "Guide",
  },
  {
    title: "What to write in your product fields for better AI results",
    summary: "Simple input strategy for headline quality, benefit clarity, and stronger CTAs.",
    href: "/dashboard/create",
    tag: "Best practice",
  },
  {
    title: "Why UOM pricing clarity can improve trust and conversion",
    summary: "Show exact totals for quantity-based pricing so buyers know what they pay.",
    href: "/dashboard",
    tag: "News",
  },
];

const platformHighlights = [
  {
    icon: WandSparkles,
    title: "AI-generated structured copy",
    text: "Headline, sub-headline, polished description, benefits, features, social proof, and CTA.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-user ready",
    text: "Each registered user manages their own product pages safely in one central platform.",
  },
  {
    icon: Rocket,
    title: "Fast export workflow",
    text: "One-click HTML export and direct proposal flow from each product dashboard.",
  },
];

const trustItems = [
  "Trusted by growth teams",
  "Built for multi-user workflows",
  "Fast export to client-ready HTML",
  "Reliable AI regeneration pipeline",
];

const faqItems = [
  {
    q: "Do I need to write prompts manually?",
    a: "No. The system uses your saved product data to generate structured sales copy automatically.",
  },
  {
    q: "Can I regenerate only one section?",
    a: "Yes. You can regenerate headline, description, benefits, features, social proof, pricing, and CTA individually.",
  },
  {
    q: "Is this suitable for multi-user teams?",
    a: "Yes. Each user can manage their own product pages and workflows inside the same platform.",
  },
  {
    q: "Can I export and share the final page?",
    a: "Yes. You can export each generated page into HTML and share it with clients or internal teams.",
  },
];

const techNewsPool = [
  "AI copilots keep improving developer productivity across software teams.",
  "Open-source LLM tooling grows rapidly for safer and more controllable apps.",
  "Edge computing adoption increases to deliver faster real-time experiences.",
  "Major cloud vendors expand managed AI services for startups and enterprises.",
  "Low-code automation helps operations teams ship internal tools more quickly.",
  "Cybersecurity platforms adopt AI-assisted detection for faster incident response.",
  "Design systems and component libraries improve consistency across modern products.",
  "Web performance best practices continue reducing load times on mobile devices.",
  "Data observability tools become standard in analytics and ML pipelines.",
  "Voice and multilingual interfaces are becoming more accessible in SaaS products.",
];

function HomeThemeBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/3 translate-y-1/4 rounded-full bg-fuchsia-500/20 blur-3xl" />
    </div>
  );
}

function TechNewsTicker() {
  const [items, setItems] = useState<string[]>([]);
  const repeatedItems = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    const shuffle = () => {
      const next = [...techNewsPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      setItems(next);
    };
    shuffle();
    const timer = setInterval(shuffle, 14000);
    return () => clearInterval(timer);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto mt-4 w-full max-w-6xl overflow-hidden rounded-xl border border-cyan-200/20 bg-[#0A1A33]/70 py-2">
      <div className="mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] whitespace-nowrap text-sm text-cyan-100">
        <div className="inline-block min-w-full animate-[ticker_26s_linear_infinite]">
          {repeatedItems.map((item, idx) => (
            <span key={`${item}-${idx}`} className="mx-6 inline-flex items-center gap-2">
              <span className="text-cyan-300">•</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
  }

  if (user) {
    return (
      <main className="relative min-h-screen bg-linear-to-b from-[#061326] via-[#0A1830] to-[#130A2E] px-4 py-8 md:px-8 md:py-12">
        <HomeThemeBackground />
        <TechNewsTicker />
        <section className="relative z-10 mx-auto w-full max-w-6xl rounded-3xl border border-cyan-200/20 bg-white/6 p-6 backdrop-blur-sm md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Logged in workspace
              </div>
              <h1 className="font-heading text-4xl leading-tight md:text-5xl">
                Welcome back, {user.name}. Build better pages faster.
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Your AI Sales Page Generator workspace is ready. Create product pages, regenerate sections with AI,
                and deliver conversion-ready copy with clear pricing.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-md bg-linear-to-r from-cyan-300 to-sky-300 px-4 py-2.5 font-semibold text-slate-950 transition hover:brightness-105"
                  href="/dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Open Dashboard
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-200/30 bg-cyan-200/5 px-4 py-2.5 font-medium text-slate-100 transition hover:bg-cyan-200/10"
                  href="/dashboard/create"
                >
                  <Rocket className="h-4 w-4" />
                  Create New Product
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200/20 bg-[#0A1A33]/70 p-5">
              <div className="flex items-center gap-3">
                <Image src="/ai-sales-logo.svg" alt="AI Sales Page Generator logo" width={52} height={52} />
                <div>
                  <p className="text-sm text-slate-400">Platform status</p>
                  <p className="font-semibold text-emerald-300">Ready to generate</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">AI content engine: Active</p>
                <p className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">Template system: Modern/Bold/Elegant</p>
                <p className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2">Export pipeline: HTML enabled</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto mt-8 grid w-full max-w-6xl gap-4 md:grid-cols-3">
          {platformHighlights.map((item) => (
            <article key={item.title} className="rounded-xl border border-cyan-200/15 bg-[#0A1A33]/65 p-5">
              <item.icon className="h-5 w-5 text-cyan-300" />
              <h2 className="mt-3 text-lg font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-center text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-6">
          <div className="flex items-center gap-2 text-cyan-300">
            <Newspaper className="h-4 w-4" />
            <p className="text-sm font-medium">Insights and updates</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {publicArticles.map((article) => (
              <article key={article.title} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{article.tag}</p>
                <h3 className="mt-2 text-base font-semibold text-slate-100">{article.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{article.summary}</p>
                <Link href={article.href} className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
                  Read more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-6">
          <h2 className="font-heading text-2xl text-slate-100 md:text-3xl">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-100">{item.q}</summary>
                <p className="mt-2 text-sm text-slate-300">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
      <main className="relative min-h-screen bg-linear-to-b from-[#061326] via-[#0A1830] to-[#130A2E] px-4 py-8 md:px-8 md:py-12">
      <HomeThemeBackground />
      <TechNewsTicker />
      <section className="relative z-10 mx-auto w-full max-w-6xl rounded-3xl border border-cyan-200/20 bg-white/6 p-6 backdrop-blur-sm md:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Public overview
            </div>
            <h1 className="font-heading text-4xl leading-tight md:text-6xl">AI Sales Page Generator</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Create persuasive, structured sales pages from simple product data. Perfect for founders, sales teams,
              agencies, and multi-client businesses that need speed with quality.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-linear-to-r from-cyan-300 to-sky-300 px-5 py-2.5 font-semibold text-slate-950 transition hover:brightness-105"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-md border border-cyan-200/30 bg-cyan-200/5 px-5 py-2.5 font-semibold text-slate-100 transition hover:bg-cyan-200/10"
                href="/register"
              >
                Register
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-slate-900/60 px-5 py-2.5 font-medium text-slate-100 hover:bg-slate-800/80"
                href="/features"
              >
                <BookOpen className="h-4 w-4" />
                Learn Features
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-200/20 bg-[#0A1A33]/70 p-6 text-center">
            <Image
              src="/ai-sales-logo.svg"
              alt="AI Sales Page Generator logo"
              width={120}
              height={120}
              className="mx-auto"
            />
            <h2 className="mt-4 text-xl font-semibold">Built for conversion-focused teams</h2>
            <p className="mt-2 text-sm text-slate-400">
              From product brief to ready-to-share landing copy in minutes.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-8 grid w-full max-w-6xl gap-4 md:grid-cols-3">
        {platformHighlights.map((item) => (
          <article key={item.title} className="rounded-xl border border-cyan-200/15 bg-[#0A1A33]/65 p-5">
            <item.icon className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-100">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-center text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-6">
        <h2 className="font-heading text-2xl text-slate-100 md:text-3xl">How it works</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <p className="text-sm font-semibold text-cyan-300">1. Input product data</p>
            <p className="mt-2 text-sm text-slate-300">Name, description, audience, features, USP, pricing, and UOM.</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <p className="text-sm font-semibold text-cyan-300">2. Generate with AI</p>
            <p className="mt-2 text-sm text-slate-300">System builds complete persuasive sections from your saved fields.</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <p className="text-sm font-semibold text-cyan-300">3. Preview, update, export</p>
            <p className="mt-2 text-sm text-slate-300">Regenerate sections, confirm pricing, and export final HTML quickly.</p>
          </article>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-6">
        <div className="flex items-center gap-2 text-cyan-300">
          <Newspaper className="h-4 w-4" />
          <p className="text-sm font-medium">Articles & news</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {publicArticles.map((article) => (
            <article key={article.title} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{article.tag}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-100">{article.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{article.summary}</p>
              <Link href={article.href} className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="font-heading text-2xl text-slate-100 md:text-3xl">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {faqItems.map((item) => (
            <details key={item.q} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-100">{item.q}</summary>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-cyan-200/15 bg-[#0A1A33]/65 p-6 text-center">
        <h2 className="font-heading text-2xl md:text-3xl">Start creating better sales pages today</h2>
        <p className="mt-2 text-slate-300">Structured input and reliable output.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link className="rounded-md bg-linear-to-r from-cyan-300 to-sky-300 px-5 py-2.5 font-semibold text-slate-950 transition hover:brightness-105" href="/register">
            Start free
          </Link>
          <Link className="rounded-md border border-white/20 px-5 py-2.5 font-medium text-slate-100 hover:bg-white/5" href="/login">
            I already have an account
          </Link>
        </div>
      </section>
    </main>
  );
}
