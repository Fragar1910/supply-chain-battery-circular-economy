/**
 * Wallet Mock Helper for E2E Testing
 *
 * This helper injects a mock Ethereum provider (window.ethereum) into the browser
 * to simulate wallet connection without requiring actual MetaMask or other wallet extensions.
 *
 * It works by intercepting wallet requests and providing mock responses,
 * allowing us to test dApp functionality in an automated way.
 */

import { Page } from '@playwright/test';

export interface WalletMockOptions {
  address: string;
  privateKey?: string;
  chainId?: string; // hex string, default: '0x7a69' (31337 for Anvil)
  autoApprove?: boolean; // auto-approve all transactions
}

/**
 * Mock wallet connection by injecting window.ethereum
 *
 * This creates a mock Ethereum provider that responds to standard wallet requests
 * like account connection, chain ID checks, and transaction signing.
 */
export async function mockWalletConnection(
  page: Page,
  options: WalletMockOptions
): Promise<void> {
  const {
    address,
    chainId = '0x7a69', // 31337 in hex (Anvil)
    autoApprove = true,
  } = options;

  await page.addInitScript(
    ({ address, chainId, autoApprove }) => {
      console.log('[Wallet Mock] Initializing with address:', address);

      // Create mock Ethereum provider
      (window as any).ethereum = {
        isMetaMask: true,
        selectedAddress: address,
        chainId: chainId,
        networkVersion: String(parseInt(chainId, 16)),

        // Mock request method (handles all wallet RPC calls)
        request: async ({ method, params }: any) => {
          console.log('[Wallet Mock] Request:', method, params);

          switch (method) {
            case 'eth_requestAccounts':
              // Return connected account
              return [address];

            case 'eth_accounts':
              // Return current accounts
              return [address];

            case 'eth_chainId':
              // Return current chain ID
              return chainId;

            case 'net_version':
              // Return network version (decimal)
              return String(parseInt(chainId, 16));

            case 'personal_sign':
              // Mock signature (in real scenario, this would sign with private key)
              if (autoApprove) {
                const message = params[0];
                return '0xmocksig' + message.slice(2, 10) + '...';
              }
              throw new Error('User rejected signature');

            case 'eth_sendTransaction':
              // Mock transaction - in real scenario, this would broadcast to network
              if (autoApprove) {
                const txHash = '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0');
                console.log('[Wallet Mock] Mock transaction hash:', txHash);
                return txHash;
              }
              throw new Error('User rejected transaction');

            case 'wallet_switchEthereumChain':
              // Mock chain switch
              console.log('[Wallet Mock] Switching to chain:', params[0]?.chainId);
              return null;

            case 'wallet_addEthereumChain':
              // Mock adding chain
              console.log('[Wallet Mock] Adding chain:', params[0]);
              return null;

            case 'eth_getBalance':
              // Return mock balance (10000 ETH)
              return '0x21e19e0c9bab2400000'; // 10000 ETH in wei

            case 'eth_blockNumber':
              // Return mock block number
              return '0x1234';

            case 'eth_getTransactionReceipt':
              // Return mock receipt for mocked transactions
              const txHash = params[0];
              if (txHash.startsWith('0x')) {
                return {
                  transactionHash: txHash,
                  blockNumber: '0x1234',
                  status: '0x1', // success
                  from: address,
                  to: '0x0000000000000000000000000000000000000000',
                  gasUsed: '0x5208',
                };
              }
              return null;

            default:
              console.warn('[Wallet Mock] Unhandled method:', method);
              throw new Error(`Unhandled wallet method: ${method}`);
          }
        },

        // Mock event listener
        on: (event: string, handler: any) => {
          console.log('[Wallet Mock] Event listener added:', event);
          // Store handlers if needed for triggering events
          if (!(window as any)._walletEventHandlers) {
            (window as any)._walletEventHandlers = {};
          }
          if (!(window as any)._walletEventHandlers[event]) {
            (window as any)._walletEventHandlers[event] = [];
          }
          (window as any)._walletEventHandlers[event].push(handler);
        },

        // Mock removeListener
        removeListener: (event: string, handler: any) => {
          console.log('[Wallet Mock] Event listener removed:', event);
        },
      };

      // Trigger 'connect' event to notify wagmi
      setTimeout(() => {
        if ((window as any)._walletEventHandlers?.connect) {
          (window as any)._walletEventHandlers.connect.forEach((handler: any) => {
            handler({ chainId });
          });
        }
      }, 100);

      console.log('[Wallet Mock] Initialized successfully');
    },
    { address, chainId, autoApprove }
  );
}

/**
 * Connect wallet by clicking the connect button and using mock wallet
 *
 * This helper:
 * 1. Injects the mock wallet
 * 2. Clicks the connect button
 * 3. Waits for connection to complete
 */
export async function connectMockWallet(
  page: Page,
  options: WalletMockOptions
): Promise<void> {
  // Inject mock wallet first
  await mockWalletConnection(page, options);

  // Navigate to page
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Look for connect button (RainbowKit button)
  const connectButton = page.locator('button:has-text("Connect Wallet"), button:has-text("Connect")').first();

  if (await connectButton.isVisible()) {
    await connectButton.click();

    // Wait a bit for connection
    await page.waitForTimeout(1000);

    // Check if wallet is connected (should show address or disconnect button)
    const isConnected = await page.locator(`text=${options.address.slice(0, 6)}`).waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (isConnected) {
      console.log('[Test] Wallet connected successfully');
    } else {
      console.warn('[Test] Wallet connection may have failed - button not found');
    }
  } else {
    console.log('[Test] Connect button not found - wallet may already be connected');
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectMockWallet(page: Page): Promise<void> {
  const disconnectButton = page.locator('button:has-text("Disconnect")').first();

  if (await disconnectButton.isVisible()) {
    await disconnectButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Switch to a different account (useful for testing role-based actions)
 */
export async function switchMockWalletAccount(
  page: Page,
  newAddress: string
): Promise<void> {
  await page.evaluate(
    (newAddress) => {
      if ((window as any).ethereum) {
        (window as any).ethereum.selectedAddress = newAddress;

        // Trigger accountsChanged event
        if ((window as any)._walletEventHandlers?.accountsChanged) {
          (window as any)._walletEventHandlers.accountsChanged.forEach((handler: any) => {
            handler([newAddress]);
          });
        }
      }
    },
    newAddress
  );

  await page.waitForTimeout(500);
}
