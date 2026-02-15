import { test, expect } from "@playwright/test";

/**
 * E2E: Subscribers page (3-panel inbox-style layout).
 * Prerequisites: Docker DB, test user tester1@example.com / Password#99 with at least one app.
 */

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth/login", { waitUntil: "networkidle" });
  await page.waitForSelector("form", { state: "attached" });
  await page.locator('input[name="username"]').fill("tester1@example.com");
  await page.locator('input[name="password"]').fill("Password#99");
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form) form.requestSubmit();
  });
  await page.waitForURL("/dashboard", { timeout: 10000 });
}

async function getFirstAppId(
  page: import("@playwright/test").Page,
): Promise<string> {
  await page.goto("/dashboard/apps");
  await page.waitForSelector("table", { timeout: 10000 });
  const firstRow = page.locator("table tbody tr").first();
  const dropdown = firstRow
    .locator('button, [role="button"]')
    .filter({ hasText: "..." });
  await dropdown.click();
  await page.waitForSelector('[role="menu"]', {
    state: "visible",
    timeout: 5000,
  });
  const editLink = page.locator('a[href*="/edit"]').first();
  const href = await editLink.getAttribute("href");
  expect(href).toBeTruthy();
  const match = href!.match(/\/apps\/([^/]+)\/edit/);
  expect(match).toBeTruthy();
  return match![1];
}

test.describe("Subscribers Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("subscribers page: navigate from edit app shows 3 panels and empty state", async ({
    page,
  }) => {
    await login(page);
    const appId = await getFirstAppId(page);

    await page.goto(`/dashboard/apps/${appId}/edit`);
    await page.waitForSelector("form", { timeout: 10000 });
    await page.getByTestId("edit-app-subscribers-link").click();
    await page.waitForURL(`/dashboard/apps/${appId}/subscribers`);

    await expect(page.getByTestId("subscribers-container")).toBeVisible();
    await expect(page.getByTestId("subscribers-panel")).toBeVisible();
    await expect(page.getByTestId("subscribers-threads-panel")).toBeVisible();
    await expect(page.getByTestId("subscribers-chat-panel")).toBeVisible();
    await expect(page.getByTestId("subscribers-panel-title")).toBeVisible();
    await expect(
      page.getByTestId("subscribers-threads-panel-title"),
    ).toBeVisible();
    await expect(
      page.getByTestId("subscribers-select-subscriber-msg"),
    ).toBeVisible();
    await expect(
      page.getByTestId("subscribers-select-thread-msg"),
    ).toBeVisible();
  });

  test("subscribers page: direct URL shows same layout", async ({ page }) => {
    await login(page);
    const appId = await getFirstAppId(page);

    await page.goto(`/dashboard/apps/${appId}/subscribers`);
    await expect(page.getByTestId("subscribers-container")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("subscribers-panel")).toBeVisible();
    await expect(page.getByTestId("subscribers-threads-panel")).toBeVisible();
    await expect(page.getByTestId("subscribers-chat-panel")).toBeVisible();
    await expect(page.getByTestId("subscribers-search")).toBeVisible();
  });
});
