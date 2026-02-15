"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { register } from "@/components/actions/register-action";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submitButton";
import Link from "next/link";
import { FieldError, FormError } from "@/components/ui/FormError";
import { t } from "@/i18n/keys";

export default function Page() {
  const [state, dispatch] = useActionState(register, undefined);
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted px-4">
      <form action={dispatch}>
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">
              {t("AUTH_REGISTER_TITLE")}
            </CardTitle>
            <CardDescription>{t("AUTH_REGISTER_DESCRIPTION")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-6">
            <div className="grid gap-3">
              <Label htmlFor="email">{t("FORM_EMAIL")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("FORM_PLACEHOLDER_EMAIL")}
                required
              />
              <FieldError state={state} field="email" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">{t("FORM_PASSWORD")}</Label>
              <Input id="password" name="password" type="password" required />
              <FieldError state={state} field="password" />
            </div>
            <SubmitButton text={t("AUTH_REGISTER_SUBMIT")} />
            <FormError state={state} />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-foreground"
              >
                {t("AUTH_REGISTER_BACK")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
