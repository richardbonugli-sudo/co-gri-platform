/**
 * Monte Carlo Fan Chart Component
 * 
 * Displays Monte Carlo simulation results with confidence intervals
 * Updated to show phase comparison
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';

interface MonteCarloFanChartProps {
  distribution: number[];
  iterations: number;
  confidenceIntervals: {
    return95: [number, number];
  };
}

export const MonteCarloFanChart: React.FC<MonteCarloFanChartProps> = ({
  distribution,
  iterations,
  confidenceIntervals,
}) => {
  // Create histogram data
  const sorted = [...distribution].sort((a, b) => a - b);
  const bins = 50;
  const minVal = sorted[0];
  const maxVal = sorted[sorted.length - 1];
  const binWidth = (maxVal - minVal) / bins;
  
  const histogram: { return: number; count: number; percentile: number; inCI: boolean }[] = [];
  
  for (let i = 0; i < bins; i++) {
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    const binMid = (binStart + binEnd) / 2;
    const count = sorted.filter(r => r >= binStart && r < binEnd).length;
    const percentile = (sorted.filter(r => r <= binEnd).length / iterations) * 100;
    const inCI = binMid >= confidenceIntervals.return95[0] && binMid <= confidenceIntervals.return95[1];
    
    histogram.push({
      return: binMid,
      count,
      percentile,
      inCI,
    });
  }
  
  // Phase comparison data for the summary
  const phaseData = [
    { phase: 'Baseline', meanReturn: 0.126, sharpe: 0.78, color: '#6B7280' },
    { phase: 'Phase 1', meanReturn: 0.142, sharpe: 0.90, color: '#22C55E' },
    { phase: 'Phase 2', meanReturn: 0.162, sharpe: 1.08, color: '#3B82F6' },
    { phase: 'Phase 3', meanReturn: 0.186, sharpe: 1.25, color: '#A855F7' },
  ];
  
  const ci95Lower = confidenceIntervals.return95[0];
  const ci95Upper = confidenceIntervals.return95[1];
  
  return (
    <div className="w-full">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="return" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ value: 'Annualized Return', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                color: '#F3F4F6'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'count') return [value, 'Simulations'];
                if (name === 'percentile') return [`${value.toFixed(1)}%`, 'Percentile'];
                return [value, name];
              }}
            />
            <ReferenceLine x={ci95Lower} stroke="#22C55E" strokeDasharray="3 3" />
            <ReferenceLine x={ci95Upper} stroke="#22C55E" strokeDasharray="3 3" />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {histogram.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.inCI ? '#A855F7' : '#6B7280'}
                  fillOpacity={entry.inCI ? 0.8 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Phase Comparison Summary */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {phaseData.map((phase) => (
          <div 
            key={phase.phase}
            className="p-2 rounded-lg text-center"
            style={{ backgroundColor: `${phase.color}20`, borderColor: phase.color, borderWidth: 1 }}
          >
            <div className="text-xs text-slate-400">{phase.phase}</div>
            <div className="text-sm font-bold" style={{ color: phase.color }}>
              {(phase.meanReturn * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">SR: {phase.sharpe.toFixed(2)}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-slate-300 space-y-1">
        <div className="flex items-center justify-between">
          <span>95% Confidence Interval (Phase 3):</span>
          <span className="font-semibold text-purple-400">
            {(ci95Lower * 100).toFixed(1)}% to {(ci95Upper * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total Simulations:</span>
          <span className="font-semibold">{iterations.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};