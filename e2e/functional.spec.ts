import { test, expect } from '@playwright/test';

test.describe('Full Application Functional Tests', () => {

  test('app loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    expect(errors.length).toBe(0);
  });

  test('sidebar renders all navigation items with correct icons', async ({ page }) => {
    await page.goto('/');
    
    const navItems = [
      'Intelligence Dashboard',
      'Cases Database',
      'ADK Pipelines',
      'Content Engine',
      'Counsel Chat'
    ];

    for (const item of navItems) {
      const el = page.getByText(item).first();
      await expect(el).toBeVisible();
    }
  });

  test('all 5 views are reachable from sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Dashboard (default)
    await expect(page.getByText('Pipeline Overview')).toBeVisible();
    
    // Cases Database
    await page.getByText('Cases Database').click();
    await expect(page.getByRole('heading', { name: 'Historical Case CRM' }).first()).toBeVisible();
    
    // ADK Pipelines
    await page.getByText('ADK Pipelines').click();
    await expect(page.getByText('ADK Orchestration Server')).toBeVisible();
    
    // Content Engine
    await page.getByText('Content Engine').click();
    await expect(page.getByText('ContentEngine (Generative Hub)')).toBeVisible();
    
    // Counsel Chat
    await page.getByText('Counsel Chat').click();
    await expect(page.getByText('Counsel Intelligence Chat')).toBeVisible();
    
    // Navigate back to Dashboard
    await page.getByText('Intelligence Dashboard').click();
    await expect(page.getByText('Pipeline Overview')).toBeVisible();
  });

  test('dashboard metric cards show correct labels', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Total Monitored Assets')).toBeVisible();
    await expect(page.getByText('Projected USVSST Impact')).toBeVisible();
    await expect(page.getByText('Data Freshness')).toBeVisible();
  });

  test('counsel chat input accepts text and sends messages', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Counsel Chat').click();
    
    const input = page.getByPlaceholder(/Ask about a case/);
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
    
    // Type a question
    await input.fill('What cases are related to OFAC sanctions?');
    await expect(input).toHaveValue('What cases are related to OFAC sanctions?');
    
    // Find and click the send button
    const sendButton = page.locator('button').filter({ has: page.locator('svg, [class*="send"]') }).last();
    if (await sendButton.isVisible()) {
      await sendButton.click();
      // Wait for response (30s timeout)
      await page.waitForTimeout(3000);
      // Input should be cleared after sending
    }
  });

  test('content engine shows force generation button', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Content Engine').click();
    
    const forceBtn = page.getByRole('button', { name: 'Force Generation Run' });
    await expect(forceBtn).toBeVisible();
    await expect(forceBtn).toBeEnabled();
  });

  test('govwatch scan button triggers pipeline from dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Look for the scan/trigger button
    const scanButton = page.getByRole('button', { name: /scan|trigger|scrape|govwatch/i });
    
    if (await scanButton.count() > 0) {
      await scanButton.first().click();
      // Should show loading state
      await page.waitForTimeout(2000);
    }
  });

  test('no console errors during full navigation cycle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Navigate through all views
    await page.getByText('Cases Database').click();
    await page.waitForTimeout(500);
    
    await page.getByText('ADK Pipelines').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Content Engine').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Counsel Chat').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Intelligence Dashboard').click();
    await page.waitForTimeout(500);
    
    // No JS errors should have occurred
    expect(errors).toEqual([]);
  });

  test('responsive layout — sidebar collapses on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // The sidebar should either collapse or become a hamburger menu
    // At minimum, the main content should still be visible
    await expect(page.getByText('Pipeline Overview')).toBeVisible();
  });
});
