import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AuditChartContainer } from '../shared/AuditChartContainer';
import { VectorRecallMetrics, CSIRiskVectorNames } from '@/types/audit.types';

interface RecallRateChartProps {
  data: Record<string, VectorRecallMetrics>;
}

export function RecallRateChart({ data }: RecallRateChartProps) {
  const chartData = Object.values(data).map(item => ({
    vector: CSIRiskVectorNames[item.vector].split(' ').slice(0, 2).join(' '),
    recallRate: item.recall_rate * 100,
    detected: item.detected,
    total: item.total_events
  }));

  return (
    <AuditChartContainer
      title="Recall Rate by Vector"
      description="Percentage of ground-truth events successfully detected (target: 95%)"
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
            domain={[0, 100]}
            label={{ value: 'Recall Rate (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}% (${props.payload.detected}/${props.payload.total})`,
              'Recall Rate'
            ]}
          />
          <ReferenceLine y={95} stroke="#7fa89f" strokeDasharray="5 5" label={{ value: 'Target: 95%', fill: '#7fa89f' }} />
          <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Minimum: 85%', fill: '#f59e0b' }} />
          <Bar
            dataKey="recallRate"
            fill="#7fa89f"
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              const color = payload.recallRate >= 95 ? '#10b981' : payload.recallRate >= 85 ? '#f59e0b' : '#ef4444';
              return <rect x={x} y={y} width={width} height={height} fill={color} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </AuditChartContainer>
  );
}