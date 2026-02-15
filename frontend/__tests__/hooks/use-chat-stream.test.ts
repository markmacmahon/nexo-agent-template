/**
 * Tests for useChatStream hook
 *
 * NOTE: EventSource is not natively supported in jsdom, so we need to mock it.
 * These tests verify the hook's behavior with mocked SSE events.
 */

import { renderHook, act } from "@testing-library/react";
import { useChatStream } from "@/hooks/use-chat-stream";

// Mock EventSource
class MockEventSource {
  url: string;
  listeners: Record<string, ((event: MessageEvent | Event) => void)[]> = {};
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent | Event) => void,
  ) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  dispatchEvent(event: MessageEvent | Event): boolean {
    const type = event.type;
    if (this.listeners[type]) {
      this.listeners[type].forEach((listener) => listener(event));
    }
    return true;
  }

  close() {
    this.readyState = 2; // CLOSED
  }
}

// Install mock
(global as unknown as { EventSource: typeof MockEventSource }).EventSource =
  MockEventSource;

describe("useChatStream", () => {
  let mockEventSource: MockEventSource | null = null;

  beforeEach(() => {
    // Capture EventSource instance when created
    const OriginalEventSource = MockEventSource;
    (global as unknown as { EventSource: typeof MockEventSource }).EventSource =
      class extends OriginalEventSource {
        constructor(url: string) {
          super(url);
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          mockEventSource = this;
        }
      };
  });

  afterEach(() => {
    mockEventSource = null;
  });

  it("should handle connection errors without crashing", () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onError,
      }),
    );

    act(() => {
      result.current.startStream();
    });

    expect(mockEventSource).not.toBeNull();

    // Simulate connection error (no data)
    act(() => {
      const errorEvent = new Event("error");
      mockEventSource!.onerror?.(errorEvent);
    });

    expect(result.current.status).toBe("error");
    expect(onError).toHaveBeenCalledWith("Connection to server failed");
  });

  it("should handle custom error events with data", () => {
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onError,
      }),
    );

    act(() => {
      result.current.startStream();
    });

    // Simulate custom error event with JSON data
    act(() => {
      const errorEvent = new MessageEvent("error", {
        data: JSON.stringify({ message: "Backend error occurred" }),
      });
      mockEventSource!.dispatchEvent(errorEvent);
    });

    expect(result.current.status).toBe("error");
    expect(onError).toHaveBeenCalledWith("Backend error occurred");
  });

  it("should accumulate streaming text from delta events", () => {
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
      }),
    );

    act(() => {
      result.current.startStream();
    });

    expect(result.current.status).toBe("streaming");
    expect(result.current.streamingText).toBe("");

    // Send delta events
    act(() => {
      const delta1 = new MessageEvent("delta", {
        data: JSON.stringify({ text: "Hello" }),
      });
      mockEventSource!.dispatchEvent(delta1);
    });

    expect(result.current.streamingText).toBe("Hello");

    act(() => {
      const delta2 = new MessageEvent("delta", {
        data: JSON.stringify({ text: " World" }),
      });
      mockEventSource!.dispatchEvent(delta2);
    });

    expect(result.current.streamingText).toBe("Hello World");
  });

  it("should call onMessageComplete when done event received", () => {
    const onMessageComplete = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onMessageComplete,
      }),
    );

    act(() => {
      result.current.startStream();
    });

    // Send delta events
    act(() => {
      const delta = new MessageEvent("delta", {
        data: JSON.stringify({ text: "Test message" }),
      });
      mockEventSource!.dispatchEvent(delta);
    });

    // Send done event
    act(() => {
      const done = new MessageEvent("done", {
        data: JSON.stringify({
          status: "completed",
          message_id: "msg-123",
          seq: 1,
        }),
      });
      mockEventSource!.dispatchEvent(done);
    });

    expect(result.current.status).toBe("idle");
    expect(onMessageComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-123",
        content: "Test message",
        role: "assistant",
      }),
    );
  });

  it("should handle meta events without crashing", () => {
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
      }),
    );

    act(() => {
      result.current.startStream();
    });

    // Send meta event
    act(() => {
      const meta = new MessageEvent("meta", {
        data: JSON.stringify({ source: "simulator" }),
      });
      mockEventSource!.dispatchEvent(meta);
    });

    // Should not crash, status should still be streaming
    expect(result.current.status).toBe("streaming");
  });

  it("should construct correct EventSource URL", () => {
    const { result } = renderHook(() =>
      useChatStream({
        appId: "app-123",
        threadId: "thread-456",
      }),
    );

    act(() => {
      result.current.startStream();
    });

    expect(mockEventSource?.url).toBe(
      "/api/chat/stream?appId=app-123&threadId=thread-456",
    );
  });
});
