/**
 * Composite CSI Comparison Component
 * Compares composite CSI scores across multiple countries
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCountryShockIndex } from '@/data/globalCountries';

interface CompositeCSIComparisonProps {
  countries: string[];
  className?: string;
}

export function CompositeCSIComparison({ 
  countries, 
  className = '' 
}: CompositeCSIComparisonProps) {
  // Use getCountryShockIndex directly instead of hooks to avoid hook rules violations
  const results = countries.map(country => ({
    country,
    score: getCountryShockIndex(country),
    result: null
  }));

  const chartData = results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => ({
      country: r.country,
      score: r.score
    }));

  const getBarColor = (score: number) => {
    if (score >= 70) return '#ef4444'; // red
    if (score >= 50) return '#f97316'; // orange
    if (score >= 30) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Composite CSI Comparison</CardTitle>
        <CardDescription>
          Comparing {countries.length} countries across all risk vectors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="country" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Composite CSI', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number) => [value.toFixed(1), 'Composite CSI']}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {chartData.length > 0 ? Math.max(...chartData.map(d => d.score)).toFixed(1) : '-'}
            </div>
            <div className="text-sm text-gray-500">Highest Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {chartData.length > 0 
                ? (chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length).toFixed(1)
                : '-'}
            </div>
            <div className="text-sm text-gray-500">Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {chartData.length > 0 ? Math.min(...chartData.map(d => d.score)).toFixed(1) : '-'}
            </div>
            <div className="text-sm text-gray-500">Lowest Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}