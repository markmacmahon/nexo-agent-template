import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * SSE Proxy Route
 *
 * This route proxies SSE streaming from the backend to the frontend.
 * It runs server-side, allowing it to:
 * 1. Access httpOnly cookies (auth token)
 * 2. Add Authorization header to backend request
 * 3. Stream response back to browser
 *
 * This solves the issue where browser EventSource cannot send httpOnly cookies
 * to the backend directly.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appId = searchParams.get("appId");
  const threadId = searchParams.get("threadId");

  console.log("SSE proxy request:", { appId, threadId, url: request.url });

  if (!appId || !threadId) {
    console.error("Missing params:", { appId, threadId });
    return new Response("Missing appId or threadId", { status: 400 });
  }

  // Extract auth token from cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Construct backend SSE URL
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8000";
  const backendUrl = `${baseUrl}/apps/${appId}/threads/${threadId}/run/stream`;

  try {
    // Fetch from backend with auth header
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend SSE error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        backendUrl,
      });
      return new Response(errorText, { status: response.status });
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
