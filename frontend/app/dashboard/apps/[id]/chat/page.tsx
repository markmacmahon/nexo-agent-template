import { ChatContainer } from "@/components/chat-container";
import { fetchThreads } from "@/components/actions/chat-actions";
import { fetchAppById } from "@/components/actions/apps-action";
import type { ThreadRead } from "@/app/openapi-client/index";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch app name and initial threads in parallel
  const [appResult, threadsResult] = await Promise.all([
    fetchAppById(id),
    fetchThreads(id, 1, 50),
  ]);

  const appName = "data" in appResult ? appResult.data.name : undefined;

  let initialThreads: ThreadRead[] = [];
  if ("data" in threadsResult) {
    initialThreads = threadsResult.data;
  } else {
    console.error("Failed to fetch threads:", threadsResult.error);
  }

  return (
    <ChatContainer
      appId={id}
      appName={appName}
      initialThreads={initialThreads}
    />
  );
}
