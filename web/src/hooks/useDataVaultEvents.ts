'use client';

import { useMemo, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

export interface TelemetryEvent {
  id: string;
  type: 'telemetry';
  timestamp: number;
  soh: number;
  soc: number;
  mileage: number;
  chargeCycles: number;
  recordedBy: string;
  blockNumber: number;
  transactionHash: string;
}

export interface MaintenanceEvent {
  id: string;
  type: 'maintenance';
  timestamp: number;
  maintenanceType: number;
  technicianId: string;
  serviceDate: number;
  recordedBy: string;
  blockNumber: number;
  transactionHash: string;
}

export interface CriticalEvent {
  id: string;
  type: 'critical';
  timestamp: number;
  eventType: number;
  severity: number;
  eventDate: number;
  recordedBy: string;
  blockNumber: number;
  transactionHash: string;
}

export type DataVaultEvent = TelemetryEvent | MaintenanceEvent | CriticalEvent;

/**
 * Hook to get DataVault events from blockchain
 * Reads TelemetryRecorded, MaintenanceRecorded, CriticalEventRecorded
 */
export function useDataVaultEvents(bin: string) {
  const [events, setEvents] = useState<DataVaultEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const binBytes32 = useMemo(() => binToBytes32(bin), [bin]);

  useEffect(() => {
    if (!publicClient || !bin || !CONTRACTS.DataVault) {
      setIsLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

        // Fetch TelemetryRecorded events
        const telemetryLogs = await publicClient.getContractEvents({
          address: CONTRACTS.DataVault.address as `0x${string}`,
          abi: CONTRACTS.DataVault.abi,
          eventName: 'TelemetryRecorded',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Fetch MaintenanceRecorded events
        const maintenanceLogs = await publicClient.getContractEvents({
          address: CONTRACTS.DataVault.address as `0x${string}`,
          abi: CONTRACTS.DataVault.abi,
          eventName: 'MaintenanceRecorded',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        // Fetch CriticalEventRecorded events
        const criticalLogs = await publicClient.getContractEvents({
          address: CONTRACTS.DataVault.address as `0x${string}`,
          abi: CONTRACTS.DataVault.abi,
          eventName: 'CriticalEventRecorded',
          args: {
            bin: binBytes32,
          },
          fromBlock,
          toBlock: 'latest',
        });

        const allEvents: DataVaultEvent[] = [];

        // Parse telemetry events
        for (const log of telemetryLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `telemetry-${log.blockNumber}-${log.logIndex}`,
            type: 'telemetry',
            timestamp: Number(block.timestamp),
            soh: args.soh ? Number(args.soh) / 100 : 0, // Convert from basis points
            soc: args.soc ? Number(args.soc) / 100 : 0,
            mileage: args.mileage ? Number(args.mileage) : 0,
            chargeCycles: args.chargeCycles ? Number(args.chargeCycles) : 0,
            recordedBy: args.recordedBy || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Parse maintenance events
        for (const log of maintenanceLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `maintenance-${log.blockNumber}-${log.logIndex}`,
            type: 'maintenance',
            timestamp: Number(block.timestamp),
            maintenanceType: args.maintenanceType ? Number(args.maintenanceType) : 0,
            technicianId: args.technicianId || '',
            serviceDate: args.serviceDate ? Number(args.serviceDate) : 0,
            recordedBy: args.recordedBy || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Parse critical events
        for (const log of criticalLogs) {
          const args = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });

          allEvents.push({
            id: `critical-${log.blockNumber}-${log.logIndex}`,
            type: 'critical',
            timestamp: Number(block.timestamp),
            eventType: args.eventType ? Number(args.eventType) : 0,
            severity: args.severity ? Number(args.severity) : 0,
            eventDate: args.eventDate ? Number(args.eventDate) : 0,
            recordedBy: args.recordedBy || '0x0000000000000000000000000000000000000000',
            blockNumber: Number(log.blockNumber),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number
        allEvents.sort((a, b) => a.blockNumber - b.blockNumber);

        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching DataVault events:', error);
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
    telemetryEvents: events.filter((e): e is TelemetryEvent => e.type === 'telemetry'),
    maintenanceEvents: events.filter((e): e is MaintenanceEvent => e.type === 'maintenance'),
    criticalEvents: events.filter((e): e is CriticalEvent => e.type === 'critical'),
  };
}
