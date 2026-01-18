'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export interface CarbonFootprintData {
  stage: string;
  emissions: number;
  color?: string;
}

interface CarbonFootprintChartProps {
  data: CarbonFootprintData[];
  title?: string;
  description?: string;
  className?: string;
}

const defaultColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6b7280'];

export function CarbonFootprintChart({
  data,
  title = 'Carbon Footprint by Stage',
  description = 'Total CO₂ emissions throughout the supply chain',
  className,
}: CarbonFootprintChartProps) {
  const totalEmissions = data.reduce((sum, item) => sum + item.emissions, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          <span className="ml-2 font-semibold text-slate-900 dark:text-slate-50">
            Total: {totalEmissions.toLocaleString()} kg CO₂
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="stage"
              className="text-xs"
              tick={{ fill: '#64748b' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: '#64748b' }}
              label={{
                value: 'kg CO₂',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#64748b' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f1f5f9',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} kg CO₂`, 'Emissions']}
            />
            <Legend />
            <Bar dataKey="emissions" name="CO₂ Emissions" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || defaultColors[index % defaultColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
