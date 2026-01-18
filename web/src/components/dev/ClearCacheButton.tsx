'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Development-only button to clear Wagmi and React Query caches
 *
 * **When to use:**
 * - After resetting Anvil blockchain
 * - When getting "nonce too low" errors
 * - When blockchain state doesn't match frontend
 *
 * **What it clears:**
 * - React Query cache (contract read results)
 * - localStorage wagmi.* keys (connection state)
 * - sessionStorage wagmi.* keys (temporary state)
 *
 * **NOTE:** Only visible in development mode
 */
export function ClearCacheButton() {
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const clearCache = () => {
    setIsClearing(true);

    try {
      console.log('🧹 Starting aggressive cache clear...');

      // 1. Clear React Query cache (used by Wagmi for contract calls)
      queryClient.clear();
      queryClient.removeQueries(); // More aggressive removal
      console.log('✓ React Query cache cleared');

      // 2. Clear ALL localStorage (not just wagmi)
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      console.log(`✓ Cleared ${localStorageKeys.length} localStorage keys`);

      // 3. Clear ALL sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      console.log(`✓ Cleared ${sessionStorageKeys.length} sessionStorage keys`);

      // 4. Try to clear IndexedDB if exists
      if (window.indexedDB) {
        window.indexedDB.databases().then((databases) => {
          databases.forEach((db) => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
              console.log(`✓ Deleted IndexedDB: ${db.name}`);
            }
          });
        }).catch(err => {
          console.warn('Could not clear IndexedDB:', err);
        });
      }

      // 5. Show success message
      console.log('✅ ALL caches cleared - reloading page in 1 second...');
      console.log('🔄 After reload, you MUST reconnect your wallet');

      // 6. Reload page after delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={clearCache}
        disabled={isClearing}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white rounded-lg shadow-lg transition-colors font-semibold text-sm"
        title="Clear Wagmi cache and reload (fixes nonce errors after Anvil reset)"
      >
        {isClearing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Clear Wagmi Cache
          </>
        )}
      </button>
      <p className="text-xs text-gray-400 mt-1 text-right">
        Dev only - fixes nonce errors
      </p>
    </div>
  );
}
