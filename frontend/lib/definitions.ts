import { z } from "zod";
import { t } from "@/i18n/keys";

const passwordSchema = z
  .string()
  .min(8, t("FORM_VALIDATION_PASSWORD_MIN"))
  .refine((password) => /[A-Z]/.test(password), {
    message: t("FORM_VALIDATION_PASSWORD_UPPERCASE"),
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: t("FORM_VALIDATION_PASSWORD_SPECIAL"),
  });

export const passwordResetConfirmSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
    token: z.string({ message: t("FORM_VALIDATION_TOKEN_REQUIRED") }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: t("FORM_VALIDATION_PASSWORDS_MATCH"),
    path: ["passwordConfirm"],
  });

export const registerSchema = z.object({
  password: passwordSchema,
  email: z.string().email({ message: t("FORM_VALIDATION_EMAIL_INVALID") }),
});

export const loginSchema = z.object({
  password: z
    .string()
    .min(1, { message: t("FORM_VALIDATION_PASSWORD_REQUIRED") }),
  username: z
    .string()
    .min(1, { message: t("FORM_VALIDATION_USERNAME_REQUIRED") }),
});

export const integrationModes = ["simulator", "webhook"] as const;

export type IntegrationMode = (typeof integrationModes)[number];

export const appSchema = z.object({
  name: z.string().min(1, { message: t("FORM_VALIDATION_NAME_REQUIRED") }),
  description: z
    .string()
    .min(1, { message: t("FORM_VALIDATION_DESCRIPTION_REQUIRED") }),
  integration_mode: z
    .enum(integrationModes, { message: t("FORM_VALIDATION_INTEGRATION_MODE") })
    .default("simulator"),
  webhook_url: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: t("FORM_VALIDATION_WEBHOOK_URL"),
    })
    .default(""),
});
