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
}, [confirmError, toastId, toast, reset]);
```

## Forms Already Fixed ✅

1. **TransferOwnershipForm.tsx** - Lines 55-66, 183-216
2. **RegisterBatteryForm.tsx** - Lines 50-61, 116-149

## Forms Pending Update ⏳

Need to apply the same changes to:
- [ ] IntegrateBatteryForm.tsx
- [ ] RecycleBatteryForm.tsx
- [ ] StartSecondLifeForm.tsx
- [ ] UpdateSOHForm.tsx

## Testing

After applying fixes, test with unauthorized transaction:
1. Try to transfer a battery you don't own
2. Expected: Toast shows "Transaction reverted..." after max 30 seconds
3. Previous: Toast stuck on "Confirming transaction..." forever

