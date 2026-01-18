'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

export interface RecyclingEvent {
  id: string;
  type: 'started' | 'statusUpdated' | 'completed' | 'audited';
  timestamp: number;
  facility?: string;
  status?: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Hook to get recycling events from blockchain
 * Reads RecyclingStarted, RecyclingCompleted, etc.
 */
export function useRecyclingEvents(bin: string) {
  const [events, setEvents] = useState<RecyclingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  useEffect(() => {
    if (!publicClient || !bin || !CONTRACTS.RecyclingManager) {
      setIsLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        // Fetch RecyclingStarted events
        const startedLogs = await publicClient.getContractEvents({
          address: CONTRACTS.RecyclingManager.address as `0x${string}`,
          abi: CONTRACTS.RecyclingManager.abi,
          eventName: 'RecyclingStarted',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Fetch RecyclingCompleted events
        const completedLogs = await publicClient.getContractEvents({
          address: CONTRACTS.RecyclingManager.address as `0x${string}`,
          abi: CONTRACTS.RecyclingManager.abi,
          eventName: 'RecyclingCompleted',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        const allEvents: RecyclingEvent[] = [];

        // Parse started events
        for (const log of startedLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `recycling-started-${log.blockNumber}-${log.logIndex}`,
            type: 'started',
            timestamp: Number(block.timestamp),
            facility: args.facility || args.recycler || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Parse completed events
        for (const log of completedLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `recycling-completed-${log.blockNumber}-${log.logIndex}`,
            type: 'completed',
            timestamp: Number(block.timestamp),
            facility: args.facility || args.recycler || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number
        allEvents.sort((a, b) => a.blockNumber - b.blockNumber);

        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching recycling events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [publicClient, bin, binBytes32]);

  return {
    events,
    isLoading,
    hasRecycling: events.length > 0,
  };
}
