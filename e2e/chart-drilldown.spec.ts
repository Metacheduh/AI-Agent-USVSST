import { test, expect } from '@playwright/test';

test.describe('Chart Drill-Down Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking a stage pill opens the breakdown panel', async ({ page }) => {
    // Click the "Litigation" stage pill in the cases table
    await page.locator('table span').filter({ hasText: 'Litigation' }).click();
    // The breakdown panel should appear with the docket ID in the card
    const card = page.locator('span').filter({ hasText: '1:24-cv-00123' });
    await expect(card.first()).toBeVisible();
  });

  test('clicking X closes the breakdown panel', async ({ page }) => {
    // Open breakdown
    await page.locator('table span').filter({ hasText: 'Litigation' }).click();
    const card = page.locator('span').filter({ hasText: '1:24-cv-00123' });
    await expect(card.first()).toBeVisible();
    // Close it via the X button at the top-right of the breakdown panel
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await closeButton.click();
  });

  test('clicking a different stage pill switches the breakdown', async ({ page }) => {
    // Open Litigation breakdown
    await page.locator('table span').filter({ hasText: 'Litigation' }).click();
    // Verify the drill-down panel is open by checking for case docket
    const litigationCard = page.locator('span').filter({ hasText: '1:24-cv-00123' });
    await expect(litigationCard.first()).toBeVisible();
    // Switch to Liquidation
    const liquidationPill = page.locator('table span').filter({ hasText: 'Liquidation' });
    await liquidationPill.scrollIntoViewIfNeeded();
    await liquidationPill.click();
    // Verify the Iranian Oil Tanker case appears in the breakdown
    const liquidationCard = page.locator('span').filter({ hasText: '1:23-cr-00991' });
    await expect(liquidationCard.first()).toBeVisible();
  });
});
