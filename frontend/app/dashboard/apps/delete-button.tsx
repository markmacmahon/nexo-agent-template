"use client";

import { removeApp } from "@/components/actions/apps-action";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { t } from "@/i18n/keys";

interface DeleteButtonProps {
  appId: string;
  /** When true, render as an icon button in the table; otherwise as a dropdown item */
  inline?: boolean;
}

export function DeleteButton({ appId, inline }: DeleteButtonProps) {
  const handleDelete = async () => {
    await removeApp(appId);
  };

  if (inline) {
    return (
      <button
        type="button"
        onClick={handleDelete}
        title={t("APP_ACTION_DELETE")}
        aria-label={t("APP_ACTION_DELETE")}
        className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    );
  }

  return (
    <DropdownMenuItem
      className="text-destructive cursor-pointer"
      onClick={handleDelete}
    >
      {t("APP_ACTION_DELETE")}
    </DropdownMenuItem>
  );
}
