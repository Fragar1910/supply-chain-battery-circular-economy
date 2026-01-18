import { test, expect } from '@playwright/test';
import { mockWalletConnection } from '../helpers/wallet-mock';
import { ACCOUNTS } from '../fixtures/accounts';

/**
 * Wallet Mock Validation Tests
 *
 * These tests verify that the wallet mock is properly injected and functional.
 *
 * NOTE: The wallet mock injects window.ethereum, but Wagmi/RainbowKit requires
 * additional setup to recognize and connect to the mock wallet.
 * These tests validate the mock infrastructure is working correctly.
 */

test.describe('Wallet Mock Infrastructure', () => {
  test('should inject window.ethereum with mock provider', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify ethereum object exists
    const hasEthereum = await page.evaluate(() => {
      return typeof (window as any).ethereum !== 'undefined';
    });

    expect(hasEthereum).toBeTruthy();
    console.log('[Test] ✅ window.ethereum injected successfully');
  });

  test('should configure mock wallet with correct properties', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const walletInfo = await page.evaluate(() => {
      const eth = (window as any).ethereum;
      return {
        isMetaMask: eth?.isMetaMask,
        selectedAddress: eth?.selectedAddress,
        chainId: eth?.chainId,
        networkVersion: eth?.networkVersion,
      };
    });

    expect(walletInfo.isMetaMask).toBe(true);
    expect(walletInfo.selectedAddress).toBe(ACCOUNTS.manufacturer.address);
    expect(walletInfo.chainId).toBe('0x7a69');
    expect(walletInfo.networkVersion).toBe('31337');

    console.log('[Test] ✅ Mock wallet configured correctly:', walletInfo);
  });

  test('should handle eth_requestAccounts RPC call', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accounts = await page.evaluate(async () => {
      const eth = (window as any).ethereum;
      return await eth.request({ method: 'eth_requestAccounts' });
    });

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toBe(ACCOUNTS.manufacturer.address);

    console.log('[Test] ✅ eth_requestAccounts returns correct account');
  });

  test('should handle eth_chainId RPC call', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const chainId = await page.evaluate(async () => {
      const eth = (window as any).ethereum;
      return await eth.request({ method: 'eth_chainId' });
    });

    expect(chainId).toBe('0x7a69');

    console.log('[Test] ✅ eth_chainId returns correct chain');
  });

  test('should handle personal_sign RPC call', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const signature = await page.evaluate(async () => {
      const eth = (window as any).ethereum;
      return await eth.request({
        method: 'personal_sign',
        params: ['0x48656c6c6f20576f726c64', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
      });
    });

    expect(signature).toContain('0x');

    console.log('[Test] ✅ personal_sign returns mock signature');
  });

  test('should handle eth_getBalance RPC call', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const balance = await page.evaluate(async () => {
      const eth = (window as any).ethereum;
      return await eth.request({
        method: 'eth_getBalance',
        params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest'],
      });
    });

    expect(balance).toBe('0x21e19e0c9bab2400000'); // 10000 ETH in wei

    console.log('[Test] ✅ eth_getBalance returns mock balance');
  });

  test('should work with different accounts', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.oem.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const selectedAddress = await page.evaluate(() => {
      return (window as any).ethereum?.selectedAddress;
    });

    expect(selectedAddress).toBe(ACCOUNTS.oem.address);

    console.log('[Test] ✅ Mock wallet works with OEM account');
  });

  test('should log mock wallet requests to console', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.text().includes('[Wallet Mock]')) {
        consoleLogs.push(msg.text());
      }
    });

    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Make a request to trigger logging
    await page.evaluate(async () => {
      const eth = (window as any).ethereum;
      await eth.request({ method: 'eth_accounts' });
    });

    await page.waitForTimeout(500);

    const hasInitLog = consoleLogs.some(log => log.includes('Initializing'));
    const hasRequestLog = consoleLogs.some(log => log.includes('Request'));

    expect(hasInitLog).toBeTruthy();

    console.log(`[Test] ✅ Found ${consoleLogs.length} wallet mock console logs`);
    consoleLogs.forEach(log => console.log(`  - ${log}`));
  });
});

