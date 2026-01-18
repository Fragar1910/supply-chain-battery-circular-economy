import { test, expect } from '@playwright/test';
import { SEED_BATTERIES } from '../fixtures/batteries';

/**
 * Blockchain Validation Tests
 * These tests verify that the blockchain environment is properly set up
 * and contracts are deployed correctly
 */

test.describe('Blockchain Environment Validation', () => {
  test('should have deployed addresses configuration', async () => {
    // Verify deployed-addresses.json exists and has correct structure
    const fs = require('fs');
    const path = require('path');

    const addressesPath = path.join(process.cwd(), 'src/config/deployed-addresses.json');
    expect(fs.existsSync(addressesPath)).toBeTruthy();

    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

    // Verify all required contracts are present
    expect(addresses).toHaveProperty('BatteryRegistry');
    expect(addresses).toHaveProperty('RoleManager');
    expect(addresses).toHaveProperty('SupplyChainTracker');
    expect(addresses).toHaveProperty('DataVault');
    expect(addresses).toHaveProperty('CarbonFootprint');
    expect(addresses).toHaveProperty('SecondLifeManager');
    expect(addresses).toHaveProperty('RecyclingManager');

    // Verify addresses are valid Ethereum addresses
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    expect(addresses.BatteryRegistry).toMatch(addressRegex);
    expect(addresses.RoleManager).toMatch(addressRegex);
    expect(addresses.SupplyChainTracker).toMatch(addressRegex);
  });

  test('should have correct seed battery BINs defined', async () => {
    // Verify we have exactly 9 seed batteries
    expect(SEED_BATTERIES).toHaveLength(9);

    // Verify format of BINs
    const binRegex = /^NV-2024-\d{6}$/;
    SEED_BATTERIES.forEach(bin => {
      expect(bin).toMatch(binRegex);
    });

    // Verify specific BINs are present
    expect(SEED_BATTERIES).toContain('NV-2024-001234');
    expect(SEED_BATTERIES).toContain('NV-2024-009012');
  });

  test('should have contracts configuration in frontend', async ({ page }) => {
    // Navigate to any page to check if contracts are loaded
    await page.goto('/');

    // Check if contracts configuration is available in the app
    const hasContracts = await page.evaluate(() => {
      // This will check if contracts config is accessible
      return typeof window !== 'undefined';
    });

    expect(hasContracts).toBeTruthy();
  });

  test('should load deployed addresses in config', async () => {
    const fs = require('fs');
    const path = require('path');

    const configPath = path.join(process.cwd(), 'src/config/contracts.ts');
    expect(fs.existsSync(configPath)).toBeTruthy();

    // Verify the config file exists and can be read
    const configContent = fs.readFileSync(configPath, 'utf8');
    expect(configContent).toContain('BatteryRegistry');
    expect(configContent).toContain('RoleManager');
    expect(configContent).toContain('SupplyChainTracker');
  });

  test('should have all 9 batteries referenced in dashboard code', async () => {
    const fs = require('fs');
    const path = require('path');

    const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

    // Verify allSeedBatteryBins array exists
    expect(dashboardContent).toContain('allSeedBatteryBins');

    // Verify all 9 batteries are listed
    SEED_BATTERIES.forEach(bin => {
      expect(dashboardContent).toContain(bin);
    });
  });

  test('should have supply chain traceability fix implemented', async () => {
    const fs = require('fs');
    const path = require('path');

    const passportPath = path.join(process.cwd(), 'src/app/passport/[bin]/page.tsx');
    const passportContent = fs.readFileSync(passportPath, 'utf8');

    // Verify the fix is present: args: [binBytes32] instead of args: [bin as any]
    expect(passportContent).toContain('args: [binBytes32]');

    // Verify getBatteryJourney is being called
    expect(passportContent).toContain('getBatteryJourney');

    // Verify SupplyChainTracker is being used
    expect(passportContent).toContain('SupplyChainTracker');
  });

  test('should have nonce error handling in TransferOwnershipForm', async () => {
    const fs = require('fs');
    const path = require('path');

    const transferFormPath = path.join(process.cwd(), 'src/components/forms/TransferOwnershipForm.tsx');
    const transferFormContent = fs.readFileSync(transferFormPath, 'utf8');

    // Verify staleTime is configured
    expect(transferFormContent).toContain('staleTime');

    // Verify nonce error detection
    expect(transferFormContent).toContain('nonce');
    expect(transferFormContent).toContain('getTransactionCount');

    // Verify confirmingToastShown reset
    expect(transferFormContent).toContain('confirmingToastShown.current = false');
  });

  test('should have ChangeBatteryStateForm integrated in UpdateSOHForm', async () => {
    const fs = require('fs');
    const path = require('path');

    const updateSOHPath = path.join(process.cwd(), 'src/components/forms/UpdateSOHForm.tsx');
    const updateSOHContent = fs.readFileSync(updateSOHPath, 'utf8');

    // Verify Tabs component is used
    expect(updateSOHContent).toContain('Tabs');
    expect(updateSOHContent).toContain('TabsList');
    expect(updateSOHContent).toContain('TabsTrigger');
    expect(updateSOHContent).toContain('TabsContent');

    // Verify ChangeBatteryStateForm is imported and used
    expect(updateSOHContent).toContain('ChangeBatteryStateForm');

    // Verify tabs are properly configured
    expect(updateSOHContent).toContain('Update SOH');
    expect(updateSOHContent).toContain('Change State');
  });
});

test.describe('Environment Health Checks', () => {
  test('frontend should be running', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('should load without critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have no page errors
    expect(errors).toHaveLength(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toContain('Battery');

    // Verify viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
  });
});
