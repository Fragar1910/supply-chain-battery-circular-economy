'use client';

import { BatteryWithData, useBatteryData } from '@/hooks/useRecentBatteries';
import { BatteryCard } from './BatteryCard';
import { Skeleton } from '@/components/ui';

interface BatteryCardWithDataProps {
  bin: string;
  
}

export function BatteryCardWithData({ bin }: BatteryCardWithDataProps) {
  const { battery, isLoading } = useBatteryData(bin);

  if (isLoading) {
    return (
      <div className="h-full">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  if (!battery) {
    return null;
  }

  return <BatteryCard battery={battery} />;
}
