import { test, expect } from "@playwright/test";

test("student dashboard route is reachable", async ({ page }) => {
  await page.goto("/dashboard/student");
  await expect(page).toHaveURL(/dashboard\/student/);
});

test("dean dashboard route is reachable", async ({ page }) => {
  await page.goto("/dashboard/dean");
  await expect(page).toHaveURL(/dashboard\/dean/);
});
