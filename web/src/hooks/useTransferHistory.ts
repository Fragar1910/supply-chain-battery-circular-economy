'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

export interface TransferEvent {
  id: string;
  from: string;
  to: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Hook to get transfer history from blockchain event logs
 * Reads BatteryOwnershipTransferred events from BatteryRegistry
 */
export function useTransferHistory(bin: string) {
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  useEffect(() => {
    if (!publicClient || !bin) {
      setIsLoading(false);
      return;
    }

    const fetchTransferLogs = async () => {
      try {
        setIsLoading(true);

        // Get contract deployment block (or use a reasonable starting block)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        // Fetch BatteryOwnershipTransferred events for this battery
        const logs = await publicClient.getContractEvents({
          address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
          abi: CONTRACTS.BatteryRegistry.abi,
          eventName: 'BatteryOwnershipTransferred',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Parse logs into transfer events
        const transferEvents: TransferEvent[] = [];

        for (const log of logs) {
          const args = log.args as any;

          // Get block to extract timestamp
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          transferEvents.push({
            id: `${log.blockNumber}-${log.logIndex}`,
            from: args.previousOwner || args.from || '0x0000000000000000000000000000000000000000',
            to: args.newOwner || args.to || '0x0000000000000000000000000000000000000000',
            timestamp: Number(block.timestamp),
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number (chronological order)
        transferEvents.sort((a, b) => a.blockNumber - b.blockNumber);

        setTransfers(transferEvents);
      } catch (error) {
        console.error('Error fetching transfer history:', error);
        setTransfers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransferLogs();
  }, [publicClient, bin, binBytes32]);

  return {
    transfers,
    isLoading,
    transferCount: transfers.length,
  };
}
