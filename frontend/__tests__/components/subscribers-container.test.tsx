import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SubscribersContainer } from "@/components/subscribers-container";

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("../../components/breadcrumb-context", () => ({
  usePageTitle: () => ({
    setPageTitle: jest.fn(),
    setExtraSegments: jest.fn(),
  }),
}));

jest.mock("../../components/actions/subscribers-actions", () => ({
  fetchSubscribers: jest.fn().mockResolvedValue({
    data: { items: [], page: 1, pages: 0, size: 50, total: 0 },
  }),
  fetchSubscriberThreads: jest.fn().mockResolvedValue({
    data: { items: [], page: 1, pages: 0, size: 50, total: 0 },
  }),
}));

jest.mock("../../components/thread-chat", () => ({
  ThreadChat: ({ threadId }: { threadId: string }) => (
    <div data-testid="thread-chat">Chat {threadId}</div>
  ),
}));

describe("SubscribersContainer", () => {
  it("renders three panels with correct testids", async () => {
    render(<SubscribersContainer appId="app-1" appName="Test App" />);
    await screen.findByText(/no subscribers yet/i);

    expect(screen.getByTestId("subscribers-container")).toBeInTheDocument();
    expect(screen.getByTestId("subscribers-panel")).toBeInTheDocument();
    expect(screen.getByTestId("subscribers-threads-panel")).toBeInTheDocument();
    expect(screen.getByTestId("subscribers-chat-panel")).toBeInTheDocument();
  });

  it("shows Subscribers and Threads headings", async () => {
    render(<SubscribersContainer appId="app-1" />);
    await screen.findByText(/no subscribers yet/i);

    expect(screen.getByText("Subscribers")).toBeInTheDocument();
    expect(screen.getByText("Threads")).toBeInTheDocument();
  });

  it("shows select-subscriber and select-thread placeholder when nothing selected", async () => {
    render(<SubscribersContainer appId="app-1" />);
    await screen.findByText(/no subscribers yet/i);

    expect(
      screen.getByText(/select a subscriber to view their threads/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/select a thread to view the conversation/i),
    ).toBeInTheDocument();
  });

  it("updates URL when selection changes", async () => {
    render(<SubscribersContainer appId="app-1" />);
    await screen.findByText(/no subscribers yet/i);

    expect(mockReplace).toHaveBeenCalledWith(
      "/dashboard/apps/app-1/subscribers",
      { scroll: false },
    );
  });
});
