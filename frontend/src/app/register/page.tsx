"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordRequirementChecklist } from "@/components/auth/password-requirement-checklist";
import { AuthToolbar } from "@/components/auth/auth-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authApi } from "@/lib/auth";
import { getPasswordChecklist, registerPasswordSchema, type RegisterFormValues } from "@/lib/password-policy";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerPasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const password = form.watch("password", "");
  const confirmPassword = form.watch("password_confirmation", "");

  const checks = getPasswordChecklist(password, confirmPassword);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        const { data } = await authApi.register(values);
        setUser(data.user);
        toast.success("Registration successful");
        router.push("/dashboard");
      } catch {
        toast.error("Registration failed");
      }
    },
    () => {
      toast.error("Please fix the form errors before continuing.");
    },
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#4c1d95,transparent_45%)] p-4">
      <AuthToolbar current="register" />
      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-fuchsia-400/20 bg-slate-900/70 p-6 shadow-[0_0_40px_-20px_rgba(217,70,239,0.7)] backdrop-blur"
      >
        <h1 className="font-heading text-2xl">Register</h1>
        <Input placeholder="Name" {...form.register("name")} />
        {form.formState.errors.name?.message && (
          <p className="text-sm text-rose-400">{form.formState.errors.name.message}</p>
        )}
        <Input placeholder="Email" {...form.register("email")} />
        {form.formState.errors.email?.message && (
          <p className="text-sm text-rose-400">{form.formState.errors.email.message}</p>
        )}
        <PasswordInput placeholder="Password" {...form.register("password")} />
        {form.formState.errors.password?.message && (
          <p className="text-sm text-rose-400">{form.formState.errors.password.message}</p>
        )}
        <PasswordInput
          placeholder="Confirm Password"
          {...form.register("password_confirmation")}
        />
        {form.formState.errors.password_confirmation?.message && (
          <p className="text-sm text-rose-400">{form.formState.errors.password_confirmation.message}</p>
        )}
        <PasswordRequirementChecklist items={checks} />
        <Button
          type="submit"
          className="w-full cursor-pointer bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/25 hover:scale-[1.01]"
        >
          {form.formState.isSubmitting ? "Processing..." : "Register"}
        </Button>
      </motion.form>
    </main>
  );
}
