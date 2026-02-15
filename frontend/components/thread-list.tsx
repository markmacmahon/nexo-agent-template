"use client";

import type { ThreadRead } from "@/app/openapi-client/index";
import { cn } from "@/lib/utils";
import { MessageSquareIcon } from "lucide-react";
import { t } from "@/i18n/keys";

interface ThreadListProps {
  threads: ThreadRead[];
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onThreadSelect,
}: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <MessageSquareIcon className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t("CHAT_NO_CONVERSATIONS")}
          <br />
          {t("CHAT_START_BELOW")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col py-1">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onThreadSelect(thread.id)}
            className={cn(
              "mx-1.5 rounded-md px-3 py-2.5 text-left transition-colors",
              "hover:bg-accent/60",
              selectedThreadId === thread.id
                ? "bg-accent text-accent-foreground"
                : "text-foreground",
            )}
          >
            <div className="text-sm font-medium truncate leading-snug">
              {thread.title || t("CHAT_NEW_CONVERSATION")}
            </div>
            {thread.customer_id && (
              <div className="mt-0.5 text-xs text-muted-foreground truncate">
                {thread.customer_id}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
