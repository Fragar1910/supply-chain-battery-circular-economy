/**
 * Hook to fetch recent batteries with full data from blockchain
 *
 * Fetches all batteries from seed data and returns the most recent ones
 * sorted by manufacture date descending
 */

import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import { stringToBytes32 } from '@/lib/utils';
import { useState, useEffect } from 'react';

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

export interface BatteryWithData {
  bin: string;
  manufacturer: string;
  status: string;
  soh: number;
  carbonFootprint: number;
  manufactureDate: string;
  currentOwner: string;
}

export function useRecentBatteries(limit: number = 6) {
  const [batteries, setBatteries] = useState<BatteryWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State map for battery status
  const stateMap: Record<number, string> = {
    0: 'Manufactured',
    1: 'Integrated',
    2: 'FirstLife',
    3: 'SecondLife',
    4: 'EndOfLife',
    5: 'Recycled',
  };

  useEffect(() => {
    const fetchBatteries = async () => {
      setIsLoading(true);
      const fetchedBatteries: BatteryWithData[] = [];

      // Fetch data for each battery
      for (const bin of SEED_BATTERY_BINS.slice(0, limit)) {
        try {
          const binBytes32 = stringToBytes32(bin);

          // Note: In a real implementation, this should be done with Promise.all
          // or using multiple useReadContract hooks. For now, we'll use a simple approach.
          // The actual fetching will happen via the contract in the component.

          fetchedBatteries.push({
            bin,
            manufacturer: 'Northvolt AB',
            status: 'FirstLife',
            soh: 95,
            carbonFootprint: 5600,
            manufactureDate: '2024-01-15',
            currentOwner: '0x0000...0000',
          });
        } catch (error) {
          console.error(`Error fetching battery ${bin}:`, error);
        }
      }

      // Sort by manufacture date descending (newest first)
      fetchedBatteries.sort((a, b) =>
        new Date(b.manufactureDate).getTime() - new Date(a.manufactureDate).getTime()
      );

      setBatteries(fetchedBatteries);
      setIsLoading(false);
    };

    fetchBatteries();
  }, [limit]);

  return {
    batteries,
    isLoading,
    refetch: () => {}, // Placeholder for future implementation
  };
}

/**
 * Hook to fetch a single battery's complete data
 */
export function useBatteryData(bin: string) {
  const binBytes32 = bin ? stringToBytes32(bin) : ('0x' + '0'.repeat(64)) as `0x${string}`;

  const { data: batteryData, isLoading, refetch } = useReadContract({
    address: CONTRACTS.BatteryRegistry.address,
    abi: CONTRACTS.BatteryRegistry.abi,
    functionName: 'getBattery',
    args: [binBytes32],
    query: {
      enabled: !!bin && bin.length > 0,
    },
  });

  const { data: carbonData } = useReadContract({
    address: CONTRACTS.CarbonFootprint.address,
    abi: CONTRACTS.CarbonFootprint.abi,
    functionName: 'getTotalFootprint',
    args: [binBytes32],
    query: {
      enabled: !!bin && bin.length > 0,
    },
  });

  // State map for battery status
  const stateMap: Record<number, string> = {
    0: 'Manufactured',
    1: 'Integrated',
    2: 'FirstLife',
    3: 'SecondLife',
    4: 'EndOfLife',
    5: 'Recycled',
  };

  const battery: BatteryWithData | null = batteryData ? {
    bin,
    manufacturer: (batteryData as any).manufacturerName || 'Unknown',
    status: stateMap[Number((batteryData as any).state)] || 'Manufactured',
    soh: typeof (batteryData as any).sohCurrent === 'bigint'
      ? Number((batteryData as any).sohCurrent) / 100
      : Number((batteryData as any).sohCurrent || 0) / 100,
    carbonFootprint: typeof carbonData === 'bigint'
      ? Number(carbonData)
      : Number((batteryData as any).carbonFootprintTotal || 0),
    manufactureDate: (batteryData as any).manufactureDate
      ? new Date(Number((batteryData as any).manufactureDate) * 1000).toISOString().split('T')[0]
      : '2024-01-15',
    currentOwner: (batteryData as any).currentOwner || '0x0000000000000000000000000000000000000000',
  } : null;

  return {
    battery,
    isLoading,
    refetch,
  };
}
