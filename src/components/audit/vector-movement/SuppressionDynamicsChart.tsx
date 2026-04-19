import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuditChartContainer } from '../shared/AuditChartContainer';
import { SuppressionMetrics, CSIRiskVectorNames } from '@/types/audit.types';

interface SuppressionDynamicsChartProps {
  data: SuppressionMetrics[];
}

export function SuppressionDynamicsChart({ data }: SuppressionDynamicsChartProps) {
  const chartData = data.map(item => ({
    vector: CSIRiskVectorNames[item.vector].split(' ').slice(0, 2).join(' '), // Shorten labels
    capped: item.pct_capped,
    netted: item.pct_netted,
    decayed: item.pct_decayed
  }));

  return (
    <AuditChartContainer
      title="Suppression & Scoring Dynamics"
      description="Percentage of signals capped, netted, and decayed by vector"
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="vector"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend wrapperStyle={{ color: '#9ca3af' }} />
          <Bar dataKey="capped" name="Capped" fill="#ef4444" />
          <Bar dataKey="netted" name="Netted" fill="#f59e0b" />
          <Bar dataKey="decayed" name="Decayed" fill="#6b7280" />
        </BarChart>
      </ResponsiveContainer>
    </AuditChartContainer>
  );
}