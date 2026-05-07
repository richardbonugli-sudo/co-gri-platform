/**
 * Regional Risk Panel Component
 * Shows risk aggregation by region with enhanced map integration
 * Phase 3: Visual Polish - Standardized spacing, colors, and typography
 * ENHANCED: Regional highlighting based on selected country
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Globe } from 'lucide-react';

interface RegionalRiskPanelProps {
  title?: string;
  selectedCountry?: string | null;
  onRegionClick?: (region: string) => void;
  onRegionHover?: (region: string | null) => void;
}

// Country to region mapping for highlighting
const COUNTRY_TO_REGION_MAP: Record<string, string> = {
  // North America
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  
  // Middle East
  'Turkey': 'Middle East',
  'Saudi Arabia': 'Middle East',
  'United Arab Emirates': 'Middle East',
  'Israel': 'Middle East',
  'Iran': 'Middle East',
  'Iraq': 'Middle East',
  'Syria': 'Middle East',
  'Lebanon': 'Middle East',
  'Jordan': 'Middle East',
  'Kuwait': 'Middle East',
  'Qatar': 'Middle East',
  'Bahrain': 'Middle East',
  'Oman': 'Middle East',
  'Yemen': 'Middle East',
  'Palestine': 'Middle East',
  'Cyprus': 'Middle East',
  
  // Eastern Europe
  'Poland': 'Eastern Europe',
  'Czech Republic': 'Eastern Europe',
  'Hungary': 'Eastern Europe',
  'Romania': 'Eastern Europe',
  'Bulgaria': 'Eastern Europe',
  'Slovakia': 'Eastern Europe',
  'Croatia': 'Eastern Europe',
  'Serbia': 'Eastern Europe',
  'Slovenia': 'Eastern Europe',
  'Lithuania': 'Eastern Europe',
  'Latvia': 'Eastern Europe',
  'Estonia': 'Eastern Europe',
  'Ukraine': 'Eastern Europe',
  'Belarus': 'Eastern Europe',
  'Bosnia and Herzegovina': 'Eastern Europe',
  'Albania': 'Eastern Europe',
  'North Macedonia': 'Eastern Europe',
  'Montenegro': 'Eastern Europe',
  'Kosovo': 'Eastern Europe',
  
  // Western Europe
  'United Kingdom': 'Western Europe',
  'Germany': 'Western Europe',
  'France': 'Western Europe',
  'Italy': 'Western Europe',
  'Spain': 'Western Europe',
  'Netherlands': 'Western Europe',
  'Belgium': 'Western Europe',
  'Switzerland': 'Western Europe',
  'Austria': 'Western Europe',
  'Sweden': 'Western Europe',
  'Norway': 'Western Europe',
  'Denmark': 'Western Europe',
  'Finland': 'Western Europe',
  'Ireland': 'Western Europe',
  'Portugal': 'Western Europe',
  'Greece': 'Western Europe',
  'Luxembourg': 'Western Europe',
  'Iceland': 'Western Europe',
  'Malta': 'Western Europe',
  
  // Asia Pacific
  'China': 'Asia Pacific',
  'Japan': 'Asia Pacific',
  'South Korea': 'Asia Pacific',
  'Taiwan': 'Asia Pacific',
  'Singapore': 'Asia Pacific',
  'Thailand': 'Asia Pacific',
  'Malaysia': 'Asia Pacific',
  'Indonesia': 'Asia Pacific',
  'Philippines': 'Asia Pacific',
  'Vietnam': 'Asia Pacific',
  'India': 'Asia Pacific',
  'Australia': 'Asia Pacific',
  'New Zealand': 'Asia Pacific',
  'Pakistan': 'Asia Pacific',
  'Bangladesh': 'Asia Pacific',
  
  // Latin America
  'Brazil': 'Latin America',
  'Argentina': 'Latin America',
  'Chile': 'Latin America',
  'Colombia': 'Latin America',
  'Peru': 'Latin America',
  'Venezuela': 'Latin America',
  'Ecuador': 'Latin America',
  'Bolivia': 'Latin America',
  'Paraguay': 'Latin America',
  'Uruguay': 'Latin America',
  
  // Africa
  'South Africa': 'Africa',
  'Nigeria': 'Africa',
  'Kenya': 'Africa',
  'Ethiopia': 'Africa',
  'Ghana': 'Africa',
  'Egypt': 'Africa',
  'Morocco': 'Africa',
  'Algeria': 'Africa',
  'Tunisia': 'Africa',
};

export const RegionalRiskPanel: React.FC<RegionalRiskPanelProps> = ({
  title = "Regional Risk Overview",
  selectedCountry,
  onRegionClick,
  onRegionHover
}) => {
  // Determine which region should be highlighted
  const highlightedRegion = selectedCountry ? COUNTRY_TO_REGION_MAP[selectedCountry] : null;

  // Regional data (in production, this would come from aggregated CSI data)
  const regions = [
    {
      name: 'Middle East',
      avgCSI: 68.5,
      trend: 'up',
      change: '+3.2',
      countries: 15,
      criticalCount: 5,
      color: 'bg-red-500',
      description: 'Ongoing conflicts and geopolitical tensions'
    },
    {
      name: 'Eastern Europe',
      avgCSI: 62.3,
      trend: 'up',
      change: '+2.1',
      countries: 12,
      criticalCount: 3,
      color: 'bg-orange-500',
      description: 'Ukraine conflict and regional instability'
    },
    {
      name: 'Asia Pacific',
      avgCSI: 45.7,
      trend: 'stable',
      change: '+0.3',
      countries: 25,
      criticalCount: 2,
      color: 'bg-yellow-500',
      description: 'Mixed risk profile across diverse economies'
    },
    {
      name: 'Latin America',
      avgCSI: 42.1,
      trend: 'down',
      change: '-1.5',
      countries: 18,
      criticalCount: 1,
      color: 'bg-yellow-500',
      description: 'Improving governance in key markets'
    },
    {
      name: 'Africa',
      avgCSI: 51.8,
      trend: 'up',
      change: '+1.8',
      countries: 35,
      criticalCount: 4,
      color: 'bg-orange-500',
      description: 'Varied risk across sub-regions'
    },
    {
      name: 'North America',
      avgCSI: 28.4,
      trend: 'stable',
      change: '-0.2',
      countries: 3,
      criticalCount: 0,
      color: 'bg-green-500',
      description: 'Stable institutional environment'
    },
    {
      name: 'Western Europe',
      avgCSI: 32.6,
      trend: 'down',
      change: '-0.8',
      countries: 20,
      criticalCount: 0,
      color: 'bg-green-500',
      description: 'Strong governance and low conflict risk'
    }
  ];

  function getTrendIcon(trend: string) {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  }

  function getRiskLevel(csi: number): string {
    if (csi >= 70) return 'Critical';
    if (csi >= 50) return 'High';
    if (csi >= 30) return 'Moderate';
    return 'Low';
  }

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-[#7fa89f]" />
          <CardTitle className="text-white text-lg font-semibold">{title}</CardTitle>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Average CSI scores by geographic region
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {regions
            .sort((a, b) => b.avgCSI - a.avgCSI)
            .map((region, index) => {
              const isHighlighted = highlightedRegion === region.name;
              
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg transition-all cursor-pointer group ${
                    isHighlighted
                      ? 'bg-[#0d5f5f]/30 border-2 border-[#7fa89f] shadow-lg shadow-[#7fa89f]/20'
                      : 'bg-[#0a0f0d] border border-[#0d5f5f]/20 hover:border-[#0d5f5f]'
                  }`}
                  onClick={() => onRegionClick?.(region.name)}
                  onMouseEnter={() => onRegionHover?.(region.name)}
                  onMouseLeave={() => onRegionHover?.(null)}
                >
                  {/* Region Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${region.color} ${isHighlighted ? 'ring-2 ring-[#7fa89f] ring-offset-2 ring-offset-[#0d1512]' : ''}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold transition-colors ${
                            isHighlighted ? 'text-[#7fa89f] text-base' : 'text-white group-hover:text-[#7fa89f]'
                          }`}>
                            {region.name}
                          </p>
                          {isHighlighted && (
                            <Badge variant="outline" className="text-xs bg-[#7fa89f]/20 text-[#7fa89f] border-[#7fa89f]">
                              Selected Country Region
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {region.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-3xl font-bold ${isHighlighted ? 'text-[#7fa89f]' : 'text-white'}`}>
                        {region.avgCSI.toFixed(1)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {getTrendIcon(region.trend)}
                        <span className={`text-xs ${
                          region.trend === 'up' ? 'text-red-400' : 
                          region.trend === 'down' ? 'text-green-400' : 
                          'text-gray-400'
                        }`}>
                          {region.change}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={region.avgCSI} 
                      className="h-2"
                      style={{
                        background: isHighlighted ? 'rgba(127, 168, 159, 0.2)' : 'rgba(13, 95, 95, 0.2)'
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            region.avgCSI >= 70 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            region.avgCSI >= 50 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            region.avgCSI >= 30 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-green-500/20 text-green-400 border-green-500/30'
                          }`}
                        >
                          {getRiskLevel(region.avgCSI)}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {region.countries} countries
                        </span>
                      </div>
                      {region.criticalCount > 0 && (
                        <span className="text-xs text-red-400">
                          {region.criticalCount} critical
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-xs mb-1">Avg Global CSI</p>
            <p className="text-white text-2xl font-bold">
              {(regions.reduce((sum, r) => sum + r.avgCSI, 0) / regions.length).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Total Countries</p>
            <p className="text-white text-2xl font-bold">
              {regions.reduce((sum, r) => sum + r.countries, 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Critical Risk</p>
            <p className="text-red-400 text-2xl font-bold">
              {regions.reduce((sum, r) => sum + r.criticalCount, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegionalRiskPanel;