'use client';

import { toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';

export interface ToastOptions extends ExternalToast {
  duration?: number;
}

/**
 * Custom hook for showing toast notifications
 * Wrapper around Sonner toast library with Northvolt branding
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * // Success notification
 * toast.success('Battery registered successfully!');
 *
 * // Error notification
 * toast.error('Failed to register battery');
 *
 * // Custom notification with action
 * toast.info('New battery detected', {
 *   action: {
 *     label: 'View',
 *     onClick: () => router.push('/passport/NV-2024-001234'),
 *   },
 * });
 * ```
 */
export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, options);
  };

  const promise = <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      ...options,
    });
  };

  const dismiss = (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  };

  const custom = (jsx: (id: number | string) => React.ReactElement, options?: ToastOptions) => {
    return sonnerToast.custom(jsx, options);
  };

  // Battery-specific toast helpers
  const batteryRegistered = (bin: string, options?: ToastOptions) => {
    return success(`Battery ${bin} registered successfully!`, {
      description: 'The battery has been added to the blockchain',
      ...options,
    });
  };

  const batterySOHUpdated = (bin: string, soh: number, options?: ToastOptions) => {
    return info(`Battery ${bin} SOH updated`, {
      description: `New State of Health: ${soh}%`,
      ...options,
    });
  };

  const batteryOwnershipTransferred = (bin: string, newOwner: string, options?: ToastOptions) => {
    const shortAddress = `${newOwner.slice(0, 6)}...${newOwner.slice(-4)}`;
    return info(`Battery ${bin} transferred`, {
      description: `New owner: ${shortAddress}`,
      ...options,
    });
  };

  const batteryStatusChanged = (bin: string, status: string, options?: ToastOptions) => {
    return info(`Battery ${bin} status changed`, {
      description: `New status: ${status}`,
      ...options,
    });
  };

  const transactionPending = (message: string = 'Transaction pending', options?: ToastOptions) => {
    return loading(message, {
      description: 'Please wait while the transaction is being processed...',
      ...options,
    });
  };

  const transactionSuccess = (message: string = 'Transaction successful', options?: ToastOptions) => {
    return success(message, {
      description: 'Your transaction has been confirmed on the blockchain',
      ...options,
    });
  };

  const transactionError = (message: string = 'Transaction failed', options?: ToastOptions) => {
    return error(message, {
      description: 'Please try again or check your wallet',
      ...options,
    });
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    custom,
    // Battery-specific helpers
    batteryRegistered,
    batterySOHUpdated,
    batteryOwnershipTransferred,
    batteryStatusChanged,
    // Transaction helpers
    transactionPending,
    transactionSuccess,
    transactionError,
  };
}
