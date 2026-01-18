/**
 * Hook to fetch batteries for aftermarket/second life use
 *
 * Provides:
 * - Available batteries (SOH 70-80%, not yet in second life)
 * - Active second life batteries (currently in second life)
 */

import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { binToBytes32 } from '@/lib/binUtils';

// Test battery BINs from SeedData.s.sol for available second life batteries
const AVAILABLE_SECOND_LIFE_BINS = [
  'NV-2024-006789', // SOH 78%
  'NV-2024-007890', // SOH 75%
  'NV-2024-008901', // SOH 73%
  'NV-2024-009012', // SOH 77%
];

// Batteries already in second life from seed data
const ACTIVE_SECOND_LIFE_BINS = [
  'NV-2024-003456', // SOH 72%
  'NV-2024-004567', // SOH 52%
];

export interface AvailableBattery {
  bin: string;
  binBytes32: `0x${string}`;
  manufacturer?: string;
  chemistry?: number;
  capacity?: number; // kWh
  soh?: number; // basis points (7800 = 78%)
  cycles?: number;
  availableCapacity?: number; // Calculated: capacity * (soh/10000)
  state?: number;
}

export interface SecondLifeBattery {
  bin: string;
  binBytes32: `0x${string}`;
  applicationType?: number;
  operator?: `0x${string}`;
  initialSOH?: number;
  currentSOH?: number;
  cyclesCompleted?: number;
  startDate?: bigint;
  isActive?: boolean;
  installationHash?: `0x${string}`;
}

/**
 * Hook to fetch batteries available for second life (SOH 70-80%)
 */
export function useAvailableSecondLifeBatteries() {
  // For now, we return known batteries from seed data
  // In production, this would query the BatteryRegistry for batteries with SOH 70-80%

  const batteries: AvailableBattery[] = AVAILABLE_SECOND_LIFE_BINS.map((bin) => ({
    bin,
    binBytes32: binToBytes32(bin),
  }));

  return {
    batteries,
    isLoading: false,
    count: batteries.length,
    refetch: () => {},
  };
}

/**
 * Hook to fetch a single battery's data for second life evaluation
 */
export function useAvailableBattery(bin: string) {
  const binBytes32 = binToBytes32(bin);

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: [binBytes32],
    query: {
      enabled: !!bin,
    },
  });

  // Transform battery data
  const battery: AvailableBattery | null = data
    ? {
        bin,
        binBytes32,
        manufacturer: (data as any)[1] || undefined,
        chemistry: (data as any)[3] !== undefined ? Number((data as any)[3]) : undefined,
        capacity: (data as any)[4] !== undefined ? Number((data as any)[4]) : undefined, // kWh
        soh: (data as any)[6] !== undefined ? Number((data as any)[6]) : undefined, // basis points
        cycles: (data as any)[7] !== undefined ? Number((data as any)[7]) : undefined,
        state: (data as any)[5] !== undefined ? Number((data as any)[5]) : undefined,
        availableCapacity:
          (data as any)[4] !== undefined && (data as any)[6] !== undefined
            ? (Number((data as any)[4]) * Number((data as any)[6])) / 10000
            : undefined,
      }
    : null;

  return {
    battery,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook to fetch batteries currently in second life
 */
export function useSecondLifeBatteries() {
  const batteries: SecondLifeBattery[] = ACTIVE_SECOND_LIFE_BINS.map((bin) => ({
    bin,
    binBytes32: binToBytes32(bin),
  }));

  return {
    batteries,
    isLoading: false,
    count: batteries.length,
    refetch: () => {},
  };
}

/**
 * Hook to fetch second life data for a specific battery
 */
export function useSecondLifeData(bin: string) {
  const binBytes32 = binToBytes32(bin);

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACTS.SecondLifeManager.address,
    abi: CONTRACTS.SecondLifeManager.abi,
    functionName: 'getSecondLifeData',
    args: [binBytes32],
    query: {
      enabled: !!bin,
    },
  });

  const secondLifeData: SecondLifeBattery | null = data
    ? {
        bin,
        binBytes32,
        applicationType: (data as any)[1] !== undefined ? Number((data as any)[1]) : undefined,
        operator: (data as any)[2] || undefined,
        initialSOH: (data as any)[3] !== undefined ? Number((data as any)[3]) : undefined,
        currentSOH: (data as any)[4] !== undefined ? Number((data as any)[4]) : undefined,
        cyclesCompleted: (data as any)[5] !== undefined ? Number((data as any)[5]) : undefined,
        startDate: (data as any)[6] !== undefined ? BigInt((data as any)[6]) : undefined,
        isActive: (data as any)[8] !== undefined ? Boolean((data as any)[8]) : undefined,
        installationHash: (data as any)[9] || undefined,
      }
    : null;

  return {
    secondLifeData,
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Hook to check if a battery is eligible for second life
 */
export function useIsEligibleForSecondLife(bin: string) {
  const binBytes32 = binToBytes32(bin);

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACTS.SecondLifeManager.address,
    abi: CONTRACTS.SecondLifeManager.abi,
    functionName: 'isEligibleForSecondLife',
    args: [binBytes32],
    query: {
      enabled: !!bin,
    },
  });

  return {
    isEligible: data as boolean,
    isLoading,
    isError,
    refetch,
  };
}
