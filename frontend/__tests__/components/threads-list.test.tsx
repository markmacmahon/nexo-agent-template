import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThreadsList } from "@/components/threads-list";
import * as subscribersActions from "../../components/actions/subscribers-actions";

jest.mock("../../components/actions/subscribers-actions", () => ({
  fetchSubscriberThreads: jest.fn(),
}));

describe("ThreadsList", () => {
  it("shows empty state when no threads", async () => {
    jest.mocked(subscribersActions.fetchSubscriberThreads).mockResolvedValue({
      data: { items: [], page: 1, pages: 0, size: 50, total: 0 },
    });

    render(
      <ThreadsList
        appId="app-1"
        subscriberId="sub-1"
        selectedThreadId={null}
        onThreadSelect={jest.fn()}
      />,
    );

    await screen.findByText(/no threads yet for this subscriber/i);
  });

  it("shows loading state initially", () => {
    jest
      .mocked(subscribersActions.fetchSubscriberThreads)
      .mockImplementation(() => new Promise(() => {}));

    render(
      <ThreadsList
        appId="app-1"
        subscriberId="sub-1"
        selectedThreadId={null}
        onThreadSelect={jest.fn()}
      />,
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders thread list and calls onThreadSelect on click", async () => {
    jest.mocked(subscribersActions.fetchSubscriberThreads).mockResolvedValue({
      data: {
        items: [
          {
            id: "thread-1",
            app_id: "app-1",
            status: "active" as const,
            created_at: "2024-01-15T09:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
            title: "Support request",
            message_count: 3,
            last_message_preview: "Hello",
          },
        ],
        page: 1,
        pages: 1,
        size: 50,
        total: 1,
      },
    });

    const onThreadSelect = jest.fn();
    render(
      <ThreadsList
        appId="app-1"
        subscriberId="sub-1"
        selectedThreadId={null}
        onThreadSelect={onThreadSelect}
      />,
    );

    await screen.findByText("Support request");
    fireEvent.click(screen.getByText("Support request"));
    expect(onThreadSelect).toHaveBeenCalledWith("thread-1");
  });

  it("shows error when fetch fails", async () => {
    jest.mocked(subscribersActions.fetchSubscriberThreads).mockResolvedValue({
      error: "Failed to fetch threads",
    });

    render(
      <ThreadsList
        appId="app-1"
        subscriberId="sub-1"
        selectedThreadId={null}
        onThreadSelect={jest.fn()}
      />,
    );

    await screen.findByText("Failed to fetch threads");
  });
});
