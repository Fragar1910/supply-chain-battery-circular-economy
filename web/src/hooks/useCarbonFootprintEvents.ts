'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

export interface CarbonEmissionEvent {
  id: string;
  timestamp: number;
  phase: number;
  phaseName: string;
  kgCO2e: number;
  recordedBy: string;
  blockNumber: number;
  transactionHash: string;
}

const phaseNames = [
  'Raw Material Extraction',
  'Manufacturing',
  'Transportation',
  'First Life Usage',
  'Second Life Usage',
  'Recycling'
];

/**
 * Hook to get carbon emission events from blockchain
 * Reads EmissionAdded and BatchEmissionsAdded events from CarbonFootprint contract
 */
export function useCarbonFootprintEvents(bin: string) {
  const [events, setEvents] = useState<CarbonEmissionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  useEffect(() => {
    if (!publicClient || !bin || !CONTRACTS.CarbonFootprint) {
      setIsLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        // Fetch EmissionAdded events
        const emissionLogs = await publicClient.getContractEvents({
          address: CONTRACTS.CarbonFootprint.address as `0x${string}`,
          abi: CONTRACTS.CarbonFootprint.abi,
          eventName: 'EmissionAdded',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        const carbonEvents: CarbonEmissionEvent[] = [];

        for (const log of emissionLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          const phase = args.phase ? Number(args.phase) : 0;
          carbonEvents.push({
            id: `carbon-${log.blockNumber}-${log.logIndex}`,
            timestamp: Number(block.timestamp),
            phase,
            phaseName: phaseNames[phase] || 'Unknown Phase',
            kgCO2e: args.kgCO2e ? Number(args.kgCO2e) : 0,
            recordedBy: args.recordedBy || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number
        carbonEvents.sort((a, b) => a.blockNumber - b.blockNumber);

        setEvents(carbonEvents);
      } catch (error) {
        console.error('Error fetching carbon footprint events:', error);
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
    eventCount: events.length,
    totalEmissions: events.reduce((sum, e) => sum + e.kgCO2e, 0),
  };
}
