import { test, expect } from '@playwright/test';

test.describe('Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the sidebar with all 5 navigation items', async ({ page }) => {
    await expect(page.getByText('Intelligence Dashboard')).toBeVisible();
    await expect(page.getByText('Cases Database')).toBeVisible();
    await expect(page.getByText('ADK Pipelines')).toBeVisible();
    await expect(page.getByText('Content Engine')).toBeVisible();
    await expect(page.getByText('Counsel Chat')).toBeVisible();
  });

  test('displays the correct header title', async ({ page }) => {
    await expect(page.getByText('Pipeline Overview')).toBeVisible();
  });

  test('shows all 3 metric cards with values', async ({ page }) => {
    await expect(page.getByText('Total Monitored Assets')).toBeVisible();
    await expect(page.getByText('Projected USVSST Impact')).toBeVisible();
    await expect(page.getByText('Data Freshness')).toBeVisible();
    // Verify computed metric values are present (not empty)
    await expect(page.getByText(/\$[\d.]+B/)).toHaveCount(2);
  });

  test('renders the Asset Forfeiture Pipeline chart', async ({ page }) => {
    await expect(page.getByText('Asset Forfeiture Pipeline')).toBeVisible();
    await expect(page.getByText('Click any bar to see individual cases')).toBeVisible();
  });

  test('renders the Active Verified Cases table with mock data', async ({ page }) => {
    await expect(page.getByText('Active Verified Cases')).toBeVisible();
    await expect(page.getByText('US v. North Korean Crypto Assets')).toBeVisible();
    await expect(page.getByText('US v. Iranian Oil Tanker Fnd.')).toBeVisible();
    await expect(page.getByText('$42.5M')).toBeVisible();
  });

  test('Force Live Web Scrape button is visible and enabled', async ({ page }) => {
    const button = page.getByText('Force Live Web Scrape (ADK)');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});
