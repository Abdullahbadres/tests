import { z } from "zod";

/** Must match the pattern rules in `App\Rules\PasswordPolicyRule` (Laravel). */
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*.,;:\/|\\}{\"'\]\[]/;

export const passwordPolicyStringSchema = z
  .string()
  .min(6, "Minimum 6 characters")
  .regex(/[A-Z]/, "At least 1 uppercase letter")
  .regex(/[0-9]/, "At least 1 number")
  .regex(
    SPECIAL_CHAR_REGEX,
    "At least 1 special character (!@#$%^&*.,;:/|\\}{\"'[])",
  );

export const registerPasswordSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: passwordPolicyStringSchema,
    password_confirmation: z.string().min(6),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Password confirmation does not match",
  });

export type RegisterFormValues = z.infer<typeof registerPasswordSchema>;

export const editProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    current_password: z.string(),
    password: z.string(),
    password_confirmation: z.string(),
  })
  .superRefine((data, ctx) => {
    const touched =
      data.current_password.length > 0 ||
      data.password.length > 0 ||
      data.password_confirmation.length > 0;

    if (!touched) {
      return;
    }

    if (!data.current_password.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required to change your password",
        path: ["current_password"],
      });
    }
    if (!data.password.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password is required",
        path: ["password"],
      });
    }
    if (!data.password_confirmation.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirm your new password",
        path: ["password_confirmation"],
      });
    }

    if (!data.current_password.length || !data.password.length || !data.password_confirmation.length) {
      return;
    }

    const parsed = passwordPolicyStringSchema.safeParse(data.password);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ["password"] });
      }
    }

    if (data.password !== data.password_confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password confirmation does not match",
        path: ["password_confirmation"],
      });
    }
  });

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function getPasswordChecklist(password: string, confirmPassword: string) {
  return [
    { label: "Minimum 6 characters", ok: password.length >= 6 },
    { label: "At least 1 uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "At least 1 number", ok: /[0-9]/.test(password) },
    {
      label: "At least 1 special character (!@#$%^&*.,;:/|\\}{\"'[])",
      ok: SPECIAL_CHAR_REGEX.test(password),
    },
    {
      label: "Password and confirm password match",
      ok:
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword,
    },
  ];
}
