import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Blocks } from "lucide-react";
import { t } from "@/i18n/keys";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-muted rounded-lg p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-6">
          <div className="rounded-full bg-primary p-6">
            <Blocks className="h-16 w-16 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            {t("DASHBOARD_TITLE")}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          {t("DASHBOARD_SUBTITLE")}
        </p>

        <Link href="/dashboard/apps">
          <Button className="px-8 py-4 text-xl font-semibold rounded-full shadow-lg">
            {t("DASHBOARD_CTA")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
