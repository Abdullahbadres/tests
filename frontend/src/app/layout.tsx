import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppBreadcrumb } from "@/components/navigation/app-breadcrumb";
import { UserAccountMenu } from "@/components/layout/user-account-menu";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Sales Page Generator",
  description:
    "Send product data to an LLM and get a structured, styled sales page — headline, benefits, pricing, CTA, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <UserAccountMenu />
        <AppBreadcrumb />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
