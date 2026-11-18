import { expect, test } from "@playwright/test";

test("category rename, merge and deletion preserve the recorded transaction", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Categories", exact: true })).toBeVisible({ timeout: 1500 });
  await page.getByRole("button", { name: "Categories", exact: true }).click();
  await page.getByLabel("New category", { exact: true }).fill("Food");
  await page.getByRole("button", { name: "Create category", exact: true }).click();
  await page.getByLabel("New category", { exact: true }).fill("Home");
  await page.getByRole("button", { name: "Create category", exact: true }).click();
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await page.getByLabel("Payee", { exact: true }).fill("Grocer");
  await page.getByLabel("Amount", { exact: true }).fill("-12.34");
  await page.getByLabel("Category (optional)").fill("Food");
  await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  await page.getByRole("button", { name: "Categories", exact: true }).click();
  await page.getByLabel("Rename Food to", { exact: true }).fill("Groceries");
  await page.getByRole("button", { name: "Rename Food", exact: true }).click();
  await page.getByLabel("Merge Groceries into", { exact: true }).selectOption("Home");
  await page.getByRole("button", { name: "Merge Groceries", exact: true }).click();
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Grocer" })).toContainText("Home");
  await page.getByRole("button", { name: "Categories", exact: true }).click();
  await page.getByRole("button", { name: "Delete category Home", exact: true }).click();
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Grocer" })).toContainText("Uncategorised");
});

test("creates a payee rule and explicitly applies it to an uncategorised transaction", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Categories", exact: true })).toBeVisible({ timeout: 1500 });
  await page.getByLabel("Payee", { exact: true }).fill("Mega GROCER");
  await page.getByLabel("Amount", { exact: true }).fill("-0.01");
  await page.getByRole("button", { name: "Save transaction", exact: true }).click();
  await page.getByRole("button", { name: "Categories", exact: true }).click();
  await page.getByLabel("New category", { exact: true }).fill("Food");
  await page.getByRole("button", { name: "Create category", exact: true }).click();
  await page.getByLabel("Payee contains", { exact: true }).fill("grocer");
  await page.getByLabel("Rule category", { exact: true }).selectOption("Food");
  await page.getByRole("button", { name: "Save rule", exact: true }).click();
  await page.getByRole("button", { name: "Apply rules to uncategorised", exact: true }).click();
  await page.screenshot({ path: "artifacts/ui/categories.png", fullPage: true });
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Mega GROCER" })).toContainText("Food");
});
