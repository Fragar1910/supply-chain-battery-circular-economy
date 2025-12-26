# Timeout Fix for Transaction Forms

## Problem
When a transaction reverts on the blockchain (e.g., "Not authorized" error), the toast notification stays in "Confirming transaction..." state indefinitely, never showing the error.

## Solution Applied

Added two safety mechanisms to handle stuck transactions:

### 1. Retry Configuration
Added retry logic to `useWaitForTransactionReceipt`:
```typescript
const { ... } = useWaitForTransactionReceipt({
  hash,
  query: {
    enabled: !!hash,
    retry: 3,           // NEW: Retry 3 times
    retryDelay: 1000,   // NEW: Wait 1s between retries
  },
});
```

### 2. 30-Second Timeout
Added a useEffect with setTimeout to forcefully clear stuck toasts:
```typescript
useEffect(() => {
  if (isConfirming && toastId) {
    const timeoutId = setTimeout(() => {
      if (toastId) {
        toast.dismiss(toastId);
        toast.transactionError('Transaction timeout', {
          description: 'Transaction is taking too long. Please check your wallet or try again.',
        });
        setToastId(undefined);
        reset();
      }
    }, 30000); // 30 seconds timeout

    return () => clearTimeout(timeoutId);
  }
}, [isConfirming, toastId, toast, reset]);
```

### 3. Better Error Messages
Improved confirmError handler to detect reverts:
```typescript
useEffect(() => {
  if (confirmError && toastId) {
    toast.dismiss(toastId);
    const errorMsg = confirmError.message.includes('reverted')
      ? 'Transaction reverted. You may not be authorized or the battery may not exist.'
      : confirmError.message.includes('Not authorized')
      ? 'Not authorized to transfer this battery'
      : confirmError.message;

    toast.transactionError('Transaction confirmation failed', {
      description: errorMsg,
    });
    setToastId(undefined);
    reset();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [confirmError, toastId]); // toast, reset removed - stable functions to prevent infinite loops
```

### 4. ⚠️ CRITICAL: Prevent Infinite Loops
**Remove stable functions from useEffect dependencies to prevent "Maximum update depth exceeded" errors:**

```typescript
// ❌ WRONG - Causes infinite loops
useEffect(() => {
  if (error && toastId) {
    toast.transactionError('Error');
    reset();
  }
}, [error, toastId, toast, reset]); // ❌ toast and reset cause loops

// ✅ CORRECT - No infinite loops
useEffect(() => {
  if (error && toastId) {
    toast.transactionError('Error');
    reset();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [error, toastId]); // ✅ Only values that change, not stable functions
```

**Functions to REMOVE from dependencies:**
- `toast` (from useToast hook)
- `reset` (from wagmi hooks)
- `router` (from Next.js)
- `refetch` (from React Query)
- Optional callbacks: `onSuccess?.()`, `onError?.()`

## Forms Already Fixed ✅

1. **TransferOwnershipForm.tsx** - Lines 151-246 ✅ 2024-12-22 (Infinite loop fix)
2. **AcceptTransferForm.tsx** - Lines 144-239 ✅ 2024-12-22 (Infinite loop fix)
3. **RegisterBatteryForm.tsx** - Lines 50-61, 116-149
4. **IntegrateBatteryForm.tsx** - Lines 66-77, 133-168 ✅ 2024-12-21
5. **RecycleBatteryForm.tsx** - Lines 98-109, 166-201 ✅ 2024-12-21
6. **StartSecondLifeForm.tsx** - Lines 84-95, 152-187 ✅ 2024-12-21
7. **UpdateSOHForm.tsx** - Lines 54-65, 146-181 ✅ 2024-12-21

## All Forms Fixed! 🎉

All transaction forms now have:
- ✅ Retry logic (3 retries, 1s delay)
- ✅ 30-second timeout safety net
- ✅ Better error messages for reverted transactions
- ✅ **NO infinite loops** (stable functions removed from dependencies)

## Testing

After applying fixes, test with unauthorized transaction:
1. Try to transfer a battery you don't own
2. Expected: Toast shows "Transaction reverted..." after max 30 seconds
3. Previous: Toast stuck on "Confirming transaction..." forever
4. **NEW**: No "Maximum update depth exceeded" errors
5. **NEW**: Toast dismisses properly, no infinite loops

## Related Fixes

- **INFINITE_LOOP_FIX.md** - Details on fixing "Maximum update depth exceeded" errors by removing stable functions from useEffect dependencies

