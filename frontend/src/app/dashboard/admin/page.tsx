"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordRequirementChecklist } from "@/components/auth/password-requirement-checklist";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getAxiosErrorMessage } from "@/lib/api";
import { adminUsersApi, type AdminUserRow } from "@/lib/admin-users";
import { getPasswordChecklist, registerPasswordSchema, type RegisterFormValues } from "@/lib/password-policy";
import { useAuth } from "@/hooks/useAuth";

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await adminUsersApi.list(p);
      setRows(data.data);
      setTotalRegistered(data.total_registered);
      setMeta({ last_page: data.meta.last_page });
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && (user?.role ?? "user") === "super_admin") {
      void load(page);
    }
  }, [isLoading, user, page, load]);

  if (isLoading) {
    return (
      <main className="container-app py-8">
        <p>Loading...</p>
      </main>
    );
  }

  if (!user || (user.role ?? "user") !== "super_admin") {
    return (
      <main className="container-app py-16 text-center">
        <h1 className="font-heading text-2xl text-slate-100">Access denied</h1>
        <p className="mt-2 text-slate-400">This area is only for super administrators.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-cyan-400 hover:underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="container-app py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-slate-50">Admin — users</h1>
          <p className="mt-1 text-sm text-slate-400">
            Total registered: <span className="font-medium text-slate-200">{totalRegistered}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-1.5")}
          >
            Dashboard
          </Link>
          <Button onClick={() => setCreateOpen(true)}>Create user</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading users…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-300">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-300">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-300">Role</th>
                  <th className="px-4 py-3 font-medium text-slate-300">Registered</th>
                  <th className="px-4 py-3 font-medium text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-slate-200">{row.name}</td>
                    <td className="px-4 py-3 text-slate-300">{row.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.role === "super_admin"
                            ? "rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200"
                            : "rounded bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300"
                        }
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={row.id === user.id}
                        onClick={async () => {
                          if (!confirm(`Delete user ${row.email}?`)) return;
                          try {
                            await adminUsersApi.destroy(row.id);
                            toast.success("User deleted");
                            void load(page);
                          } catch (e) {
                            toast.error(getAxiosErrorMessage(e, "Delete failed"));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.last_page > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-400">
                Page {page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          setPage(1);
          void load(1);
        }}
      />
    </main>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerPasswordSchema),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" },
  });
  const pw = form.watch("password", "");
  const confirmPw = form.watch("password_confirmation", "");
  const checks = getPasswordChecklist(pw, confirmPw);

  useEffect(() => {
    if (open) {
      form.reset({ name: "", email: "", password: "", password_confirmation: "" });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await adminUsersApi.create(values);
      toast.success("User created");
      onCreated();
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, "Create failed"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Input placeholder="Name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-rose-400">{form.formState.errors.name.message}</p>
            )}
            <Input placeholder="Email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-rose-400">{form.formState.errors.email.message}</p>
            )}
            <PasswordInput placeholder="Password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-sm text-rose-400">{form.formState.errors.password.message}</p>
            )}
            <PasswordInput placeholder="Confirm password" {...form.register("password_confirmation")} />
            {form.formState.errors.password_confirmation && (
              <p className="text-sm text-rose-400">{form.formState.errors.password_confirmation.message}</p>
            )}
            <PasswordRequirementChecklist items={checks} />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
