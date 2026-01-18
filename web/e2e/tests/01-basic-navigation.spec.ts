import { test, expect } from '@playwright/test';

/**
 * Basic Navigation Tests
 * These tests verify that the application loads and basic navigation works
 * WITHOUT requiring wallet connection
 */

test.describe('Basic Navigation', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Battery Circular Economy/);

    // Verify main heading is visible
    await expect(page.locator('h1')).toContainText('Battery Circular Economy');

    // Verify EU Regulation badge
    await expect(page.locator('text=EU Regulation Compliant')).toBeVisible();

    // Verify key features are present
    await expect(page.locator('text=Full Traceability').first()).toBeVisible();
    await expect(page.locator('text=Carbon Footprint').first()).toBeVisible();
    await expect(page.locator('text=EU Compliant').first()).toBeVisible();
    await expect(page.locator('text=Circular Economy').first()).toBeVisible();
  });

  test('should display all stakeholder sections', async ({ page }) => {
    await page.goto('/');

    // Verify all stakeholder cards are present
    const stakeholders = [
      'Suppliers',
      'Manufacturers',
      'OEMs',
      'Fleet Operators',
      'Aftermarket Users',
      'Recyclers',
    ];

    for (const stakeholder of stakeholders) {
      await expect(page.locator(`text=${stakeholder}`)).toBeVisible();
    }
  });

  test('should show connect wallet message when accessing dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show wallet connection requirement
    await expect(page.locator('text=Connect Wallet Required')).toBeVisible();
    await expect(page.locator('text=Please connect your wallet to access the dashboard')).toBeVisible();

    // Verify "Go Back" button is present
    const goBackButton = page.locator('button:has-text("Go Back")');
    await expect(goBackButton).toBeVisible();
  });

  test('should navigate to passport page (shows not found without wallet)', async ({ page }) => {
    await page.goto('/passport/NV-2024-001234');

    // Should show battery not found (requires wallet to read contract)
    await expect(page.locator('text=Battery Not Found')).toBeVisible();
    await expect(page.locator('text=No battery found with BIN: NV-2024-001234')).toBeVisible();

    // Verify "Back to Dashboard" button is present
    const backButton = page.locator('button:has-text("Back to Dashboard")');
    await expect(backButton).toBeVisible();
  });

  test('should have working "Go Back" button from dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Click "Go Back" button
    const goBackButton = page.locator('button:has-text("Go Back")');
    await goBackButton.click();

    // Should navigate to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Battery Circular Economy');
  });

  test('should have no critical console errors on home page', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors (HMR, dev tools, network errors that are expected)
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('HMR') &&
        !error.includes('Fast Refresh') &&
        !error.includes('DevTools') &&
        !error.includes('Failed to load resource') && // External resources can fail in tests
        !error.includes('400') &&
        !error.includes('403')
    );

    // Should have no critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);
  });
});
