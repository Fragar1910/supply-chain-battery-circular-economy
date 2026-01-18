import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Battery Circular Economy E2E Tests
 *
 * Features:
 * - Chrome only (user requirement)
 * - Sequential execution (blockchain requires deterministic order)
 * - Extended timeouts for blockchain transactions
 * - Screenshots and videos on failure
 */
export default defineConfig({
  testDir: './e2e',

  // Sequential execution to avoid race conditions in blockchain
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for blockchain determinism

  // Extended timeout for blockchain transactions
  timeout: 120000, // 2 minutes per test

  // Reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-results.json' }]
  ],

  // Global test settings
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000, // 30s for actions
    navigationTimeout: 30000, // 30s for navigation
  },

  // Projects - Chrome only as requested
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Extended permissions for MetaMask
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
  ],

  // No webServer - we manage it manually to coordinate with Anvil
  // Frontend should be started before running tests
});
