"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordRequirementChecklist } from "@/components/auth/password-requirement-checklist";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getAxiosErrorMessage } from "@/lib/api";
import { authApi } from "@/lib/auth";
import {
  editProfileSchema,
  getPasswordChecklist,
  type EditProfileFormValues,
} from "@/lib/password-policy";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name,
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const { reset } = form;

  useEffect(() => {
    if (open) {
      reset({
        name: user.name,
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    }
  }, [open, user.name, reset]);

  const password = form.watch("password", "");
  const confirmPassword = form.watch("password_confirmation", "");
  const currentPw = form.watch("current_password", "");
  const passwordTouched =
    currentPw.length > 0 || password.length > 0 || confirmPassword.length > 0;
  const passwordChecks = getPasswordChecklist(password, confirmPassword);

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        const payload: Parameters<typeof authApi.updateProfile>[0] = { name: values.name };
        if (passwordTouched) {
          payload.current_password = values.current_password;
          payload.password = values.password;
          payload.password_confirmation = values.password_confirmation;
        }
        const { data } = await authApi.updateProfile(payload);
        setUser(data.user);
        toast.success("Profile updated.");
        onOpenChange(false);
      } catch (err) {
        toast.error(getAxiosErrorMessage(err, "Failed to update profile."));
      }
    },
    () => {
      toast.error("Please fix the form errors before continuing.");
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md border-slate-600/35 bg-slate-900 text-slate-100 shadow-xl ring-slate-500/20"
        showCloseButton
      >
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg text-slate-50">Profile Settings</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-400">
              Change your name or password. Fields below are optional unless you want a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-2">
              <label htmlFor="profile-name" className="text-sm font-medium text-slate-300">
                Name
              </label>
              <Input id="profile-name" autoComplete="name" {...form.register("name")} />
              {form.formState.errors.name?.message && (
                <p className="rounded-md border border-rose-500/25 bg-rose-950/40 px-2.5 py-1.5 text-sm text-rose-200">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="border-t border-slate-600/30 pt-3">
              <p className="text-sm font-medium text-slate-200">Change password (optional)</p>
              <p className="mt-1 text-xs text-slate-400">
                Leave blank to keep your current password. To change it, fill all three password fields.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-current-pw" className="text-sm font-medium text-slate-300">
                Current password
              </label>
              <PasswordInput
                id="profile-current-pw"
                autoComplete="current-password"
                {...form.register("current_password")}
              />
              {form.formState.errors.current_password?.message && (
                <p className="rounded-md border border-rose-500/25 bg-rose-950/40 px-2.5 py-1.5 text-sm text-rose-200">
                  {form.formState.errors.current_password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-new-pw" className="text-sm font-medium text-slate-300">
                New password
              </label>
              <PasswordInput
                id="profile-new-pw"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password?.message && (
                <p className="rounded-md border border-rose-500/25 bg-rose-950/40 px-2.5 py-1.5 text-sm text-rose-200">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="profile-confirm-pw" className="text-sm font-medium text-slate-300">
                Confirm new password
              </label>
              <PasswordInput
                id="profile-confirm-pw"
                autoComplete="new-password"
                {...form.register("password_confirmation")}
              />
              {form.formState.errors.password_confirmation?.message && (
                <p className="rounded-md border border-rose-500/25 bg-rose-950/40 px-2.5 py-1.5 text-sm text-rose-200">
                  {form.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>
            {passwordTouched && (
              <PasswordRequirementChecklist items={passwordChecks} variant="profile" />
            )}
          </div>
          <DialogFooter className="mt-2 border-t border-slate-600/30 bg-transparent p-0 pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
