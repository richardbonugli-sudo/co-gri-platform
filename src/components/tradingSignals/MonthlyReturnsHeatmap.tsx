/**
 * Monthly Returns Heatmap Component
 * 
 * Displays monthly returns in a heatmap format
 */

import React from 'react';
import type { MonthlyPerformance } from '@/services/tradingSignals/performanceAnalytics';

interface MonthlyReturnsHeatmapProps {
  data: MonthlyPerformance[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlyReturnsHeatmap: React.FC<MonthlyReturnsHeatmapProps> = ({ data }) => {
  // Group data by year
  const yearlyData = new Map<number, Map<number, number>>();
  
  for (const month of data) {
    if (!yearlyData.has(month.year)) {
      yearlyData.set(month.year, new Map());
    }
    yearlyData.get(month.year)!.set(month.month, month.return);
  }
  
  const years = Array.from(yearlyData.keys()).sort();
  
  const getColor = (value: number | undefined): string => {
    if (value === undefined) return '#1F2937';
    
    if (value > 0.10) return '#065F46'; // Dark green
    if (value > 0.05) return '#059669'; // Green
    if (value > 0.02) return '#10B981'; // Light green
    if (value > 0) return '#34D399'; // Very light green
    if (value > -0.02) return '#FCA5A5'; // Very light red
    if (value > -0.05) return '#F87171'; // Light red
    if (value > -0.10) return '#EF4444'; // Red
    return '#991B1B'; // Dark red
  };
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-semibold text-slate-300 border border-slate-700">Year</th>
              {MONTHS.map(month => (
                <th key={month} className="p-2 text-center text-sm font-semibold text-slate-300 border border-slate-700">
                  {month}
                </th>
              ))}
              <th className="p-2 text-center text-sm font-semibold text-slate-300 border border-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => {
              const monthData = yearlyData.get(year)!;
              const yearTotal = Array.from(monthData.values()).reduce((sum, ret) => sum + ret, 0);
              
              return (
                <tr key={year}>
                  <td className="p-2 text-sm font-medium text-slate-200 border border-slate-700">{year}</td>
                  {MONTHS.map((_, monthIndex) => {
                    const value = monthData.get(monthIndex);
                    return (
                      <td
                        key={monthIndex}
                        className="p-2 text-center text-sm border border-slate-700 transition-all hover:ring-2 hover:ring-cyan-400"
                        style={{ backgroundColor: getColor(value) }}
                      >
                        {value !== undefined ? `${(value * 100).toFixed(1)}%` : '-'}
                      </td>
                    );
                  })}
                  <td
                    className="p-2 text-center text-sm font-semibold border border-slate-700"
                    style={{ backgroundColor: getColor(yearTotal) }}
                  >
                    {(yearTotal * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <span>Color Scale:</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4" style={{ backgroundColor: '#991B1B' }}></div>
            <span>&lt; -10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4" style={{ backgroundColor: '#EF4444' }}></div>
            <span>-5% to -10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4" style={{ backgroundColor: '#1F2937' }}></div>
            <span>~0%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4" style={{ backgroundColor: '#10B981' }}></div>
            <span>2% to 5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4" style={{ backgroundColor: '#065F46' }}></div>
            <span>&gt; 10%</span>
          </div>
        </div>
      </div>
    </div>
  );
};