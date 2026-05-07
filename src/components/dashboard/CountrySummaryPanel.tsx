/**
 * Country Summary Panel Component (Component 2)
 * Two modes: Global Summary (default) or Country Focus (when selected)
 * Phase 3: Visual Polish - Standardized spacing, colors, and typography
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, MapPin, Globe, X } from 'lucide-react';
import { GLOBAL_COUNTRIES, getCountryShockIndex } from '@/data/globalCountries';

interface CountrySummaryPanelProps {
  selectedCountry?: string | null;
  timeWindow?: '7D' | '30D' | '90D' | '12M';
  onClearSelection?: () => void;
}

export const CountrySummaryPanel: React.FC<CountrySummaryPanelProps> = ({
  selectedCountry,
  timeWindow = '30D',
  onClearSelection
}) => {
  // Calculate country-specific or global data
  const summaryData = useMemo(() => {
    if (!selectedCountry) {
      // Global Summary Mode - FIXED: Now uses composite CSI (baseline + events)
      const compositeCsiValues = GLOBAL_COUNTRIES.map(country => 
        getCountryShockIndex(country.country)
      );
      const totalCSI = compositeCsiValues.reduce((sum, csi) => sum + csi, 0);
      const avgCSI = totalCSI / compositeCsiValues.length;
      
      const highRiskCount = compositeCsiValues.filter(csi => csi >= 70).length;
      const elevatedRiskCount = compositeCsiValues.filter(csi => csi >= 50 && csi < 70).length;
      const moderateRiskCount = compositeCsiValues.filter(csi => csi >= 30 && csi < 50).length;
      const lowRiskCount = compositeCsiValues.filter(csi => csi < 30).length;
      
      return {
        mode: 'global' as const,
        avgCSI: avgCSI.toFixed(1),
        totalCountries: GLOBAL_COUNTRIES.length,
        highRiskCount,
        elevatedRiskCount,
        moderateRiskCount,
        lowRiskCount
      };
    } else {
      // Country Focus Mode
      const csi = getCountryShockIndex(selectedCountry);
      const countryData = GLOBAL_COUNTRIES.find(c => c.country === selectedCountry);
      
      // Calculate global rank
      const sortedCountries = [...GLOBAL_COUNTRIES].sort((a, b) => b.csi - a.csi);
      const rank = sortedCountries.findIndex(c => c.country === selectedCountry) + 1;
      
      // Simulate historical change based on time window
      const changeMap = {
        '7D': (Math.random() * 4 - 2).toFixed(1),
        '30D': (Math.random() * 6 - 3).toFixed(1),
        '90D': (Math.random() * 8 - 4).toFixed(1),
        '12M': (Math.random() * 10 - 5).toFixed(1)
      };
      
      const change = parseFloat(changeMap[timeWindow]);
      
      // Determine direction
      let direction: 'Increasing' | 'Decreasing' | 'Stable';
      if (change > 2) {
        direction = 'Increasing';
      } else if (change < -2) {
        direction = 'Decreasing';
      } else {
        direction = 'Stable';
      }
      
      return {
        mode: 'country' as const,
        country: selectedCountry,
        csi: csi.toFixed(1),
        change: change.toFixed(1),
        direction,
        rank,
        totalCountries: GLOBAL_COUNTRIES.length,
        region: countryData?.region || 'Unknown',
        incomeLevel: countryData?.incomeLevel || 'Unknown'
      };
    }
  }, [selectedCountry, timeWindow]);

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

  function getDirectionIcon(direction: string) {
    if (direction === 'Increasing') return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (direction === 'Decreasing') return <TrendingDown className="h-4 w-4 text-green-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  }

  function getDirectionColor(direction: string) {
    if (direction === 'Increasing') return 'text-red-400';
    if (direction === 'Decreasing') return 'text-green-400';
    return 'text-gray-400';
  }

  if (summaryData.mode === 'global') {
    // Global Summary Mode
    return (
      <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">Global Summary</CardTitle>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Overview of global geopolitical risk landscape
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Global Average CSI */}
          <div className="mb-6 p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
            <p className="text-gray-400 text-sm font-medium mb-2">Average Global CSI</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-bold text-white">
                {summaryData.avgCSI}
              </p>
              <Badge 
                variant="outline" 
                className={`${getRiskBadgeColor(parseFloat(summaryData.avgCSI))}`}
              >
                {getRiskLevel(parseFloat(summaryData.avgCSI))}
              </Badge>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="space-y-3">
            <p className="text-gray-400 text-sm font-semibold mb-3">Risk Distribution</p>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Critical (70-100)</span>
              </div>
              <span className="text-red-400 font-bold">{summaryData.highRiskCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">High (50-69)</span>
              </div>
              <span className="text-orange-400 font-bold">{summaryData.elevatedRiskCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Moderate (30-49)</span>
              </div>
              <span className="text-yellow-400 font-bold">{summaryData.moderateRiskCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Low (0-29)</span>
              </div>
              <span className="text-green-400 font-bold">{summaryData.lowRiskCount}</span>
            </div>
          </div>

          {/* Total Countries */}
          <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30 text-center">
            <p className="text-gray-400 text-sm">
              Monitoring <span className="text-white font-bold">{summaryData.totalCountries}</span> countries worldwide
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // Country Focus Mode
    return (
      <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#7fa89f]" />
              <CardTitle className="text-white text-lg font-semibold">Country Focus</CardTitle>
            </div>
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-gray-400 hover:text-white h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Country Name */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">{summaryData.country}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
                {summaryData.region}
              </Badge>
              <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
                {summaryData.incomeLevel} Income
              </Badge>
            </div>
          </div>

          {/* CSI Score - Enhanced Typography */}
          <div className="mb-6 p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
            <p className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Country Shock Index (CSI)</p>
            <div className="flex items-center justify-between mb-3">
              <p className="text-6xl font-bold text-white tracking-tight">
                {summaryData.csi}
              </p>
              <Badge 
                variant="outline" 
                className={`text-sm ${getRiskBadgeColor(parseFloat(summaryData.csi))}`}
              >
                {getRiskLevel(parseFloat(summaryData.csi))}
              </Badge>
            </div>
            
            {/* Change and Direction - Enhanced Typography */}
            <div className="flex items-center justify-between pt-3 border-t border-[#0d5f5f]/20">
              <div className="flex items-center gap-2">
                {getDirectionIcon(summaryData.direction)}
                <span className={`text-2xl font-bold ${getDirectionColor(summaryData.direction)} tracking-tight`}>
                  {parseFloat(summaryData.change) > 0 ? '+' : ''}{summaryData.change}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  summaryData.direction === 'Increasing' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  summaryData.direction === 'Decreasing' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {summaryData.direction}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">Change over {timeWindow}</p>
          </div>

          {/* Global Rank - Enhanced Typography */}
          <div className="p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
            <p className="text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">Global Risk Ranking</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-4xl font-bold text-white tracking-tight">#{summaryData.rank}</span>
                <span className="text-gray-500 text-sm ml-2 font-medium">of {summaryData.totalCountries}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  summaryData.rank <= 10 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  summaryData.rank <= 50 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {summaryData.rank <= 10 ? 'Top 10' : summaryData.rank <= 50 ? 'Top 50' : 'Lower Risk'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default CountrySummaryPanel;