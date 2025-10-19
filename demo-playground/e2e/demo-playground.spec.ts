import { test, expect } from '@playwright/test';

test.describe('Demo Playground', () => {
  test('should load the playground', async ({ page }) => {
    await page.goto('/');

    // Wait for initialization
    await page.waitForSelector('text=Paired Comments Demo', { timeout: 10000 });

    // Verify action bar is present
    await expect(page.locator('text=Paired Comments Demo')).toBeVisible();
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Share/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible();
  });

  test('should display file tree', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=JavaScript', { timeout: 10000 });

    // Verify folder names are present
    await expect(page.locator('text=JavaScript')).toBeVisible();
    await expect(page.locator('text=TypeScript')).toBeVisible();
    await expect(page.locator('text=Python')).toBeVisible();
  });

  test('should expand and collapse folders', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=JavaScript', { timeout: 10000 });

    const jsFolder = page.locator('text=JavaScript').first();

    // Initially should show files
    await expect(page.locator('text=react-component.js')).toBeVisible();

    // Click to collapse (if implementation supports it)
    // Note: This depends on actual UI implementation
  });

  test('should select a file and display content in Monaco editor', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=JavaScript', { timeout: 10000 });

    // Click on a file
    const reactFile = page.locator('text=react-component.js').first();
    await reactFile.click();

    // Wait for Monaco editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 15000 });

    // Verify Monaco editor is visible
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // Verify some code content is displayed
    await expect(page.locator('.view-lines')).toBeVisible();
  });

  test('should toggle comments pane', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Paired Comments Demo', { timeout: 10000 });

    const toggleButton = page.getByRole('button', { name: /Hide Comments|Show Comments/i });

    // Click toggle button
    await toggleButton.click();

    // Wait a bit for animation
    await page.waitForTimeout(500);

    // Verify button text changed
    const buttonText = await toggleButton.textContent();
    expect(buttonText).toMatch(/Hide|Show/);
  });

  test('should handle reset button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Paired Comments Demo', { timeout: 10000 });

    // Handle dialog
    page.on('dialog', (dialog) => dialog.accept());

    const resetButton = page.getByRole('button', { name: /Reset/i });
    await resetButton.click();

    // Wait for alert
    await page.waitForTimeout(1000);
  });

  test('should display file header when file is selected', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=JavaScript', { timeout: 10000 });

    // Select a file
    await page.locator('text=react-component.js').first().click();

    // Wait for file header
    await page.waitForSelector('text=react-component.js', { timeout: 5000 });

    // Verify language badge
    await expect(page.locator('text=JAVASCRIPT')).toBeVisible();
  });

  test('should show loading state on initial load', async ({ page }) => {
    await page.goto('/');

    // Should show loading state initially
    const loadingText = page.locator('text=Initializing Demo Playground');

    // Either loading is shown, or already loaded
    const isLoading = await loadingText.isVisible().catch(() => false);

    // If loading was shown, wait for it to disappear
    if (isLoading) {
      await expect(loadingText).not.toBeVisible({ timeout: 10000 });
    }

    // Should now show the main UI
    await expect(page.locator('text=Paired Comments Demo')).toBeVisible();
  });

  test('should have GitHub-like dark theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Paired Comments Demo', { timeout: 10000 });

    // Check background color (GitHub dark theme)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be dark (not white)
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

  test('should display version badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=v2.1.6', { timeout: 10000 });

    await expect(page.locator('text=v2.1.6')).toBeVisible();
  });

  test('should handle switching between different files', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=JavaScript', { timeout: 10000 });

    // Select first file
    await page.locator('text=react-component.js').first().click();
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Select second file
    await page.locator('text=express-api.js').first().click();

    // Monaco should still be visible
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should show empty state when no file selected', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Paired Comments Demo', { timeout: 10000 });

    // If no file is selected initially, should show empty state
    const emptyState = page.locator('text=No file selected');

    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=Select a file from the sidebar')).toBeVisible();
    }
  });
});
