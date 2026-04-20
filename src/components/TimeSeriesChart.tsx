/**
 * Phase 5D-4: Time Series Chart Component
 * 
 * Displays COGRI forecasts across multiple time horizons
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import type { TimeSeriesForecast } from '@/types/forecast.types';

interface TimeSeriesChartProps {
  forecast: TimeSeriesForecast;
  className?: string;
}

export function TimeSeriesChart({ forecast, className = '' }: TimeSeriesChartProps) {
  const timePoints = [
    { label: 'Current', value: forecast.forecasts['6m'].currentScore, horizon: null },
    { label: '6M', value: forecast.forecasts['6m'].predictedScore, horizon: '6m' },
    { label: '1Y', value: forecast.forecasts['1y'].predictedScore, horizon: '1y' },
    { label: '2Y', value: forecast.forecasts['2y'].predictedScore, horizon: '2y' },
    { label: '5Y', value: forecast.forecasts['5y'].predictedScore, horizon: '5y' }
  ];

  const maxValue = Math.max(...timePoints.map(p => p.value));
  const minValue = Math.min(...timePoints.map(p => p.value));
  const range = maxValue - minValue;
  const chartHeight = 200;

  const getYPosition = (value: number) => {
    if (range === 0) return chartHeight / 2;
    return chartHeight - ((value - minValue) / range) * chartHeight;
  };

  const getTrendIcon = () => {
    switch (forecast.trendDirection) {
      case 'IMPROVING':
        return <TrendingDown className="h-5 w-5 text-green-600" />;
      case 'DETERIORATING':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (forecast.trendDirection) {
      case 'IMPROVING':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'DETERIORATING':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getVolatilityColor = (volatility: number) => {
    if (volatility > 20) return 'text-red-600';
    if (volatility > 10) return 'text-orange-600';
    if (volatility > 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVolatilityLabel = (volatility: number) => {
    if (volatility > 20) return 'Very High';
    if (volatility > 10) return 'High';
    if (volatility > 5) return 'Moderate';
    return 'Low';
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.8) return 'text-green-600';
    if (reliability >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Generate SVG path for the line chart
  const generatePath = () => {
    const points = timePoints.map((point, index) => {
      const x = (index / (timePoints.length - 1)) * 100;
      const y = (getYPosition(point.value) / chartHeight) * 100;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Time Series Forecast</CardTitle>
            <CardDescription>
              {forecast.companyName} ({forecast.ticker})
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <Badge className={getTrendColor()}>
              {forecast.trendDirection}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="relative" style={{ height: `${chartHeight}px` }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0"
            >
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.2"
                />
              ))}

              {/* Risk zones */}
              <rect x="0" y="0" width="100" height="30" fill="#fee2e2" opacity="0.3" />
              <rect x="0" y="30" width="100" height="25" fill="#fed7aa" opacity="0.3" />
              <rect x="0" y="55" width="100" height="25" fill="#fef3c7" opacity="0.3" />
              <rect x="0" y="80" width="100" height="20" fill="#d1fae5" opacity="0.3" />

              {/* Forecast line */}
              <path
                d={generatePath()}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />

              {/* Data points */}
              {timePoints.map((point, index) => {
                const x = (index / (timePoints.length - 1)) * 100;
                const y = (getYPosition(point.value) / chartHeight) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1"
                    fill={index === 0 ? '#6b7280' : '#3b82f6'}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
              {timePoints.map((point, index) => (
                <div key={index} className="text-xs text-gray-600 text-center">
                  <div className="font-medium">{point.label}</div>
                  <div className="text-gray-500">{point.value.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {/* Volatility */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-600">Volatility</span>
              </div>
              <div className={`text-2xl font-bold ${getVolatilityColor(forecast.volatilityIndex)}`}>
                {forecast.volatilityIndex.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getVolatilityLabel(forecast.volatilityIndex)}
              </div>
            </div>

            {/* Reliability */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Reliability</div>
              <div className={`text-2xl font-bold ${getReliabilityColor(forecast.forecastReliability)}`}>
                {(forecast.forecastReliability * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Forecast Quality
              </div>
            </div>

            {/* Range */}
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">5Y Range</div>
              <div className="text-2xl font-bold text-gray-900">
                {(maxValue - minValue).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {minValue.toFixed(1)} - {maxValue.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Confidence by Horizon */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Confidence by Time Horizon</div>
            <div className="space-y-1">
              {Object.entries(forecast.forecasts).map(([horizon, data]) => (
                <div key={horizon} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{horizon.toUpperCase()}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${data.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-700 font-medium w-12 text-right">
                      {(data.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}