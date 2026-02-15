import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SubscribersList } from "@/components/subscribers-list";
import * as subscribersActions from "../../components/actions/subscribers-actions";

jest.mock("../../components/actions/subscribers-actions", () => ({
  fetchSubscribers: jest.fn(),
}));

describe("SubscribersList", () => {
  it("shows search placeholder", async () => {
    jest.mocked(subscribersActions.fetchSubscribers).mockResolvedValue({
      data: { items: [], page: 1, pages: 0, size: 50, total: 0 },
    });

    render(
      <SubscribersList
        appId="app-1"
        selectedSubscriberId={null}
        onSubscriberSelect={jest.fn()}
      />,
    );

    await screen.findByText(/no subscribers yet/i);
    expect(
      screen.getByPlaceholderText(/search subscribers/i),
    ).toBeInTheDocument();
  });

  it("shows empty state when no subscribers", async () => {
    jest.mocked(subscribersActions.fetchSubscribers).mockResolvedValue({
      data: { items: [], page: 1, pages: 0, size: 50, total: 0 },
    });

    render(
      <SubscribersList
        appId="app-1"
        selectedSubscriberId={null}
        onSubscriberSelect={jest.fn()}
      />,
    );

    await screen.findByText(/no subscribers yet/i);
    expect(
      screen.getByText(/once customers interact with your app/i),
    ).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    jest
      .mocked(subscribersActions.fetchSubscribers)
      .mockImplementation(() => new Promise(() => {}));

    render(
      <SubscribersList
        appId="app-1"
        selectedSubscriberId={null}
        onSubscriberSelect={jest.fn()}
      />,
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders subscriber list and calls onSubscriberSelect on click", async () => {
    jest.mocked(subscribersActions.fetchSubscribers).mockResolvedValue({
      data: {
        items: [
          {
            id: "sub-1",
            app_id: "app-1",
            customer_id: "customer-1",
            display_name: "Alice",
            created_at: "2024-01-15T09:00:00Z",
            thread_count: 2,
            last_message_at: "2024-01-15T10:00:00Z",
          },
        ],
        page: 1,
        pages: 1,
        size: 50,
        total: 1,
      },
    });

    const onSubscriberSelect = jest.fn();
    render(
      <SubscribersList
        appId="app-1"
        selectedSubscriberId={null}
        onSubscriberSelect={onSubscriberSelect}
      />,
    );

    await screen.findByText("Alice");
    fireEvent.click(screen.getByText("Alice"));
    expect(onSubscriberSelect).toHaveBeenCalledWith("sub-1");
  });

  it("shows error when fetch fails", async () => {
    jest.mocked(subscribersActions.fetchSubscribers).mockResolvedValue({
      error: "Failed to fetch",
    });

    render(
      <SubscribersList
        appId="app-1"
        selectedSubscriberId={null}
        onSubscriberSelect={jest.fn()}
      />,
    );

    await screen.findByText("Failed to fetch");
  });
});
