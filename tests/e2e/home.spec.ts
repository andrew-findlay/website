import { expect, test } from '@playwright/test';

test('loads portfolio surfaces and executes saved query', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary' });

  await expect(page.getByRole('heading', { name: 'DuckDB SQL Portfolio' })).toBeVisible();

  await nav.getByRole('button', { name: 'Workspace' }).click();
  await page.getByRole('button', { name: /Run Query/i }).click();

  await expect(page.getByText(/rows in/i)).toBeVisible();

  await nav.getByRole('button', { name: 'Master CV' }).click();
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

  await nav.getByRole('button', { name: 'Insights', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Skill Matrix' })).toBeVisible();
});
