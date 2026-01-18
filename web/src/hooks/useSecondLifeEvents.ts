'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

export interface SecondLifeEvent {
  id: string;
  type: 'started' | 'ended';
  timestamp: number;
  operator: string;
  applicationType?: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Hook to get second life events from blockchain
 * Reads SecondLifeStarted and SecondLifeEnded events
 */
export function useSecondLifeEvents(bin: string) {
  const [events, setEvents] = useState<SecondLifeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  useEffect(() => {
    if (!publicClient || !bin || !CONTRACTS.SecondLifeManager) {
      setIsLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        // Fetch SecondLifeStarted events
        const startedLogs = await publicClient.getContractEvents({
          address: CONTRACTS.SecondLifeManager.address as `0x${string}`,
          abi: CONTRACTS.SecondLifeManager.abi,
          eventName: 'SecondLifeStarted',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Fetch SecondLifeEnded events
        const endedLogs = await publicClient.getContractEvents({
          address: CONTRACTS.SecondLifeManager.address as `0x${string}`,
          abi: CONTRACTS.SecondLifeManager.abi,
          eventName: 'SecondLifeEnded',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        const allEvents: SecondLifeEvent[] = [];

        // Parse started events
        for (const log of startedLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `sl-started-${log.blockNumber}-${log.logIndex}`,
            type: 'started',
            timestamp: Number(block.timestamp),
            operator: args.operator || '0x0000000000000000000000000000000000000000',
            applicationType: args.applicationType ? Number(args.applicationType) : undefined,
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Parse ended events
        for (const log of endedLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `sl-ended-${log.blockNumber}-${log.logIndex}`,
            type: 'ended',
            timestamp: Number(block.timestamp),
            operator: args.operator || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number
        allEvents.sort((a, b) => a.blockNumber - b.blockNumber);

        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching second life events:', error);
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
    hasSecondLife: events.length > 0,
  };
}
