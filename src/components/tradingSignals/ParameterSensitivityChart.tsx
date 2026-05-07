/**
 * Parameter Sensitivity Chart Component
 * 
 * Displays how performance metrics change with different parameter values
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ParameterSensitivityChartProps {
  data: Array<{
    parameter: number;
    sharpeRatio: number;
    annualizedReturn: number;
    maxDrawdown: number;
  }>;
  parameterName: string;
  metric: 'sharpeRatio' | 'annualizedReturn' | 'maxDrawdown';
}

export const ParameterSensitivityChart: React.FC<ParameterSensitivityChartProps> = ({
  data,
  parameterName,
  metric,
}) => {
  const chartData = data.map(d => ({
    parameter: d.parameter,
    value: metric === 'sharpeRatio' ? d.sharpeRatio : 
           metric === 'annualizedReturn' ? d.annualizedReturn * 100 :
           d.maxDrawdown * 100,
  }));
  
  const metricLabel = metric === 'sharpeRatio' ? 'Sharpe Ratio' :
                     metric === 'annualizedReturn' ? 'Annualized Return (%)' :
                     'Max Drawdown (%)';
  
  const color = metric === 'sharpeRatio' ? '#06B6D4' :
                metric === 'annualizedReturn' ? '#10B981' :
                '#EF4444';
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="parameter" 
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            label={{ value: parameterName, position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            label={{ value: metricLabel, angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#F3F4F6'
            }}
            formatter={(value: number) => [
              metric === 'sharpeRatio' ? value.toFixed(2) : `${value.toFixed(1)}%`,
              metricLabel
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};