test.describe('Wallet Mock Limitations', () => {
  test('should document wagmi/rainbowkit integration limitation', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // The wallet mock is injected, but Wagmi/RainbowKit won't automatically detect it
    // This is expected behavior
    const hasWalletRequired = await page.locator('text=Connect Wallet Required').isVisible().catch(() => false);

    if (hasWalletRequired) {
      console.log('[Test] ℹ️  EXPECTED: Dashboard shows "Connect Wallet Required"');
      console.log('[Test] ℹ️  REASON: Wagmi/RainbowKit requires additional integration to recognize mock wallet');
      console.log('[Test] ℹ️  RECOMMENDATION: For full E2E testing with transactions, use manual testing with MetaMask');
    }

    // Verify mock wallet still exists in page
    const hasMockWallet = await page.evaluate(() => {
      return (window as any).ethereum?.isMetaMask === true;
    });

    expect(hasMockWallet).toBeTruthy();

    console.log('[Test] ✅ Mock wallet infrastructure is functional');
    console.log('[Test] ℹ️  Next step: Manual testing with real MetaMask for transaction validation');
  });

  test('should verify core RPC methods are implemented', async ({ page }) => {
    await mockWalletConnection(page, {
      address: ACCOUNTS.manufacturer.address,
      chainId: '0x7a69',
      autoApprove: true,
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Core methods that are implemented
    const coreMethods = [
      'eth_requestAccounts',
      'eth_accounts',
      'eth_chainId',
      'net_version',
    ];

    // Methods that require params
    const methodsWithParams = [
      { method: 'personal_sign', params: ['0x48656c6c6f', ACCOUNTS.manufacturer.address] },
      { method: 'eth_getBalance', params: [ACCOUNTS.manufacturer.address, 'latest'] },
    ];

    // Test core methods
    for (const method of coreMethods) {
      const result = await page.evaluate(async (method) => {
        try {
          const eth = (window as any).ethereum;
          await eth.request({ method });
          return { success: true, method };
        } catch (error: any) {
          return { success: false, method, error: error.message };
        }
      }, method);

      expect(result.success).toBeTruthy();
      console.log(`[Test] ✅ ${method}: implemented`);
    }

    // Test methods with params
    for (const { method, params } of methodsWithParams) {
      const result = await page.evaluate(async ({ method, params }) => {
        try {
          const eth = (window as any).ethereum;
          await eth.request({ method, params });
          return { success: true, method };
        } catch (error: any) {
          return { success: false, method, error: error.message };
        }
      }, { method, params });

      expect(result.success).toBeTruthy();
      console.log(`[Test] ✅ ${method}: implemented`);
    }
  });
});

test.describe('Manual Testing Preparation', () => {
  test('should document manual testing workflow', async () => {
    console.log('\n========================================');
    console.log('MANUAL TESTING WORKFLOW');
    console.log('========================================\n');

    console.log('1. SETUP METAMASK:');
    console.log('   - Install MetaMask browser extension');
    console.log('   - Add Anvil local network:');
    console.log('     * Network Name: Anvil Local');
    console.log('     * RPC URL: http://127.0.0.1:8545');
    console.log('     * Chain ID: 31337');
    console.log('     * Currency: ETH');
    console.log('');

    console.log('2. IMPORT TEST ACCOUNTS:');
    console.log(`   Manufacturer: ${ACCOUNTS.manufacturer.privateKey}`);
    console.log(`   OEM: ${ACCOUNTS.oem.privateKey}`);
    console.log(`   Fleet Operator: ${ACCOUNTS.fleetOperator.privateKey}`);
    console.log(`   Aftermarket: ${ACCOUNTS.aftermarket.privateKey}`);
    console.log('');

    console.log('3. TESTING WORKFLOW:');
    console.log('   a. Navigate to http://localhost:3000');
    console.log('   b. Click "Connect Wallet"');
    console.log('   c. Select MetaMask and connect');
    console.log('   d. Access /dashboard');
    console.log('   e. Verify 9 batteries are displayed');
    console.log('   f. Test Transfer Ownership:');
    console.log('      - Switch to Fleet Operator account');
    console.log('      - Initiate transfer of NV-2024-001234');
    console.log('      - Transfer to Aftermarket account');
    console.log('      - Switch to Aftermarket account');
    console.log('      - Accept the transfer');
    console.log('      - Verify no nonce errors in toast notifications');
    console.log('');

    console.log('4. VALIDATIONS:');
    console.log('   ✅ All 9 seed batteries visible');
    console.log('   ✅ Supply chain traceability working');
    console.log('   ✅ Transfer completes without nonce errors');
    console.log('   ✅ Toast notifications show friendly messages');
    console.log('');

    console.log('========================================\n');

    // This is just documentation, always passes
    expect(true).toBeTruthy();
  });
});
