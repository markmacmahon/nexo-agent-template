"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n/keys";
import { fetchSubscribers } from "@/components/actions/subscribers-actions";
import type { SubscriberSummary } from "@/app/openapi-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SubscribersListProps {
  appId: string;
  selectedSubscriberId: string | null;
  onSubscriberSelect: (subscriberId: string) => void;
}

export function SubscribersList({
  appId,
  selectedSubscriberId,
  onSubscriberSelect,
}: SubscribersListProps) {
  const [subscribers, setSubscribers] = useState<SubscriberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch subscribers
  useEffect(() => {
    const loadSubscribers = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchSubscribers(
        appId,
        page,
        50,
        searchDebounce || undefined,
      );

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (page === 1) {
        setSubscribers(result.data.items);
      } else {
        setSubscribers((prev) => [...prev, ...result.data.items]);
      }

      setHasMore((result.data.page ?? 0) < (result.data.pages ?? 0));
      setLoading(false);
    };

    loadSubscribers();
  }, [appId, page, searchDebounce]);

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
      {/* Search Input */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("SUBSCRIBERS_SEARCH_PLACEHOLDER")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="subscribers-search"
          />
        </div>
      </div>

      {/* Subscribers List */}
      <div className="flex-1 overflow-y-auto">
        {subscribers.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("SUBSCRIBERS_NO_SUBSCRIBERS")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("SUBSCRIBERS_NO_SUBSCRIBERS_DESCRIPTION")}
            </p>
          </div>
        ) : (
          <>
            {subscribers.map((subscriber) => (
              <button
                key={subscriber.id}
                onClick={() => onSubscriberSelect(subscriber.id)}
                className={`w-full text-left p-4 border-b hover:bg-accent transition-colors ${
                  selectedSubscriberId === subscriber.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {subscriber.display_name || subscriber.customer_id}
                    </p>
                    {subscriber.display_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {subscriber.customer_id}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(subscriber.last_message_at ?? null)}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {subscriber.thread_count}{" "}
                    {subscriber.thread_count === 1 ? "thread" : "threads"}
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
