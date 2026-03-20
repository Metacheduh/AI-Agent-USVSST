import { test, expect } from '@playwright/test';

test.describe('Navigation & View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('switches to Cases Database view', async ({ page }) => {
    await page.getByText('Cases Database').click();
    await expect(page.getByText('Historical Case CRM')).toBeVisible();
    await expect(page.getByText('Docket / Name')).toBeVisible();
  });

  test('switches to ADK Pipelines view', async ({ page }) => {
    await page.getByText('ADK Pipelines').click();
    await expect(page.getByText('ADK Orchestration Server')).toBeVisible();
  });

  test('switches to Content Engine view', async ({ page }) => {
    await page.getByText('Content Engine').click();
    await expect(page.getByText('ContentEngine (Generative Hub)')).toBeVisible();
  });

  test('switches to Counsel Chat view', async ({ page }) => {
    await page.getByText('Counsel Chat').click();
    await expect(page.getByText('Counsel Intelligence Chat')).toBeVisible();
    await expect(page.getByText(/Welcome, Counsel/)).toBeVisible();
  });

  test('navigates back to Dashboard from another view', async ({ page }) => {
    await page.getByText('Counsel Chat').click();
    await expect(page.getByText('Counsel Intelligence Chat')).toBeVisible();
    await page.getByText('Intelligence Dashboard').click();
    await expect(page.getByText('Pipeline Overview')).toBeVisible();
  });
});
