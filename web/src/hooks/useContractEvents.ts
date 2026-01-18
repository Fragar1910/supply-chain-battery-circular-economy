'use client';

import { useEffect, useCallback } from 'react';
import { useWatchContractEvent, useBlockNumber } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import type { Log } from 'viem';

export interface BatteryEvent {
  type: 'BatteryRegistered' | 'BatterySOHUpdated' | 'BatteryOwnershipTransferred' | 'BatteryStateChanged' | 'BatteryTransferred' | 'BatteryJourneyStarted';
  bin: string;
  timestamp: number;
  data: Record<string, any>;
}

interface UseContractEventsOptions {
  onBatteryRegistered?: (event: BatteryEvent) => void;
  onBatterySOHUpdated?: (event: BatteryEvent) => void;
  onOwnershipTransferred?: (event: BatteryEvent) => void;
  onStatusChanged?: (event: BatteryEvent) => void;
  onBatteryTransferred?: (event: BatteryEvent) => void;
  onJourneyStarted?: (event: BatteryEvent) => void;
  onAnyEvent?: (event: BatteryEvent) => void;
  enabled?: boolean;
  bin?: string; // Filter events for specific battery
}

/**
 * Hook to listen to battery-related contract events in real-time
 *
 * @example
 * ```tsx
 * useContractEvents({
 *   onBatteryRegistered: (event) => {
 *     console.log('New battery registered:', event.bin);
 *   },
 *   onBatterySOHUpdated: (event) => {
 *     queryClient.invalidateQueries(['battery', event.bin]);
 *   },
 * });
 * ```
 */
export function useContractEvents({
  onBatteryRegistered,
  onBatterySOHUpdated,
  onOwnershipTransferred,
  onStatusChanged,
  onBatteryTransferred,
  onJourneyStarted,
  onAnyEvent,
  enabled = true,
  bin,
}: UseContractEventsOptions = {}) {
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Helper to create event object
  const createEvent = useCallback((
    type: BatteryEvent['type'],
    logs: Log[]
  ): BatteryEvent | null => {
    if (!logs || logs.length === 0) return null;

    const log = logs[0];
    const args = (log as any).args || {};

    return {
      type,
      bin: args.bin || args.batteryId || '',
      timestamp: Date.now(),
      data: args,
    };
  }, []);

  // Listen to BatteryRegistered events
  useWatchContractEvent({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    eventName: 'BatteryRegistered',
    enabled: enabled && !!onBatteryRegistered,
    onLogs: (logs) => {
      const event = createEvent('BatteryRegistered', logs);
      if (event && (!bin || event.bin === bin)) {
        onBatteryRegistered?.(event);
        onAnyEvent?.(event);
      }
    },
  });

  // Listen to BatterySOHUpdated events
  useWatchContractEvent({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    eventName: 'BatterySOHUpdated',
    enabled: enabled && (!!onBatterySOHUpdated || !!onAnyEvent),
    onLogs: (logs) => {
      const event = createEvent('BatterySOHUpdated', logs);
      if (event && (!bin || event.bin === bin)) {
        onBatterySOHUpdated?.(event);
        onAnyEvent?.(event);
      }
    },
  });

  // Listen to OwnershipTransferred events
  useWatchContractEvent({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    eventName: 'BatteryOwnershipTransferred',
    enabled: enabled && (!!onOwnershipTransferred || !!onAnyEvent),
    onLogs: (logs) => {
      const event = createEvent('BatteryOwnershipTransferred', logs);
      if (event && (!bin || event.bin === bin)) {
        onOwnershipTransferred?.(event);
        onAnyEvent?.(event);
      }
    },
  });

  // Listen to StatusChanged events
  useWatchContractEvent({
    address: CONTRACTS.BatteryRegistry.address as `0x${string}`,
    abi: CONTRACTS.BatteryRegistry.abi,
    eventName: 'BatteryStateChanged',
    enabled: enabled && (!!onStatusChanged || !!onAnyEvent),
    onLogs: (logs) => {
      const event = createEvent('BatteryStateChanged', logs);
      if (event && (!bin || event.bin === bin)) {
        onStatusChanged?.(event);
        onAnyEvent?.(event);
      }
    },
  });

  // Listen to BatteryTransferred events from SupplyChainTracker
  useWatchContractEvent({
    address: CONTRACTS.SupplyChainTracker?.address as `0x${string}` | undefined,
    abi: CONTRACTS.SupplyChainTracker?.abi,
    eventName: 'BatteryTransferred',
    enabled: enabled && !!CONTRACTS.SupplyChainTracker && (!!onBatteryTransferred || !!onAnyEvent),
    onLogs: (logs) => {
      const event = createEvent('BatteryTransferred', logs);
      if (event && (!bin || event.bin === bin)) {
        onBatteryTransferred?.(event);
        onAnyEvent?.(event);
      }
    },
  });

  // Listen to BatteryJourneyStarted events from SupplyChainTracker
  useWatchContractEvent({
    address: CONTRACTS.SupplyChainTracker?.address as `0x${string}` | undefined,
    abi: CONTRACTS.SupplyChainTracker?.abi,
    eventName: 'BatteryJourneyStarted',
    enabled: enabled && !!CONTRACTS.SupplyChainTracker && (!!onJourneyStarted || !!onAnyEvent),
    onLogs: (logs) => {
      const event = createEvent('BatteryJourneyStarted', logs);
      if (event && (!bin || event.bin === bin)) {
        onJourneyStarted?.(event);
        onAnyEvent?.(event);
      }
    },
  });

  // Log block updates (optional, for debugging)
  useEffect(() => {
    if (blockNumber && enabled) {
      console.debug(`New block: ${blockNumber}`);
    }
  }, [blockNumber, enabled]);

  return { blockNumber };
}

/**
 * Hook to listen to events for a specific battery
 *
 * @example
 * ```tsx
 * useBatteryEvents('NV-2024-001234', {
 *   onBatterySOHUpdated: (event) => {
 *     showNotification(`SOH updated to ${event.data.newSOH}%`);
 *   },
 * });
 * ```
 */
export function useBatteryEvents(
  bin: string,
  options: Omit<UseContractEventsOptions, 'bin'> = {}
) {
  return useContractEvents({
    ...options,
    bin,
  });
}
