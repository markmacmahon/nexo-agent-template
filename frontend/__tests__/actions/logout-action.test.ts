import { logout } from "@/components/actions/logout-action";
import { authJwtLogout } from "@/app/clientService";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

jest.mock("../../app/clientService", () => ({
  authJwtLogout: jest.fn(),
}));

jest.mock("next/headers", () => {
  const mockGet = jest.fn();
  const mockDelete = jest.fn();
  return {
    cookies: jest.fn().mockResolvedValue({ get: mockGet, delete: mockDelete }),
  };
});

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("logout action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls logout API, deletes cookie, and redirects to login", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue({
      value: "test-token",
    });

    (authJwtLogout as jest.Mock).mockResolvedValue({});

    await logout();

    expect(authJwtLogout).toHaveBeenCalledWith({
      headers: { Authorization: "Bearer test-token" },
    });
    expect(mockCookieStore.delete).toHaveBeenCalledWith("accessToken");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("returns error when no access token", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue(undefined);

    const result = await logout();

    expect(authJwtLogout).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "No access token found" });
  });

  it("returns error message on API failure", async () => {
    const mockCookieStore = await cookies();
    (mockCookieStore.get as jest.Mock).mockReturnValue({
      value: "test-token",
    });

    const mockError = "UNAUTHORIZED";
    (authJwtLogout as jest.Mock).mockResolvedValue({ error: mockError });

    const result = await logout();

    expect(result).toEqual({ message: "UNAUTHORIZED" });
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
