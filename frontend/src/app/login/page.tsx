"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { z } from "zod";
import { AuthToolbar } from "@/components/auth/auth-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getAxiosErrorMessage } from "@/lib/api";
import { authApi } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormValue = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<FormValue>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { data } = await authApi.login({
        email: values.email.trim(),
        password: values.password,
      });
      setUser(data.user);
      toast.success("Login successful");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getAxiosErrorMessage(err, "Login failed"));
    }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#083344,transparent_45%)] p-4">
      <AuthToolbar current="login" />
      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_-20px_rgba(34,211,238,0.7)] backdrop-blur"
      >
        <h1 className="font-heading text-2xl">Sign In</h1>
        <Input placeholder="Email" {...form.register("email")} />
        <PasswordInput placeholder="Password" {...form.register("password")} />
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 hover:scale-[1.01]"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Processing..." : "Login"}
        </Button>
      </motion.form>
    </main>
  );
}
