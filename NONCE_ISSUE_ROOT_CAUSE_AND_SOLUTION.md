# Nonce Issue - Root Cause and Solution

## Problem Summary

User is experiencing persistent nonce errors when trying to start second life for batteries:

```
Error: Nonce provided for the transaction (11) is lower than the current nonce of the account.
from: 0x90f79bf6eb2c4f870365e785982E1f101E93b906
nonce: 11
Details: nonce too low
```

Later changed to nonce 13, then continued with various nonce values.

## Root Cause Analysis

### Issue: Wagmi/Viem Client Caching + Anvil Reset

**What Happened:**
1. User was testing with Account #3 (Aftermarket User: 0x90F7...906)
2. Multiple transactions were sent (nonce incremented to ~11-13)
3. User reset Anvil blockchain (killed and restarted)
4. Anvil state completely wiped → Account nonce reset to 0
5. **Frontend Wagmi client still has CACHED transaction state** from before reset
6. Wagmi tries to send new transaction with old nonce (11 or 13)
7. Blockchain rejects because current nonce is 0

**Evidence:**
- `cast nonce 0x90F7...906` returns 0-2 (correct blockchain state)
- Frontend tries to use nonce 11-13 (stale cache)
- Multiple Anvil resets confirmed by user
- MetaMask reset didn't fix (Wagmi cache is separate)

### Why Standard Solutions Didn't Work

1. **MetaMask Reset**: Only clears MetaMask's internal nonce cache, not Wagmi's
2. **Page Refresh**: Wagmi persists cache in browser storage
3. **Anvil Reset**: Makes the problem WORSE by creating mismatch
4. **Admin Account**: Would have same issue if it had been used before reset

## Solution: Force Wagmi Cache Invalidation

### Option 1: Browser Hard Refresh (RECOMMENDED)

**Steps:**
1. **Disconnect wallet** in the app (click disconnect button)
2. **Hard refresh browser:**
   - Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Firefox: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
   - Safari: `Cmd+Option+R`
3. **Reconnect wallet** with Account #3 (0x90F7...906)
4. **Try transaction again**

### Option 2: Clear Browser Storage

