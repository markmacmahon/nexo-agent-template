import { useState, useCallback, useRef } from "react";
import { t } from "@/i18n/keys";
import type { MessageRead } from "@/app/openapi-client/index";

export type StreamStatus = "idle" | "streaming" | "error";

interface UseChatStreamOptions {
  appId: string;
  threadId: string;
  onMessageComplete?: (message: MessageRead) => void;
  onError?: (error: string) => void;
}

interface SSEMetaEvent {
  source: string;
  reason?: string;
}

interface SSEDeltaEvent {
  text: string;
}

interface SSEDoneEvent {
  status: string;
  message_id?: string;
  seq?: number;
}

interface SSEErrorEvent {
  message: string;
}

export function useChatStream({
  appId,
  threadId,
  onMessageComplete,
  onError,
}: UseChatStreamOptions) {
  const [streamingText, setStreamingText] = useState<string>("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    (overrideThreadId?: string) => {
      // Use the override if provided, otherwise fall back to the prop
      const actualThreadId = overrideThreadId || threadId;

      // Clean up any existing stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setStreamingText("");
      setStatus("streaming");

      // Use Next.js API route proxy (server-side auth)
      const url = `/api/chat/stream?appId=${appId}&threadId=${actualThreadId}`;

      const eventSource = new EventSource(url, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      // Track accumulated text for the done event
      let accumulatedText = "";

      eventSource.addEventListener("meta", (event) => {
        const data = JSON.parse(event.data) as SSEMetaEvent;
        console.log("SSE meta:", data);
      });

      eventSource.addEventListener("delta", (event) => {
        const data = JSON.parse(event.data) as SSEDeltaEvent;
        accumulatedText += data.text;
        setStreamingText((prev) => prev + data.text);
      });

      eventSource.addEventListener("done", (event) => {
        const data = JSON.parse(event.data) as SSEDoneEvent;

        if (data.status === "completed" && data.message_id) {
          // Message was persisted by backend
          if (onMessageComplete) {
            const completedMessage: MessageRead = {
              id: data.message_id,
              thread_id: actualThreadId,
              seq: data.seq || 0,
              role: "assistant",
              content: accumulatedText,
              content_json: {},
              created_at: new Date().toISOString(),
            };
            onMessageComplete(completedMessage);
          }
        }

        setStatus("idle");
        setStreamingText("");
        eventSource.close();
      });

      // Handle custom "error" events from backend
      eventSource.addEventListener("error", (event: Event) => {
        const messageEvent = event as MessageEvent;
        if (messageEvent.data) {
          try {
            const data = JSON.parse(messageEvent.data) as SSEErrorEvent;
            console.error("SSE error event:", data);

            if (onError) {
              onError(data.message || "Stream error occurred");
            }

            setStatus("error");
            setStreamingText("");
            eventSource.close();
          } catch (e) {
            console.error("Failed to parse SSE error event:", e);
          }
        }
      });

      // Handle EventSource connection errors (network, auth, etc.)
      eventSource.onerror = (event) => {
        console.error("EventSource connection error:", {
          readyState: eventSource.readyState,
          url: eventSource.url,
          event,
        });

        // Connection errors don't have data
        setStatus("error");
        setStreamingText("");
        eventSource.close();

        if (onError) {
          // Check readyState to provide better error message
          const errorMsg =
            eventSource.readyState === EventSource.CLOSED
              ? t("ERROR_STREAM_CLOSED")
              : t("ERROR_STREAM_FAILED");
          onError(errorMsg);
        }
      };
    },
    [appId, threadId, onMessageComplete, onError],
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("idle");
    setStreamingText("");
  }, []);

  return {
    streamingText,
    status,
    startStream,
    stopStream,
  };
}
