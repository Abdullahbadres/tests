"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthToolbarProps {
  current: "login" | "register";
}

export function AuthToolbar({ current }: AuthToolbarProps) {
  const router = useRouter();

  return (
    <div className="mb-4 flex w-full max-w-md items-center justify-between">
      <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
        <Home className="mr-1 h-4 w-4" />
        Home
      </Button>

      {current === "register" ? (
        <Link className="text-sm text-cyan-300 hover:text-cyan-200" href="/login">
          Already have an account? Login
        </Link>
      ) : (
        <Link className="text-sm text-cyan-300 hover:text-cyan-200" href="/register">
          Need an account? Register
        </Link>
      )}

      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}
