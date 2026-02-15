/**
 * Integration test for chat flow
 * Tests the complete flow: create thread → send message → stream response
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
    console.log("MockEventSource created with URL:", url);
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
    this.readyState = 2;
  }
}

let mockEventSource: MockEventSource | null = null;

(global as unknown as { EventSource: typeof MockEventSource }).EventSource =
  class extends MockEventSource {
    constructor(url: string) {
      super(url);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      mockEventSource = this;
    }
  };

describe("Chat Flow Integration", () => {
  beforeEach(() => {
    mockEventSource = null;
  });

  it("should include threadId in URL even if initially empty", () => {
    const appId = "app-123";
    const threadId = ""; // Empty initially

    const { result } = renderHook(
      ({ tid }) =>
        useChatStream({
          appId,
          threadId: tid,
        }),
      { initialProps: { tid: threadId } },
    );

    // Start stream with empty threadId - should NOT work
    act(() => {
      result.current.startStream();
    });

    expect(mockEventSource!.url).toBe(
      `/api/chat/stream?appId=${appId}&threadId=`,
    );

    // This is the BUG - empty threadId causes 400 on backend
  });

  it("should use updated threadId when rerendered", () => {
    const appId = "app-123";

    const { result, rerender } = renderHook(
      ({ tid }) =>
        useChatStream({
          appId,
          threadId: tid,
        }),
      { initialProps: { tid: "" } },
    );

    // Update threadId
    rerender({ tid: "thread-789" });

    // Start stream - should use NEW threadId
    act(() => {
      result.current.startStream();
    });

    expect(mockEventSource!.url).toBe(
      `/api/chat/stream?appId=${appId}&threadId=thread-789`,
    );
  });
});
