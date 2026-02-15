"use client";

import { removeApp } from "@/components/actions/apps-action";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { t } from "@/i18n/keys";

interface DeleteButtonProps {
  appId: string;
}

export function DeleteButton({ appId }: DeleteButtonProps) {
  const handleDelete = async () => {
    await removeApp(appId);
  };

  return (
    <DropdownMenuItem
      className="text-destructive cursor-pointer"
      onClick={handleDelete}
    >
      {t("APP_ACTION_DELETE")}
    </DropdownMenuItem>
  );
}
