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

  test('shows metric cards', async ({ page }) => {
    await expect(page.getByText('Total Monitored Assets')).toBeVisible();
    await expect(page.getByText('Projected USVSST Impact')).toBeVisible();
    await expect(page.getByText('Data Freshness')).toBeVisible();
  });

  test('shows either empty state or pipeline chart', async ({ page }) => {
    // Depending on whether backend has scraped data, we'll see one or the other
    const emptyState = page.getByText('No Live Intelligence Data');
    const chart = page.getByText('Asset Forfeiture Pipeline');
    await expect(emptyState.or(chart)).toBeVisible();
  });
});
