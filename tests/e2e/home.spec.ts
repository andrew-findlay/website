import { expect, test } from '@playwright/test';

test('navigates dashboard, data explorer, and export tabs', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('CareerOS v2.4')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Experience Log/i })).toBeVisible();

  await page.getByRole('button', { name: 'Data Explorer' }).click();
  await expect(page.getByRole('button', { name: /stg__profile_overview\.sql/i })).toBeVisible();

  await page.getByRole('button', { name: /stg__profile_overview\.sql/i }).click();
  await expect(page.getByText(/connected: duckdb_wasm/i)).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: /Run Query/i })).toBeEnabled({ timeout: 30000 });
  await page.getByRole('button', { name: /Run Query/i }).click();

  await expect(page.getByText(/rows in/i)).toBeVisible();

  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('heading', { name: /Regular PDF CV/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Download PDF/i })).toBeVisible();
});
