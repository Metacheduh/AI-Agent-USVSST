import { test, expect } from '@playwright/test';

test.describe('Content Engine (Empty State)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Content Engine').click();
    await expect(page.getByText('ContentEngine (Generative Hub)')).toBeVisible();
  });

  test('shows empty state when no content generated', async ({ page }) => {
    await expect(page.getByText('No Content Generated Yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Force Generation Run' })).toBeVisible();
  });

  test('Force Generation button is visible and enabled', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Force Generation Run' });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});