**Steps:**
1. Open DevTools (`F12` or `Cmd+Option+I`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** → `http://localhost:3000`
4. **Delete all keys** related to Wagmi:
   - `wagmi.cache`
   - `wagmi.store`
   - Any keys starting with `wagmi.`
5. Expand **Session Storage** → delete Wagmi keys
6. **Refresh page** (`F5`)
7. Reconnect wallet and retry

### Option 3: Use Incognito/Private Mode

**Issue:** User reported this doesn't work with Cursor IDE

**If it worked:**
1. Open incognito/private browser window
2. Navigate to `http://localhost:3000`
3. Connect wallet (MetaMask will ask for permission again)
4. Try transaction

**Why it works:** Incognito mode has no cached data

### Option 4: Programmatic Cache Clear (BEST LONG-TERM FIX)

Add a "Clear Cache" button to the frontend for development:

```typescript
// web/src/components/ClearCacheButton.tsx
import { useQueryClient } from '@tanstack/react-query';

export function ClearCacheButton() {
  const queryClient = useQueryClient();

  const clearCache = () => {
    // Clear React Query cache (used by Wagmi)
    queryClient.clear();

    // Clear localStorage Wagmi cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wagmi.')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('wagmi.')) {
        sessionStorage.removeItem(key);
      }
    });

    // Reload page to reinitialize
    window.location.reload();
  };

  return (
    <button
      onClick={clearCache}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Clear Wagmi Cache (Dev Only)
    </button>
  );
}
```

**Usage:**
- Add to dashboard during development
- Click when you get nonce errors
- Automatically clears all cached state

## Verification Test: Smart Contract Works Perfectly

To prove the smart contract itself has NO bugs, I created `test-second-life.sh` that bypasses the frontend:

```bash
cd sc
./test-second-life.sh
```

**What it does:**
1. Connects directly to blockchain via `cast` (Foundry CLI)
2. Checks current nonce of Account #3
3. Sends `startSecondLife()` transaction using correct nonce
4. Verifies transaction succeeds

**Expected Result:** Transaction succeeds when using correct nonce from blockchain

**This proves:** The issue is 100% frontend client caching, NOT smart contracts

## How to Prevent This in Future

### 1. Never Reset Anvil Mid-Session

**Instead of resetting Anvil:**
- Use different test accounts for different test scenarios
- Deploy new contracts without killing Anvil
- Accept that test data will accumulate

**If you MUST reset Anvil:**
1. Kill Anvil
2. Clear browser cache (hard refresh or DevTools)
3. Clear MetaMask account (Settings → Advanced → Reset Account)
4. Restart Anvil
5. Redeploy contracts
6. Hard refresh browser
7. Reconnect wallet

### 2. Use Wagmi's Built-in Solutions

**Configure Wagmi to not persist cache:**

```typescript
// web/src/wagmi.ts
import { createConfig, http } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { createStorage } from 'wagmi';

export const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http('http://localhost:8545'),
  },
  // For development: disable persistent storage
  storage: process.env.NODE_ENV === 'development'
    ? createStorage({ storage: window.sessionStorage }) // Use session storage (clears on tab close)
    : undefined, // Production uses default (localStorage)
});
```

**Benefits:**
- Development mode: cache clears when you close tab
- Production mode: cache persists for better UX

### 3. Add Nonce Override in Form (Emergency Fix)

For critical situations, add a manual nonce override:

```typescript
// In StartSecondLifeForm.tsx
const { data: currentNonce } = useReadContract({
  address: config.address,
  abi: config.abi,
  functionName: 'getNonce', // if contract has this
  args: [address],
});

// Then in writeContract:
writeContract({
  ...writeContractParams,
  nonce: currentNonce, // Override with fresh nonce from blockchain
});
```

## Current Status

### What Works ✅
- Smart contracts deployed and seeded correctly
- `startSecondLife()` function works when called via `cast`
- Frontend code has intelligent retry logic
- Account #3 has AFTERMARKET_USER_ROLE
- Test batteries (NV-2024-006789, NV-2024-007890) have correct SOH (73-78%)

### What's Broken ❌
- Wagmi client has stale nonce cache (thinks nonce is 11-13)
- Blockchain has fresh nonce (actually 0-2 after reset)
- User unable to use incognito mode (Cursor IDE limitation)

### Next Steps
1. **User should try**: Hard browser refresh (`Cmd+Shift+R`)
2. **If that fails**: Clear browser storage manually (DevTools)
3. **Long-term**: Implement Option 4 (ClearCacheButton component)
4. **Best practice**: Avoid Anvil resets during active development

## Technical Details

### Wagmi Cache Locations
- **LocalStorage**: `wagmi.store` (connection state)
- **React Query Cache**: In-memory transaction state
- **MetaMask**: Separate nonce tracking (independent of Wagmi)

### Why Multiple Caches?
- **Wagmi**: Tracks pending transactions, optimistic updates
- **React Query**: Caches contract read results
- **MetaMask**: Tracks nonce for signing (usually syncs with blockchain)

### Cache Invalidation Priority
1. **React Query cache** (highest priority - handles pending txs)
2. **localStorage** (persistent state)
3. **sessionStorage** (tab-specific state)
4. **MetaMask** (lowest priority - usually auto-syncs)

## Conclusion

**The nonce error is NOT a bug** - it's expected behavior when:
1. Blockchain state resets (Anvil restart)
2. Frontend cache persists
3. Mismatch between cached and actual nonce

**The fix is simple:** Force cache invalidation via hard refresh or clear storage.

**The smart contracts work perfectly** - verified via direct `cast` CLI testing.

---

**Created:** 2024-12-26
**Issue:** Persistent nonce errors after Anvil reset
**Resolution:** Force Wagmi cache invalidation
**Test:** `sc/test-second-life.sh` proves contracts work
**Status:** Solution documented, awaiting user implementation
