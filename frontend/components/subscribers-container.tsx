"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/i18n/keys";
import { SubscribersList } from "@/components/subscribers-list";
import { ThreadsList } from "@/components/threads-list";
import { ThreadChat } from "@/components/thread-chat";
import { usePageTitle } from "@/components/breadcrumb-context";

interface SubscribersContainerProps {
  appId: string;
  appName?: string;
  initialSubscriberId?: string;
  initialThreadId?: string;
}

export function SubscribersContainer({
  appId,
  appName,
  initialSubscriberId,
  initialThreadId,
}: SubscribersContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPageTitle, setExtraSegments } = usePageTitle();
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<
    string | null
  >(initialSubscriberId || null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId || null,
  );

  // Set breadcrumb
  useEffect(() => {
    if (appName) {
      setPageTitle(appName);
      setExtraSegments([{ label: t("SUBSCRIBERS_PAGE_TITLE") }]);
    }
  }, [appName, setPageTitle, setExtraSegments]);

  // Update URL when selection changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSubscriberId) {
      params.set("subscriber", selectedSubscriberId);
    } else {
      params.delete("subscriber");
    }

    if (selectedThreadId) {
      params.set("thread", selectedThreadId);
    } else {
      params.delete("thread");
    }

    const newUrl = params.toString()
      ? `/dashboard/apps/${appId}/subscribers?${params.toString()}`
      : `/dashboard/apps/${appId}/subscribers`;

    router.replace(newUrl, { scroll: false });
  }, [selectedSubscriberId, selectedThreadId, appId, router, searchParams]);

  const handleSubscriberSelect = (subscriberId: string) => {
    setSelectedSubscriberId(subscriberId);
    // Clear thread selection when switching subscribers
    setSelectedThreadId(null);
  };

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  return (
    <div
      data-testid="subscribers-container"
      className="flex h-[calc(100vh-4rem)] overflow-hidden"
    >
      {/* Left Panel: Subscribers List */}
      <div
        data-testid="subscribers-panel"
        className="w-80 border-r flex-shrink-0 overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b">
          <h2
            className="text-lg font-semibold"
            data-testid="subscribers-panel-title"
          >
            {t("SUBSCRIBERS_LIST_TITLE")}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SubscribersList
            appId={appId}
            selectedSubscriberId={selectedSubscriberId}
            onSubscriberSelect={handleSubscriberSelect}
          />
        </div>
      </div>

      {/* Middle Panel: Threads List */}
      <div
        data-testid="subscribers-threads-panel"
        className="w-80 border-r flex-shrink-0 overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b">
          <h2
            className="text-lg font-semibold"
            data-testid="subscribers-threads-panel-title"
          >
            {t("SUBSCRIBERS_THREADS_TITLE")}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedSubscriberId ? (
            <ThreadsList
              appId={appId}
              subscriberId={selectedSubscriberId}
              selectedThreadId={selectedThreadId}
              onThreadSelect={handleThreadSelect}
            />
          ) : (
            <div
              className="p-4 text-center text-muted-foreground"
              data-testid="subscribers-select-subscriber-msg"
            >
              {t("SUBSCRIBERS_SELECT_SUBSCRIBER")}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Thread Chat */}
      <div
        data-testid="subscribers-chat-panel"
        className="flex-1 overflow-hidden"
      >
        {selectedThreadId && selectedSubscriberId ? (
          <ThreadChat appId={appId} threadId={selectedThreadId} />
        ) : (
          <div
            className="flex items-center justify-center h-full text-muted-foreground"
            data-testid="subscribers-select-thread-msg"
          >
            {t("SUBSCRIBERS_SELECT_THREAD")}
          </div>
        )}
      </div>
    </div>
  );
}
