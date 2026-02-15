import { AuthJwtLoginError, RegisterRegisterError } from "@/app/clientService";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { translateError } from "@/i18n/keys";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(
  error: RegisterRegisterError | AuthJwtLoginError,
): string {
  let errorMessage = "An unknown error occurred";

  if (typeof error.detail === "string") {
    errorMessage = error.detail;
  } else if (typeof error.detail === "object" && "reason" in error.detail) {
    errorMessage = error.detail["reason"];
  }

  return translateError(errorMessage);
}
