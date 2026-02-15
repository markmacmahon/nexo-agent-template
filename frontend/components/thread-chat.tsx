"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import type { MessageRead } from "@/app/openapi-client/index";
import { fetchMessages } from "@/components/actions/chat-actions";
import { createAssistantMessage } from "@/components/actions/chat-actions";

interface ThreadChatProps {
  appId: string;
  threadId: string;
}

export function ThreadChat({ appId, threadId }: ThreadChatProps) {
  const [messages, setMessages] = useState<MessageRead[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages when thread changes
  useEffect(() => {
    async function loadMessages() {
      setLoading(true);
      const result = await fetchMessages(appId, threadId, 100);
      if ("error" in result) {
        console.error("Failed to fetch messages:", result.error);
        setLoading(false);
        return;
      }

      setMessages(result.data);
      setLoading(false);
    }

    loadMessages();
  }, [appId, threadId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Send as partner/agent message
      const result = await createAssistantMessage(appId, threadId, content);

      if ("error" in result) {
        console.error("Failed to send message:", result.error);
        return;
      }

      // Refetch messages to get the latest state
      const messagesResult = await fetchMessages(appId, threadId, 100);
      if ("data" in messagesResult) {
        setMessages(messagesResult.data);
      }
    },
    [appId, threadId],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>
      <div className="border-t p-4">
        <MessageInput onSendMessage={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
}
