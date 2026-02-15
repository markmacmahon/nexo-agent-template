"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login } from "@/components/actions/login-action";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submitButton";
import { FieldError, FormError } from "@/components/ui/FormError";
import { t } from "@/i18n/keys";

export default function Page() {
  const [state, dispatch] = useActionState(login, undefined);
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted px-4">
      <form action={dispatch}>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">
              {t("AUTH_LOGIN_TITLE")}
            </CardTitle>
            <CardDescription>{t("AUTH_LOGIN_DESCRIPTION")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-6">
            <div className="grid gap-3">
              <Label htmlFor="username">{t("FORM_USERNAME")}</Label>
              <Input
                id="username"
                name="username"
                type="email"
                placeholder={t("FORM_PLACEHOLDER_EMAIL")}
                required
              />
              <FieldError state={state} field="username" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">{t("FORM_PASSWORD")}</Label>
              <Input id="password" name="password" type="password" required />
              <FieldError state={state} field="password" />
              <Link
                href="/auth/forgot-password"
                className="ml-auto inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t("AUTH_FORGOT_PASSWORD")}
              </Link>
            </div>
            <SubmitButton text={t("AUTH_LOGIN_SUBMIT")} />
            <FormError state={state} />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("AUTH_LOGIN_NO_ACCOUNT")}{" "}
              <Link
                href="/auth/register"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("AUTH_LOGIN_SIGN_UP")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
