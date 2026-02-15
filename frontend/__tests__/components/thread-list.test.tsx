import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThreadList } from "@/components/thread-list";

describe("ThreadList", () => {
  const mockThreads = [
    {
      id: "thread-1",
      app_id: "app-1",
      title: "Customer Support #1",
      status: "active" as const,
      customer_id: "customer-123",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    {
      id: "thread-2",
      app_id: "app-1",
      title: "Sales Inquiry #2",
      status: "active" as const,
      customer_id: "customer-456",
      created_at: "2024-01-14T09:00:00Z",
      updated_at: "2024-01-14T09:15:00Z",
    },
  ];

  it("renders thread list with titles", () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThreadId={null}
        onThreadSelect={jest.fn()}
      />,
    );

    expect(screen.getByText("Customer Support #1")).toBeInTheDocument();
    expect(screen.getByText("Sales Inquiry #2")).toBeInTheDocument();
  });

  it("highlights the selected thread", () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThreadId="thread-1"
        onThreadSelect={jest.fn()}
      />,
    );

    // The button element itself has the bg-accent class
    const selectedButton = screen
      .getByText("Customer Support #1")
      .closest("button");
    expect(selectedButton).toHaveClass("bg-accent");
  });

  it("calls onThreadSelect when a thread is clicked", () => {
    const onThreadSelect = jest.fn();

    render(
      <ThreadList
        threads={mockThreads}
        selectedThreadId={null}
        onThreadSelect={onThreadSelect}
      />,
    );

    fireEvent.click(screen.getByText("Sales Inquiry #2"));
    expect(onThreadSelect).toHaveBeenCalledWith("thread-2");
  });

  it("renders empty state when no threads", () => {
    render(
      <ThreadList
        threads={[]}
        selectedThreadId={null}
        onThreadSelect={jest.fn()}
      />,
    );

    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });
});
