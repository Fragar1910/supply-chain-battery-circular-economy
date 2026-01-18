'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

export interface SOHUpdateEvent {
  id: string;
  timestamp: number;
  previousSOH: number;
  newSOH: number;
  cycles: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Hook to get SOH update events from blockchain
 * Reads BatterySOHUpdated events from BatteryRegistry
 */
export function useSOHEvents(bin: string) {
  const [events, setEvents] = useState<SOHUpdateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  useEffect(() => {
    if (!publicClient || !bin) {
      setIsLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        // Fetch BatterySOHUpdated events
        const logs = await publicClient.getContractEvents({
          address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
          abi: CONTRACTS.BatteryRegistry.abi,
          eventName: 'BatterySOHUpdated',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        const sohEvents: SOHUpdateEvent[] = [];

        for (const log of logs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          sohEvents.push({
            id: `soh-${log.blockNumber}-${log.logIndex}`,
            timestamp: Number(block.timestamp),
            previousSOH: args.previousSOH ? Number(args.previousSOH) / 100 : 0,
            newSOH: args.newSOH ? Number(args.newSOH) / 100 : 0,
            cycles: args.newCycles ? Number(args.newCycles) : 0,
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number
        sohEvents.sort((a, b) => a.blockNumber - b.blockNumber);

        setEvents(sohEvents);
      } catch (error) {
        console.error('Error fetching SOH events:', error);
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
    updateCount: events.length,
  };
}
