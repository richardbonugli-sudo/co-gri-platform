import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AuditChartContainer } from '../shared/AuditChartContainer';
import { FalseNegativeReason } from '@/types/audit.types';

interface FalseNegativeBreakdownProps {
  data: Record<FalseNegativeReason, number>;
}

export function FalseNegativeBreakdown({ data }: FalseNegativeBreakdownProps) {
  const chartData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([reason, count]) => ({
      name: reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      reason
    }));

  const COLORS = [
    '#ef4444', // red
    '#f59e0b', // orange
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#6b7280'  // gray
  ];

  return (
    <AuditChartContainer
      title="False Negative Root Causes"
      description="Distribution of reasons why events were missed"
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend
            wrapperStyle={{ color: '#9ca3af' }}
            formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
          />
        </PieChart>
      </ResponsiveContainer>
    </AuditChartContainer>
  );
}