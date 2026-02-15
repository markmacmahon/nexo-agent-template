/**
 * Tests for useChatStream hook
 *
 * The hook uses fetch() + ReadableStream for SSE, not EventSource.
 * We mock fetch and document.cookie. Use a mock reader (no ReadableStream in jsdom).
 */

import { TextDecoder } from "util";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatStream } from "@/hooks/use-chat-stream";

if (
  typeof (global as unknown as { TextDecoder?: unknown }).TextDecoder ===
  "undefined"
) {
  (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder;
}

function encodeSSE(event: string, data: string): Uint8Array {
  const s = `event: ${event}\ndata: ${data}\n\n`;
  return new Uint8Array(Buffer.from(s, "utf-8"));
}

function createMockStreamReader(chunks: Uint8Array[]) {
  let i = 0;
  return {
    read(): Promise<ReadableStreamReadResult<Uint8Array>> {
      if (i >= chunks.length) {
        return Promise.resolve({ done: true, value: undefined });
      }
      return Promise.resolve({ done: false, value: chunks[i++] });
    },
    releaseLock() {},
  };
}

describe("useChatStream", () => {
  let fetchMock: jest.SpyInstance;
  let streamChunks: Uint8Array[];

  beforeEach(() => {
    document.cookie = "accessToken=fake-token";
    streamChunks = [encodeSSE("done", JSON.stringify({ status: "completed" }))];
    if (
      typeof (global as unknown as { fetch?: unknown }).fetch === "undefined"
    ) {
      (global as unknown as { fetch: unknown }).fetch = jest.fn();
    }
    fetchMock = jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => createMockStreamReader(streamChunks),
        },
      } as unknown as Response),
    );
  });

  afterEach(() => {
    fetchMock?.mockRestore();
    document.cookie = "";
  });

  it("should handle connection errors without crashing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const onError = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onError,
      }),
    );

    await act(async () => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(onError).toHaveBeenCalled();
  });

  it("should handle custom error events with data", async () => {
    streamChunks = [
      encodeSSE("error", JSON.stringify({ message: "Backend error occurred" })),
    ];
    const onError = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onError,
      }),
    );

    await act(async () => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(onError).toHaveBeenCalledWith("Backend error occurred");
  });

  it("should accumulate streaming text from delta events", async () => {
    streamChunks = [
      encodeSSE("delta", JSON.stringify({ text: "Hello" })),
      encodeSSE("delta", JSON.stringify({ text: " World" })),
      encodeSSE(
        "done",
        JSON.stringify({
          status: "completed",
          message_id: "msg-accum",
          seq: 1,
        }),
      ),
    ];
    const onMessageComplete = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onMessageComplete,
      }),
    );

    await act(async () => {
      result.current.startStream();
    });

    expect(result.current.status).toBe("idle");
    expect(onMessageComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-accum",
        content: "Hello World",
        role: "assistant",
      }),
    );
  });

  it("should call onMessageComplete when done event received", async () => {
    streamChunks = [
      encodeSSE("delta", JSON.stringify({ text: "Test message" })),
      encodeSSE(
        "done",
        JSON.stringify({
          status: "completed",
          message_id: "msg-123",
          seq: 1,
        }),
      ),
    ];
    const onMessageComplete = jest.fn();
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
        onMessageComplete,
      }),
    );

    await act(async () => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
    expect(onMessageComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-123",
        content: "Test message",
        role: "assistant",
      }),
    );
  });

  it("should handle meta events without crashing", async () => {
    streamChunks = [
      encodeSSE("meta", JSON.stringify({ source: "simulator" })),
      encodeSSE("done", JSON.stringify({ status: "completed" })),
    ];
    const { result } = renderHook(() =>
      useChatStream({
        appId: "test-app",
        threadId: "test-thread",
      }),
    );

    act(() => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("streaming");
    });
    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
  });

  it("should construct correct fetch URL", async () => {
    const { result } = renderHook(() =>
      useChatStream({
        appId: "app-123",
        threadId: "thread-456",
      }),
    );

    act(() => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toMatch(
      /\/apps\/app-123\/threads\/thread-456\/run\/stream$/,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      callUrl,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          Authorization: "Bearer fake-token",
        }),
      }),
    );
  });
});
