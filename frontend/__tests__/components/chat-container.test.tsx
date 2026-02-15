import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatContainer } from "@/components/chat-container";
import * as chatActions from "../../components/actions/chat-actions";

// jsdom does not provide ResizeObserver (used by MessageList/useScroll)
const mockResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));
beforeAll(() => {
  global.ResizeObserver = mockResizeObserver;
  Element.prototype.scrollTo = jest.fn();
});
afterAll(() => {
  delete (global as unknown as { ResizeObserver?: unknown }).ResizeObserver;
});

jest.mock("../../components/actions/chat-actions", () => ({
  fetchMessages: jest.fn().mockResolvedValue({ data: [] }),
  sendMessage: jest.fn(),
  createNewThread: jest.fn(),
  updateThreadTitle: jest.fn(),
}));

jest.mock("../../hooks/use-chat-stream", () => ({
  useChatStream: () => ({
    streamingText: "",
    status: "idle",
    startStream: jest.fn(),
    stopStream: jest.fn(),
  }),
}));

jest.mock("../../components/breadcrumb-context", () => ({
  usePageTitle: () => ({
    setPageTitle: jest.fn(),
    setExtraSegments: jest.fn(),
  }),
}));

function mockCreateNewThreadResponse(thread: {
  id: string;
  app_id: string;
  title: string | null;
  status: "active" | "archived" | "deleted";
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}) {
  const initial_message = {
    id: "msg-greeting-1",
    thread_id: thread.id,
    seq: 1,
    role: "assistant" as const,
    content: "Hello there! How can I help you today?",
    content_json: {},
    created_at: thread.created_at,
  };
  return {
    data: { thread, initial_message },
  };
}

describe("ChatContainer", () => {
  it("creates a thread and shows greeting when New conversation is clicked", async () => {
    const newThread = {
      id: "thread-new-1",
      app_id: "app-1",
      title: null,
      status: "active" as const,
      customer_id: "customer-123",
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
    };
    jest
      .mocked(chatActions.createNewThread)
      .mockResolvedValueOnce(mockCreateNewThreadResponse(newThread));

    render(
      <ChatContainer appId="app-1" appName="Test App" initialThreads={[]} />,
    );

    const newConvButton = screen.getByTitle("New conversation");
    fireEvent.click(newConvButton);
    expect(
      await screen.findByText("Hello there! How can I help you today?"),
    ).toBeInTheDocument();

    expect(chatActions.createNewThread).toHaveBeenCalledWith(
      "app-1",
      expect.stringMatching(/^customer-\d+-[a-z0-9]+$/),
      "",
    );
  });

  it("adds new thread at top of list when New conversation is clicked", async () => {
    const existingThreads = [
      {
        id: "thread-1",
        app_id: "app-1",
        title: "Existing chat",
        status: "active" as const,
        customer_id: null,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      },
    ];
    const newThread = {
      id: "thread-new-1",
      app_id: "app-1",
      title: null,
      status: "active" as const,
      customer_id: "customer-123",
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
    };
    jest
      .mocked(chatActions.createNewThread)
      .mockResolvedValueOnce(mockCreateNewThreadResponse(newThread));

    render(
      <ChatContainer
        appId="app-1"
        appName="Test App"
        initialThreads={existingThreads}
      />,
    );

    const newConvButton = screen.getByTitle("New conversation");
    fireEvent.click(newConvButton);
    expect(
      await screen.findByText("Hello there! How can I help you today?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Existing chat")).toBeInTheDocument();
  });

  it("creates a new thread on each New conversation click", async () => {
    jest
      .mocked(chatActions.createNewThread)
      .mockResolvedValueOnce(
        mockCreateNewThreadResponse({
          id: "thread-1",
          app_id: "app-1",
          title: null,
          status: "active" as const,
          customer_id: null,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        }),
      )
      .mockResolvedValueOnce(
        mockCreateNewThreadResponse({
          id: "thread-2",
          app_id: "app-1",
          title: null,
          status: "active" as const,
          customer_id: null,
          created_at: "2024-01-15T10:01:00Z",
          updated_at: "2024-01-15T10:01:00Z",
        }),
      );

    render(
      <ChatContainer appId="app-1" appName="Test App" initialThreads={[]} />,
    );

    fireEvent.click(screen.getByTitle("New conversation"));
    await screen.findByText("Hello there! How can I help you today?");

    fireEvent.click(screen.getByTitle("New conversation"));
    expect(chatActions.createNewThread).toHaveBeenCalledTimes(2);
  });
});
