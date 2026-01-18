import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

/**
 * Hook to check if a specific battery has a pending transfer for the current user
 * @param bin Battery Identification Number (e.g., "NV-2024-001234")
 */
export function usePendingTransfer(bin?: string) {
  const { address } = useAccount();
  const binBytes32 = bin ? binToBytes32(bin) : '0x0';

  const { data: pendingTransfer, refetch } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getPendingTransfer',
    args: [binBytes32],
    query: {
      enabled: !!bin && bin.length > 0,
    },
  });

  const transfer = pendingTransfer as any;
  const hasPendingTransfer = transfer && transfer.isActive;
  const isRecipient = hasPendingTransfer && transfer.to?.toLowerCase() === address?.toLowerCase();
  const isSender = hasPendingTransfer && transfer.from?.toLowerCase() === address?.toLowerCase();

  return {
    hasPendingTransfer,
    isRecipient,
    isSender,
    transfer,
    refetch,
  };
}

/**
 * Hook to get the count of pending transfers for the current user
 * This is a simple implementation that checks specific batteries
 * TODO: Implement event-based tracking for all user's pending transfers
 */
export function usePendingTransfersCount() {
  // const { address } = useAccount();

  // TODO: Implement proper event listener or subgraph query
  // For now, this is a placeholder that returns 0
  // In production, you would:
  // 1. Listen to TransferInitiated events where to === address
  // 2. Filter out TransferAccepted/TransferRejected/TransferExpired events
  // 3. Return the count of active pending transfers

  return {
    count: 0,
    isLoading: false,
  };
}
