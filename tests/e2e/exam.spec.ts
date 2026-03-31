import { test, expect } from "@playwright/test";

test("exam instructions route pattern is reachable", async ({ page }) => {
  await page.goto("/exam/1/instructions");
  await expect(page.url()).toContain("/exam/1");
});
