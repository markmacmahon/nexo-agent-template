import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import "@testing-library/jest-dom";

import AppViewPage from "@/app/dashboard/apps/[id]/page";
import { fetchAppById } from "@/components/actions/apps-action";

jest.mock("../../components/actions/apps-action", () => ({
  fetchAppById: jest.fn().mockResolvedValue({
    data: {
      id: "app-123",
      name: "Test App",
      description: "Test Description",
      webhook_url: null,
      webhook_secret: null,
      config_json: {},
    },
  }),
}));

const mockFetchAppById = fetchAppById as jest.Mock;

describe("App View Page", () => {
  const defaultParams = Promise.resolve({ id: "app-123" });

  it("renders app name and description", async () => {
    const page = await AppViewPage({ params: defaultParams });
    render(page);

    expect(screen.getByText("Test App")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders Chat, Subscribers, and Edit actions", async () => {
    const page = await AppViewPage({ params: defaultParams });
    render(page);

    expect(screen.getByRole("link", { name: /chat/i })).toHaveAttribute(
      "href",
      "/dashboard/apps/app-123/chat",
    );
    expect(screen.getByRole("link", { name: /subscribers/i })).toHaveAttribute(
      "href",
      "/dashboard/apps/app-123/subscribers",
    );
    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/dashboard/apps/app-123/edit",
    );
  });

  it("shows fallback message with back link on error", async () => {
    mockFetchAppById.mockResolvedValueOnce({ error: "NOT_FOUND" });

    const page = await AppViewPage({ params: defaultParams });
    render(page);

    expect(screen.getByText("Could not load app.")).toBeInTheDocument();
    expect(screen.getByText("Back to apps")).toBeInTheDocument();
  });
});
