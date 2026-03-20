import { test, expect } from '@playwright/test';

test.describe('Dashboard View (Empty State)', () => {
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

  test('shows metric cards with zero values when no data', async ({ page }) => {
    await expect(page.getByText('Total Monitored Assets')).toBeVisible();
    await expect(page.getByText('Projected USVSST Impact')).toBeVisible();
    await expect(page.getByText('Data Freshness')).toBeVisible();
    await expect(page.getByText('0 Active Cases')).toBeVisible();
  });

  test('shows empty state prompt when no live data', async ({ page }) => {
    await expect(page.getByText('No Live Intelligence Data')).toBeVisible();
    await expect(page.getByText('Run Live Web Scrape (ADK)')).toBeVisible();
  });
});
