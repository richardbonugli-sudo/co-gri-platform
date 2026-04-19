/**
 * Global Risk Index Component (Enhanced with GDP-Weighted CSI)
 * Displays global average CSI score with dual-metric system:
 * - GDP-Weighted CSI (Primary): Economically meaningful global risk
 * - Equal-Weighted CSI (Secondary): Simple average for comparison
 * 
 * Phase 4: GDP-Weighted Implementation
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Globe, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { compositeCalculator } from '@/services/csi/compositeCalculator';
import type { GlobalCSIResult, MetricType } from '@/types/gdp.types';

interface GlobalRiskIndexProps {
  timeWindow?: '7D' | '30D' | '90D' | '12M';
}

export const GlobalRiskIndex: React.FC<GlobalRiskIndexProps> = ({
  timeWindow = '30D'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('gdp-weighted');
  const [showComparison, setShowComparison] = useState(true);
  const [showContributors, setShowContributors] = useState(false);

  // Calculate both GDP-weighted and equal-weighted metrics
  const globalData = useMemo((): GlobalCSIResult => {
    return compositeCalculator.calculateGDPWeightedGlobalCSI(new Date(), timeWindow);
  }, [timeWindow]);

  // Determine which metric to display as primary
  const primaryCSI = selectedMetric === 'gdp-weighted' 
    ? globalData.gdp_weighted_csi 
    : globalData.equal_weighted_csi;
  const primaryChange = selectedMetric === 'gdp-weighted'
    ? globalData.gdp_weighted_change
    : globalData.equal_weighted_change;
  const primaryDirection = selectedMetric === 'gdp-weighted'
    ? globalData.gdp_weighted_direction
    : globalData.equal_weighted_direction;

  function getDirectionIcon(direction: string) {
    if (direction === 'Increasing') {
      return <TrendingUp className="h-5 w-5 text-red-400" />;
    } else if (direction === 'Decreasing') {
      return <TrendingDown className="h-5 w-5 text-green-400" />;
    }
    return <Minus className="h-5 w-5 text-gray-400" />;
  }

  function getDirectionColor(direction: string) {
    if (direction === 'Increasing') return 'text-red-400';
    if (direction === 'Decreasing') return 'text-green-400';
    return 'text-gray-400';
  }

  function getRiskLevel(csi: number): string {
    if (csi >= 70) return 'Critical';
    if (csi >= 50) return 'High';
    if (csi >= 30) return 'Moderate';
    return 'Low';
  }

  function getRiskBadgeColor(csi: number): string {
    if (csi >= 70) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (csi >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (csi >= 30) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardContent className="p-6">
        {/* Header with Metric Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#0d5f5f]/30 p-3 rounded-lg">
              <Globe className="h-6 w-6 text-[#7fa89f]" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Global Risk Index</p>
              <p className="text-xs text-gray-500">{globalData.total_countries} countries • {globalData.gdp_data_year} GDP data</p>
            </div>
          </div>

          {/* Metric Toggle */}
          <div className="flex gap-2">
            <Button
              variant={selectedMetric === 'gdp-weighted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('gdp-weighted')}
              className={selectedMetric === 'gdp-weighted' 
                ? 'bg-[#0d5f5f] hover:bg-[#0d5f5f]/80 text-white border-[#0d5f5f]' 
                : 'bg-transparent hover:bg-[#0d5f5f]/20 text-gray-400 border-[#0d5f5f]/30'}
            >
              GDP-Weighted
            </Button>
            <Button
              variant={selectedMetric === 'equal-weighted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('equal-weighted')}
              className={selectedMetric === 'equal-weighted'
                ? 'bg-[#0d5f5f] hover:bg-[#0d5f5f]/80 text-white border-[#0d5f5f]'
                : 'bg-transparent hover:bg-[#0d5f5f]/20 text-gray-400 border-[#0d5f5f]/30'}
            >
              Equal-Weighted
            </Button>
          </div>
        </div>

        {/* Primary Metric Display */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Metric Label */}
          <div>
            <p className="text-gray-400 text-sm mb-1">
              {selectedMetric === 'gdp-weighted' ? 'GDP-Weighted CSI' : 'Equal-Weighted CSI'}
            </p>
            <p className="text-xs text-gray-500">
              {selectedMetric === 'gdp-weighted' 
                ? `${globalData.gdp_coverage.toFixed(1)}% GDP coverage`
                : 'Simple arithmetic mean'}
            </p>
          </div>

          {/* Center: CSI Score */}
          <div className="text-center">
            <p className="text-6xl font-bold text-white mb-2 tracking-tight">
              {primaryCSI.toFixed(1)}
            </p>
            <Badge 
              variant="outline" 
              className={`text-sm font-semibold ${getRiskBadgeColor(primaryCSI)}`}
            >
              {getRiskLevel(primaryCSI)}
            </Badge>
          </div>

          {/* Right: Change and Direction */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              {getDirectionIcon(primaryDirection)}
              <span className={`text-4xl font-bold ${getDirectionColor(primaryDirection)} tracking-tight`}>
                {primaryChange > 0 ? '+' : ''}{primaryChange.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  primaryDirection === 'Increasing' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  primaryDirection === 'Decreasing' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {primaryDirection}
              </Badge>
              <span className="text-xs text-gray-500">({timeWindow})</span>
            </div>
          </div>
        </div>

        {/* Metric Comparison Section */}
        {showComparison && (
          <div className="border-t border-[#0d5f5f]/30 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-400 font-medium">Metric Comparison</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(false)}
                className="text-gray-500 hover:text-gray-300 h-6 px-2"
              >
                Hide
              </Button>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-3 mb-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>GDP-Weighted</span>
                  <span className="font-semibold text-white">{globalData.gdp_weighted_csi.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-[#0d5f5f]/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0d5f5f] rounded-full transition-all duration-500"
                    style={{ width: `${globalData.gdp_weighted_csi}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Equal-Weighted</span>
                  <span className="font-semibold text-white">{globalData.equal_weighted_csi.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-gray-500/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-500 rounded-full transition-all duration-500"
                    style={{ width: `${globalData.equal_weighted_csi}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Delta Interpretation */}
            <div className="bg-[#0d5f5f]/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Delta</span>
                <span className={`text-sm font-bold ${
                  globalData.metric_delta > 0 ? 'text-red-400' : 
                  globalData.metric_delta < 0 ? 'text-green-400' : 
                  'text-gray-400'
                }`}>
                  {globalData.metric_delta > 0 ? '+' : ''}{globalData.metric_delta.toFixed(1)} 
                  <span className="text-xs ml-1">({globalData.delta_percentage > 0 ? '+' : ''}{globalData.delta_percentage.toFixed(1)}%)</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {globalData.delta_interpretation}
              </p>
            </div>
          </div>
        )}

        {/* Top Contributors Section */}
        <div className="border-t border-[#0d5f5f]/30 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400 font-medium">Top Risk Contributors</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContributors(!showContributors)}
              className="text-gray-500 hover:text-gray-300 h-6 px-2"
            >
              {showContributors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {showContributors && (
            <div className="space-y-2">
              {globalData.top_contributors.map((contributor, index) => (
                <div 
                  key={contributor.country}
                  className="bg-[#0d5f5f]/10 rounded-lg p-3 hover:bg-[#0d5f5f]/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-semibold text-white">{contributor.country}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]/30">
                      {contributor.gdp_weight_percentage} GDP
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">CSI: <span className="text-white font-semibold">{contributor.csi}</span></span>
                    <span className="text-gray-400">Contribution: <span className="text-white font-semibold">{contributor.contribution_percentage}</span></span>
                  </div>
                  <div className="mt-2 h-1 bg-[#0d5f5f]/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#7fa89f] rounded-full"
                      style={{ width: contributor.contribution_percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Data Vintage Footer */}
        <div className="border-t border-[#0d5f5f]/30 pt-3 mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Data: {globalData.gdp_data_year} PPP GDP (World Bank)</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                globalData.data_quality.gdp_data_confidence === 'High' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : globalData.data_quality.gdp_data_confidence === 'Medium'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {globalData.data_quality.gdp_data_confidence} Confidence
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalRiskIndex;