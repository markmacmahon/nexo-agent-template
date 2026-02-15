/**
 * @jest-environment node
 */

import { GET } from "@/app/api/chat/stream/route";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Mock next/headers
jest.mock("next/headers", () => {
  const mockGet = jest.fn();
  return {
    cookies: jest.fn().mockResolvedValue({ get: mockGet }),
  };
});

// Mock global fetch
global.fetch = jest.fn();

describe("SSE Proxy Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if appId is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?threadId=thread-123",
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Missing appId or threadId");
  });

  it("should return 400 if threadId is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?appId=app-123",
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Missing appId or threadId");
  });

  it("should return 401 if no access token found", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue(undefined);

    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?appId=app-123&threadId=thread-456",
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
    const text = await response.text();
    expect(text).toBe("Unauthorized");
  });

  it("should proxy SSE stream with auth token", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue({
      value: "test-token",
    });

    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: test\n\n"));
        controller.close();
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?appId=app-123&threadId=thread-456",
    );

    const response = await GET(request);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/apps/app-123/threads/thread-456/run/stream",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
          Accept: "text/event-stream",
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("should return backend error on failed response", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue({
      value: "test-token",
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Thread not found",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?appId=app-123&threadId=thread-456",
    );

    const response = await GET(request);

    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toBe("Thread not found");
  });

  it("should return 500 on fetch error", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue({
      value: "test-token",
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network failure"));

    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?appId=app-123&threadId=thread-456",
    );

    const response = await GET(request);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe("Internal Server Error");
  });

  it("should use API_BASE_URL from environment", async () => {
    const originalEnv = process.env.API_BASE_URL;
    process.env.API_BASE_URL = "http://custom-backend:9000";

    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue({
      value: "test-token",
    });

    const mockStream = new ReadableStream();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/chat/stream?appId=app-123&threadId=thread-456",
    );

    await GET(request);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://custom-backend:9000/apps/app-123/threads/thread-456/run/stream",
      expect.any(Object),
    );

    // Restore
    if (originalEnv) {
      process.env.API_BASE_URL = originalEnv;
    } else {
      delete process.env.API_BASE_URL;
    }
  });
});
