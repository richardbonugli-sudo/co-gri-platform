import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AuditChartContainer } from '../shared/AuditChartContainer';
import { ExpectationWeightingSample, CSIRiskVector } from '@/types/audit.types';

interface ExpectationWeightingScatterProps {
  data: ExpectationWeightingSample[];
}

export function ExpectationWeightingScatter({ data }: ExpectationWeightingScatterProps) {
  const chartData = data.map(item => ({
    expected: item.raw_delta * item.probability_assigned * item.relevance_weight * (item.severity_score / 10),
    actual: item.applied_delta,
    vector: item.vector
  }));

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
      title="Expectation Weighting Integrity"
      description="Expected vs. Actual Applied Delta (diagonal line = perfect correlation)"
      height={400}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            dataKey="expected"
            name="Expected Delta"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Expected Delta', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            type="number"
            dataKey="actual"
            name="Actual Delta"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Actual Delta', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#f3f4f6' }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 50, y: 50 }]}
            stroke="#7fa89f"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Scatter
            data={chartData}
            fill="#7fa89f"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={vectorColors[payload.vector as CSIRiskVector]}
                  opacity={0.7}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </AuditChartContainer>
  );
}