'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Battery, Leaf, Calendar, TrendingUp } from 'lucide-react';

export interface BatteryData {
  bin: string;
  manufacturer?: string;
  status: string; // Changed from union type to string to support all states
  soh?: number; // State of Health (0-100)
  carbonFootprint?: number; // kg CO2
  manufactureDate?: string;
  currentOwner?: string;
  location?: string;
}

interface BatteryCardProps {
  battery: BatteryData;
  onClick?: () => void;
  className?: string;
}

const statusConfig: Record<string, { color: string; label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  Manufactured: {
    color: 'bg-blue-600',
    label: 'Manufactured',
    variant: 'default',
  },
  Integrated: {
    color: 'bg-cyan-600',
    label: 'Integrated',
    variant: 'default',
  },
  FirstLife: {
    color: 'bg-green-600',
    label: 'First Life',
    variant: 'success',
  },
  SecondLife: {
    color: 'bg-yellow-600',
    label: 'Second Life',
    variant: 'warning',
  },
  EndOfLife: {
    color: 'bg-orange-600',
    label: 'End of Life',
    variant: 'destructive',
  },
  Recycled: {
    color: 'bg-slate-600',
    label: 'Recycled',
    variant: 'secondary',
  },
};

export function BatteryCard({ battery, onClick, className }: BatteryCardProps) {
  // Defensive check: ensure battery and status exist
  if (!battery || !battery.status) {
    return null;
  }

  const config = statusConfig[battery.status] || statusConfig.Manufactured; // Fallback to Manufactured if status not found

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] dark:bg-slate-900/50 dark:border-slate-800',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Battery className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <CardTitle className="text-lg">{battery.bin}</CardTitle>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
        {battery.manufacturer && (
          <CardDescription>{battery.manufacturer}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* State of Health */}
        {battery.soh !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <TrendingUp className="h-4 w-4" />
              <span>State of Health</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    battery.soh >= 80
                      ? 'bg-green-600'
                      : battery.soh >= 60
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  )}
                  style={{ width: `${battery.soh}%` }}
                />
              </div>
              <span className="text-sm font-medium">{battery.soh}%</span>
            </div>
          </div>
        )}

        {/* Carbon Footprint */}
        {battery.carbonFootprint !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Leaf className="h-4 w-4" />
              <span>Carbon Footprint</span>
            </div>
            <span className="text-sm font-medium">
              {battery.carbonFootprint.toLocaleString()} kg CO₂
            </span>
          </div>
        )}

        {/* Manufacture Date */}
        {battery.manufactureDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>Manufactured</span>
            </div>
            <span className="text-sm font-medium">{battery.manufactureDate}</span>
          </div>
        )}
      </CardContent>

      {battery.currentOwner && (
        <CardFooter className="pt-3 border-t dark:border-slate-800">
          <div className="flex items-center justify-between w-full text-xs text-slate-600 dark:text-slate-400">
            <span>Current Owner</span>
            <span className="font-mono">{battery.currentOwner.slice(0, 10)}...</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
