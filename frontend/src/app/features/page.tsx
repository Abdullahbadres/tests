import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Globe,
  Heading,
  LayoutTemplate,
  ListChecks,
  MessageSquareQuote,
  Sparkles,
  Tag,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How AI works",
  description:
    "Save product data when you create a page, then run Generate with AI on that product’s dashboard — the LLM receives your structured inputs automatically. Output is a styled sales page, not raw text.",
};

const pipeline = [
  {
    title: "Headline & sub-headline",
    description:
      "Above-the-fold hook and supporting copy, written to capture attention and state the product promise.",
    icon: Heading,
  },
  {
    title: "Product description",
    description: "Narrative that explains what you sell, who it is for, and why it matters.",
    icon: FileText,
  },
  {
    title: "Benefits & features",
    description:
      "Structured benefits list plus a features breakdown so readers see concrete value.",
    icon: ListChecks,
  },
  {
    title: "Social proof",
    description:
      "Placeholder testimonials and stats you can refine after the first generation.",
    icon: MessageSquareQuote,
  },
  {
    title: "Pricing & CTA",
    description:
      "Pricing display, packaging context, and a clear call-to-action with supporting copy and optional urgency.",
    icon: Tag,
  },
  {
    title: "SEO meta",
    description: "Page title and meta description for search and sharing previews.",
    icon: Globe,
  },
];

export default function ProductFeaturesPage() {
  return (
    <main className="container-app py-10 pb-16">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <LayoutTemplate className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <header className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI pipeline
        </div>
        <h1 className="font-heading text-3xl tracking-tight text-slate-50 md:text-4xl">
          What the AI builds for you
        </h1>
        <p className="mt-4 text-left text-base leading-relaxed text-slate-300 md:text-center">
          You <strong className="font-medium text-slate-100">don&apos;t type LLM prompts on this page</strong>.
          Enter product details when you <strong className="font-medium text-slate-100">create a sales page</strong>, then
          open <strong className="font-medium text-slate-100">Dashboard → your product</strong> and click{" "}
          <strong className="font-medium text-slate-100">Generate with AI</strong>. The server sends your saved
          fields (description, audience, price, features, USP) to the{" "}
          <strong className="font-medium text-slate-100">LLM API</strong> and turns them into{" "}
          <strong className="font-medium text-slate-100">structured marketing copy</strong> — headline through
          CTA — then renders it as a <strong className="font-medium text-slate-100">styled landing preview</strong>{" "}
          (modern / bold / elegant), not a raw text dump.
        </p>
      </header>

      <section className="mx-auto mt-12 max-w-3xl rounded-xl border border-white/10 bg-slate-900/50 p-6 md:p-8">
        <h2 className="font-heading text-lg text-slate-100">Structured output includes</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-400">
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>
              <span className="text-slate-200">Compelling headline</span> and sub-headline
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>Product description</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>Benefits section</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>Features breakdown</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>Social proof placeholder</span> (testimonials & stats)
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>Pricing display</span> (price, billing note, value statement, what&apos;s included)
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400/90">•</span>
            <span>Clear call-to-action</span> with supporting copy
          </li>
        </ul>
        <p className="mt-6 border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-300">
          <strong className="text-slate-100">Presentation:</strong> The app renders this as a styled landing
          preview — what you see matches a real sales page layout, not a raw text dump from the model.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-4xl">
        <h2 className="font-heading text-center text-xl text-slate-100">How sections map in the app</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-400">
          Generated content is stored in structured JSON and mapped to page components and HTML export.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {pipeline.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="rounded-xl border border-white/[0.07] bg-slate-950/40 p-4 transition-colors hover:border-cyan-500/20"
            >
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-medium text-slate-100">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
