"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n/keys";
import { fetchSubscriberThreads } from "@/components/actions/subscribers-actions";
import type { ThreadSummary } from "@/app/openapi-client";
import { Button } from "@/components/ui/button";

interface ThreadsListProps {
  appId: string;
  subscriberId: string;
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export function ThreadsList({
  appId,
  subscriberId,
  selectedThreadId,
  onThreadSelect,
}: ThreadsListProps) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch threads when subscriber changes
  useEffect(() => {
    setThreads([]);
    setPage(1);
    setLoading(true);
    setError(null);
  }, [subscriberId]);

  // Fetch threads
  useEffect(() => {
    const loadThreads = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchSubscriberThreads(
        appId,
        subscriberId,
        page,
        50,
      );

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (page === 1) {
        setThreads(result.data.items);
      } else {
        setThreads((prev) => [...prev, ...result.data.items]);
      }

      setHasMore((result.data.page ?? 0) < (result.data.pages ?? 0));
      setLoading(false);
    };

    loadThreads();
  }, [appId, subscriberId, page]);

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return <div className="p-4 text-center text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("SUBSCRIBERS_NO_THREADS")}
            </p>
          </div>
        ) : (
          <>
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onThreadSelect(thread.id)}
                className={`w-full text-left p-4 border-b hover:bg-accent transition-colors ${
                  selectedThreadId === thread.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {thread.title || `Thread ${thread.id.slice(0, 8)}`}
                    </p>
                    {thread.last_message_preview && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {thread.last_message_preview}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(thread.updated_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {thread.message_count}{" "}
                    {thread.message_count === 1 ? "message" : "messages"}
                  </span>
                </div>
              </button>
            ))}

            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t("SUBSCRIBERS_LOADING")}
              </div>
            )}

            {hasMore && !loading && (
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  className="w-full"
                >
                  {t("SUBSCRIBERS_LOAD_MORE")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
