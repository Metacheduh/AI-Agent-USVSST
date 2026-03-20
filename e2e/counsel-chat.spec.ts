import { test, expect } from '@playwright/test';

test.describe('Counsel Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Counsel Chat').click();
    await expect(page.getByText('Counsel Intelligence Chat')).toBeVisible();
  });

  test('displays welcome message with capabilities list', async ({ page }) => {
    await expect(page.getByText(/Welcome, Counsel/)).toBeVisible();
    await expect(page.getByText(/Querying the status/)).toBeVisible();
    await expect(page.getByText(/Drafting intelligent questions/)).toBeVisible();
  });

  test('has an input field and send button', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask about a case/);
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
  });

  test('can type a message in the input', async ({ page }) => {
    const input = page.getByPlaceholder(/Ask about a case/);
    await input.fill('What is the status of the North Korean crypto case?');
    await expect(input).toHaveValue('What is the status of the North Korean crypto case?');
  });
});
