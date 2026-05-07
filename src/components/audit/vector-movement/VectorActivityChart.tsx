import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuditChartContainer } from '../shared/AuditChartContainer';
import { VectorActivityData, CSIRiskVector, CSIRiskVectorNames } from '@/types/audit.types';

interface VectorActivityChartProps {
  data: VectorActivityData[];
}

export function VectorActivityChart({ data }: VectorActivityChartProps) {
  // Transform data for Recharts
  const chartData = data.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.month === item.month);
    if (existing) {
      existing[item.vector] = item.total_movement_points;
    } else {
      acc.push({
        month: item.month,
        [item.vector]: item.total_movement_points
      });
    }
    return acc;
  }, []);

  const vectorColors: Record<CSIRiskVector, string> = {
    [CSIRiskVector.CONFLICT_SECURITY]: '#ef4444',
    [CSIRiskVector.SANCTIONS_REGULATORY]: '#f59e0b',
    [CSIRiskVector.TRADE_LOGISTICS]: '#10b981',
    [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: '#3b82f6',
    [CSIRiskVector.CYBER_DATA]: '#8b5cf6',
    [CSIRiskVector.CIVIL_UNREST]: '#ec4899',
    [CSIRiskVector.CURRENCY_CAPITAL_CONTROLS]: '#14b8a6'
  };

  return (
    <AuditChartContainer
      title="12-Month Vector Activity Time Series"
      description="Total movement points by vector over time"
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Movement Points', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend wrapperStyle={{ color: '#9ca3af' }} />
          {Object.values(CSIRiskVector).map(vector => (
            <Line
              key={vector}
              type="monotone"
              dataKey={vector}
              name={CSIRiskVectorNames[vector]}
              stroke={vectorColors[vector]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </AuditChartContainer>
  );
}