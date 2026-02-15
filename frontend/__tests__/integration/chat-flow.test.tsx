/**
 * Integration test for chat flow
 * Tests that useChatStream uses correct URL (fetch-based, no EventSource).
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

describe("Chat Flow Integration", () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    document.cookie = "accessToken=fake-token";
    if (
      typeof (global as unknown as { fetch?: unknown }).fetch === "undefined"
    ) {
      (global as unknown as { fetch: unknown }).fetch = jest.fn();
    }
    const doneChunk = new Uint8Array(
      Buffer.from('event: done\ndata: {"status":"completed"}\n\n', "utf-8"),
    );
    fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      body: { getReader: () => createMockStreamReader([doneChunk]) },
    } as unknown as Response);
  });

  afterEach(() => {
    fetchMock?.mockRestore();
    document.cookie = "";
  });

  it("should call fetch with threadId in URL (empty threadId when not provided)", async () => {
    const appId = "app-123";
    const threadId = "";

    const { result } = renderHook(
      ({ tid }) =>
        useChatStream({
          appId,
          threadId: tid,
        }),
      { initialProps: { tid: threadId } },
    );

    act(() => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain(`/apps/${appId}/threads/`);
    expect(callUrl).toContain("/run/stream");
    // threadId is empty so URL ends with .../threads//run/stream
    expect(callUrl).toMatch(/\/threads\/[^/]*\/run\/stream$/);
  });

  it("should use updated threadId when rerendered", async () => {
    const appId = "app-123";

    const { result, rerender } = renderHook(
      ({ tid }) =>
        useChatStream({
          appId,
          threadId: tid,
        }),
      { initialProps: { tid: "" } },
    );

    rerender({ tid: "thread-789" });

    act(() => {
      result.current.startStream();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl).toContain("thread-789");
    expect(callUrl).toMatch(
      new RegExp(`/apps/${appId}/threads/thread-789/run/stream`),
    );
  });
});
