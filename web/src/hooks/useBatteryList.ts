/**
 * Hook to fetch list of batteries from blockchain
 *
 * Note: The BatteryRegistry contract doesn't have a function to get all batteries.
 * This hook uses the known test battery BINs from seed data.
 *
 * TODO: Add event indexing or contract function to get all batteries
 */

import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { stringToBytes32 } from '@/lib/utils';

// Test battery BINs from SeedData.s.sol
const SEED_BATTERY_BINS = [
  'NV-2024-001234',
  'NV-2024-002345',
  'NV-2024-003456',
  'NV-2024-004567',
  'NV-2024-005678',
  'NV-2024-006789',
  'NV-2024-007890',
  'NV-2024-008901',
  'NV-2024-009012',
];

export interface BatteryFromChain {
  bin: string;
  binBytes32: `0x${string}`;
  exists: boolean;
  manufacturer?: string;
  currentOwner?: `0x${string}`;
  state?: number;
  soh?: number;
  capacity?: number;
  manufactureDate?: bigint;
  carbonFootprint?: bigint;
}

export function useBatteryList() {
  // For now, we return the known seed batteries
  // In the future, this should query events or use a contract function

  const batteries: BatteryFromChain[] = SEED_BATTERY_BINS.map((bin) => ({
    bin,
    binBytes32: stringToBytes32(bin),
    exists: true, // Assume they exist if seeded
  }));

  return {
    batteries,
    isLoading: false,
    refetch: () => {}, // Placeholder for future implementation
  };
}

/**
 * Hook to fetch a single battery by BIN
 */
export function useBattery(bin: string) {
  const binBytes32 = stringToBytes32(bin);

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: [binBytes32],
    query: {
      enabled: !!bin,
    },
  });

  // Transform the data if it exists
  const battery: BatteryFromChain | null = data ? {
    bin,
    binBytes32,
    exists: true,
    manufacturer: (data as any)[1] || undefined, // manufacturerName
    currentOwner: (data as any)[2] || undefined,
    state: (data as any)[4] !== undefined ? Number((data as any)[4]) : undefined,
    soh: (data as any)[7] !== undefined ? Number((data as any)[7]) : undefined,
    capacity: (data as any)[5] !== undefined ? Number((data as any)[5]) : undefined,
    manufactureDate: (data as any)[9] !== undefined ? BigInt((data as any)[9]) : undefined,
    carbonFootprint: (data as any)[6] !== undefined ? BigInt((data as any)[6]) : undefined,
  } : null;

  return {
    battery,
    isLoading,
    isError,
    refetch,
  };
}
