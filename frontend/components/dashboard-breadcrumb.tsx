"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  usePageTitle,
  type BreadcrumbSegment,
} from "@/components/breadcrumb-context";
import { t } from "@/i18n/keys";

interface DashboardBreadcrumbProps {
  pageTitle?: string;
}

/**
 * Build breadcrumb trail based on the current pathname.
 *
 * Examples:
 *   /dashboard                    → Dashboard
 *   /dashboard/apps               → Dashboard / Apps
 *   /dashboard/apps/new           → Dashboard / Apps / New App
 *   /dashboard/apps/:id/edit      → Dashboard / Apps / <App Name>
 *   /dashboard/apps/:id/chat      → Dashboard / Apps / <App Name> / Chat
 *   /dashboard/apps/:id/chat (thread) → Dashboard / Apps / <App Name> / Chat / <Thread Title>
 */
export function DashboardBreadcrumb({ pageTitle }: DashboardBreadcrumbProps) {
  const pathname = usePathname();
  const { pageTitle: contextTitle, extraSegments } = usePageTitle();

  const crumbs = buildCrumbs(
    pathname,
    pageTitle ?? contextTitle,
    extraSegments,
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <span key={`${crumb.href}-${crumb.label}`} className="contents">
            {i > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
            <BreadcrumbItem>
              {i < crumbs.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(
  pathname: string,
  pageTitle?: string,
  extraSegments: BreadcrumbSegment[] = [],
): Crumb[] {
  const crumbs: Crumb[] = [{ label: t("NAV_DASHBOARD"), href: "/dashboard" }];

  if (pathname === "/dashboard") {
    return crumbs;
  }

  if (pathname.startsWith("/dashboard/apps")) {
    crumbs.push({ label: t("NAV_APPS"), href: "/dashboard/apps" });

    if (pathname === "/dashboard/apps") {
      return crumbs;
    }

    if (pathname === "/dashboard/apps/new") {
      crumbs.push({ label: t("NAV_NEW_APP"), href: pathname });
      return crumbs;
    }

    // Extract app ID for edit and chat routes
    const appIdMatch = pathname.match(/^\/dashboard\/apps\/([^/]+)/);
    const appId = appIdMatch?.[1];

    if (pathname.match(/^\/dashboard\/apps\/[^/]+\/edit$/)) {
      crumbs.push({
        label: pageTitle ?? t("NAV_EDIT_APP"),
        href: pathname,
      });
      return crumbs;
    }

    if (pathname.match(/^\/dashboard\/apps\/[^/]+\/chat$/)) {
      // App name crumb (links to edit page)
      crumbs.push({
        label: pageTitle ?? t("NAV_CHAT"),
        href: `/dashboard/apps/${appId}/edit`,
      });

      // Chat crumb
      crumbs.push({
        label: t("NAV_CHAT"),
        href: pathname,
      });

      // Extra segments from context (e.g. thread title)
      for (const seg of extraSegments) {
        crumbs.push({
          label: seg.label,
          href: seg.href ?? pathname,
        });
      }

      return crumbs;
    }
  }

  return crumbs;
}
