/**
 * Country Comparison Panel Component
 * Priority 1C - Staged Rollout Implementation
 * ENHANCED: Added CSV export functionality
 * 
 * Dual Mode Operation:
 * - Global Mode: Top 10 highest CSI countries globally
 * - Country Focus Mode: Peer countries based on income, structure, and alignment
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Globe,
  ChevronRight,
  Download
} from 'lucide-react';
import { GLOBAL_COUNTRIES, getCountryData, getCountryShockIndex } from '@/data/globalCountries';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import type { TimeWindow } from '@/store/globalDashboardState';
import { downloadCSV, formatDateForFilename, formatDateTime, sanitizeFilename } from '@/utils/exportUtils';

interface CountryComparisonProps {
  selectedCountry?: string | null;
  timeWindow?: TimeWindow;
}

interface CountryComparisonData {
  country: string;
  csi: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  rank: number;
  region: string;
}

// Comprehensive peer mapping based on:
// - Geographic region
// - Income classification (World Bank)
// - Economic structure
// - Geopolitical alignment
const COUNTRY_PEERS: Record<string, string[]> = {
  // G7 Advanced Economies
  'United States': ['Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia', 'Netherlands', 'Switzerland'],
  'Canada': ['United States', 'United Kingdom', 'Australia', 'Germany', 'France', 'Netherlands', 'Norway', 'Sweden'],
  'United Kingdom': ['United States', 'Canada', 'Germany', 'France', 'Australia', 'Netherlands', 'Ireland', 'Singapore'],
  'Germany': ['United Kingdom', 'France', 'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Sweden', 'Denmark'],
  'France': ['Germany', 'United Kingdom', 'Italy', 'Spain', 'Belgium', 'Netherlands', 'Switzerland', 'Canada'],
  'Italy': ['France', 'Spain', 'Germany', 'United Kingdom', 'Netherlands', 'Belgium', 'Portugal', 'Greece'],
  'Japan': ['South Korea', 'Singapore', 'Taiwan', 'Australia', 'United States', 'Germany', 'United Kingdom', 'Canada'],
  
  // Asia-Pacific Advanced
  'Australia': ['Canada', 'United Kingdom', 'New Zealand', 'Singapore', 'United States', 'Japan', 'Netherlands', 'Norway'],
  'New Zealand': ['Australia', 'Canada', 'Singapore', 'Ireland', 'Norway', 'Denmark', 'Switzerland', 'Netherlands'],
  'Singapore': ['Hong Kong', 'United Arab Emirates', 'Switzerland', 'Luxembourg', 'Ireland', 'Netherlands', 'Qatar', 'Japan'],
  'South Korea': ['Japan', 'Taiwan', 'Singapore', 'Israel', 'Spain', 'Italy', 'Poland', 'Czech Republic'],
  'Taiwan': ['South Korea', 'Japan', 'Singapore', 'Israel', 'Malaysia', 'Thailand', 'Poland', 'Czech Republic'],
  
  // Large Emerging Economies (BRICS+)
  'China': ['India', 'Russia', 'Brazil', 'Indonesia', 'Mexico', 'Turkey', 'Saudi Arabia', 'Iran'],
  'India': ['China', 'Indonesia', 'Brazil', 'Mexico', 'Turkey', 'Nigeria', 'Bangladesh', 'Pakistan'],
  'Russia': ['China', 'India', 'Turkey', 'Iran', 'Kazakhstan', 'Saudi Arabia', 'Brazil', 'Mexico'],
  'Brazil': ['Mexico', 'Argentina', 'Colombia', 'Chile', 'India', 'Indonesia', 'Turkey', 'South Africa'],
  'South Africa': ['Brazil', 'Nigeria', 'Egypt', 'Turkey', 'Argentina', 'Colombia', 'Kenya', 'Ghana'],
  
  // Latin America
  'Mexico': ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Turkey', 'Poland', 'Thailand'],
  'Argentina': ['Brazil', 'Mexico', 'Colombia', 'Chile', 'Peru', 'Turkey', 'South Africa', 'Egypt'],
  'Colombia': ['Mexico', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Philippines', 'Thailand', 'Vietnam'],
  'Chile': ['Argentina', 'Colombia', 'Peru', 'Mexico', 'Uruguay', 'Costa Rica', 'Panama', 'Poland'],
  'Peru': ['Colombia', 'Chile', 'Ecuador', 'Bolivia', 'Philippines', 'Vietnam', 'Morocco', 'Egypt'],
  
  // Middle East
  'Saudi Arabia': ['United Arab Emirates', 'Qatar', 'Kuwait', 'Russia', 'Iran', 'Turkey', 'Egypt', 'Indonesia'],
  'United Arab Emirates': ['Saudi Arabia', 'Qatar', 'Singapore', 'Kuwait', 'Bahrain', 'Oman', 'Turkey', 'Malaysia'],
  'Turkey': ['Russia', 'Iran', 'Saudi Arabia', 'Egypt', 'Indonesia', 'Mexico', 'Poland', 'South Africa'],
  'Iran': ['Turkey', 'Russia', 'Saudi Arabia', 'Iraq', 'Pakistan', 'Egypt', 'Algeria', 'Venezuela'],
  'Israel': ['Singapore', 'South Korea', 'Taiwan', 'United Arab Emirates', 'Cyprus', 'Greece', 'Czech Republic', 'Estonia'],
  
  // Southeast Asia
  'Indonesia': ['India', 'Brazil', 'Mexico', 'Turkey', 'Philippines', 'Vietnam', 'Thailand', 'Nigeria'],
  'Thailand': ['Malaysia', 'Vietnam', 'Philippines', 'Indonesia', 'Colombia', 'Peru', 'Egypt', 'Morocco'],
  'Vietnam': ['Thailand', 'Philippines', 'Indonesia', 'Malaysia', 'Bangladesh', 'Egypt', 'Morocco', 'Kenya'],
  'Philippines': ['Indonesia', 'Vietnam', 'Thailand', 'Colombia', 'Peru', 'Egypt', 'Morocco', 'Kenya'],
  'Malaysia': ['Thailand', 'Indonesia', 'Singapore', 'Vietnam', 'Philippines', 'Chile', 'Poland', 'Czech Republic'],
  
  // Europe Emerging
  'Poland': ['Czech Republic', 'Hungary', 'Romania', 'Slovakia', 'Chile', 'Malaysia', 'South Korea', 'Turkey'],
  'Czech Republic': ['Poland', 'Slovakia', 'Hungary', 'Slovenia', 'Estonia', 'South Korea', 'Israel', 'Chile'],
  'Hungary': ['Poland', 'Czech Republic', 'Romania', 'Slovakia', 'Croatia', 'Serbia', 'Turkey', 'Bulgaria'],
  'Romania': ['Poland', 'Hungary', 'Bulgaria', 'Serbia', 'Croatia', 'Turkey', 'Ukraine', 'Greece'],
  
  // Northern Europe
  'Sweden': ['Norway', 'Denmark', 'Finland', 'Netherlands', 'Germany', 'Switzerland', 'Canada', 'Australia'],
  'Norway': ['Sweden', 'Denmark', 'Finland', 'Switzerland', 'Netherlands', 'Canada', 'Australia', 'New Zealand'],
  'Denmark': ['Sweden', 'Norway', 'Finland', 'Netherlands', 'Switzerland', 'Germany', 'Belgium', 'Austria'],
  'Finland': ['Sweden', 'Norway', 'Denmark', 'Estonia', 'Netherlands', 'Germany', 'Switzerland', 'Austria'],
  'Netherlands': ['Belgium', 'Germany', 'Switzerland', 'Denmark', 'Sweden', 'Austria', 'United Kingdom', 'Singapore'],
  
  // Other Europe
  'Switzerland': ['Norway', 'Singapore', 'Luxembourg', 'Denmark', 'Sweden', 'Netherlands', 'Austria', 'Germany'],
  'Belgium': ['Netherlands', 'Luxembourg', 'France', 'Germany', 'Austria', 'Denmark', 'Switzerland', 'Ireland'],
  'Austria': ['Switzerland', 'Germany', 'Netherlands', 'Belgium', 'Denmark', 'Sweden', 'Czech Republic', 'Slovenia'],
  'Spain': ['Italy', 'Portugal', 'France', 'Greece', 'Poland', 'Chile', 'Argentina', 'South Korea'],
  'Portugal': ['Spain', 'Greece', 'Ireland', 'Poland', 'Chile', 'Uruguay', 'Costa Rica', 'Estonia'],
  'Ireland': ['United Kingdom', 'Netherlands', 'Singapore', 'Luxembourg', 'Denmark', 'Switzerland', 'Belgium', 'Estonia'],
  'Greece': ['Spain', 'Portugal', 'Italy', 'Cyprus', 'Israel', 'Turkey', 'Bulgaria', 'Romania'],
  
  // Africa
  'Nigeria': ['South Africa', 'Egypt', 'Kenya', 'Ghana', 'Ethiopia', 'Indonesia', 'Bangladesh', 'Pakistan'],
  'Egypt': ['Turkey', 'Saudi Arabia', 'Iran', 'Nigeria', 'South Africa', 'Morocco', 'Algeria', 'Pakistan'],
  'Kenya': ['Nigeria', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Vietnam', 'Bangladesh', 'Philippines'],
  'Ghana': ['Kenya', 'Nigeria', 'Senegal', 'Ivory Coast', 'Tanzania', 'Vietnam', 'Morocco', 'Tunisia'],
  'Morocco': ['Egypt', 'Tunisia', 'Algeria', 'Jordan', 'Vietnam', 'Thailand', 'Peru', 'Colombia'],
  
  // South Asia
  'Pakistan': ['Bangladesh', 'Egypt', 'Iran', 'Nigeria', 'Ethiopia', 'Vietnam', 'Philippines', 'Kenya'],
  'Bangladesh': ['Pakistan', 'Vietnam', 'Philippines', 'Egypt', 'Ethiopia', 'Kenya', 'Myanmar', 'Cambodia'],
  
  // Other
  'Ukraine': ['Poland', 'Romania', 'Turkey', 'Kazakhstan', 'Belarus', 'Moldova', 'Georgia', 'Serbia'],
  'Kazakhstan': ['Russia', 'Turkey', 'Ukraine', 'Azerbaijan', 'Uzbekistan', 'Belarus', 'Iran', 'Saudi Arabia'],
  'Venezuela': ['Argentina', 'Colombia', 'Ecuador', 'Iran', 'Algeria', 'Nigeria', 'Angola', 'Iraq'],
};

export const CountryComparison: React.FC<CountryComparisonProps> = ({
  selectedCountry,
  timeWindow = '30D',
}) => {
  const { setSelectedEntity } = useGlobalDashboardStore();

  // Calculate trend based on time window
  const calculateTrend = (csi: number): { trend: 'up' | 'down' | 'stable'; value: number } => {
    // Simulate trend calculation based on CSI and time window
    // In production, this would use historical data
    const baseChange = (Math.random() - 0.5) * 10; // -5 to +5
    
    let multiplier = 1;
    switch (timeWindow) {
      case '7D':
        multiplier = 0.5;
        break;
      case '30D':
        multiplier = 1;
        break;
      case '90D':
        multiplier = 2;
        break;
      case '12M':
        multiplier = 4;
        break;
    }
    
    const trendValue = baseChange * multiplier;
    
    if (trendValue > 2) return { trend: 'up', value: trendValue };
    if (trendValue < -2) return { trend: 'down', value: trendValue };
    return { trend: 'stable', value: trendValue };
  };

  // Get comparison data
  const comparisonData = useMemo((): CountryComparisonData[] => {
    if (!selectedCountry) {
      // Global Mode: Top 10 highest CSI countries
      return GLOBAL_COUNTRIES
        .map((country, index) => {
          const currentCSI = getCountryShockIndex(country.country);
          const { trend, value } = calculateTrend(currentCSI);
          return {
            country: country.country,
            csi: currentCSI,
            trend,
            trendValue: value,
            rank: index + 1,
            region: country.region,
          };
        })
        .sort((a, b) => b.csi - a.csi)
        .slice(0, 10);
    } else {
      // Country Focus Mode: Peer countries
      const peers = COUNTRY_PEERS[selectedCountry] || [];
      const peerData = peers
        .map(peerCountry => {
          const countryData = getCountryData(peerCountry);
          if (!countryData) return null;
          
          const currentCSI = getCountryShockIndex(peerCountry);
          const { trend, value } = calculateTrend(currentCSI);
          const rank = GLOBAL_COUNTRIES.findIndex(c => c.country === peerCountry) + 1;
          
          return {
            country: peerCountry,
            csi: currentCSI,
            trend,
            trendValue: value,
            rank,
            region: countryData.region,
          };
        })
        .filter((item): item is CountryComparisonData => item !== null)
        .sort((a, b) => b.csi - a.csi);
      
      // Add selected country to the list
      const selectedData = getCountryData(selectedCountry);
      if (selectedData) {
        const currentCSI = getCountryShockIndex(selectedCountry);
        const { trend, value } = calculateTrend(currentCSI);
        const rank = GLOBAL_COUNTRIES.findIndex(c => c.country === selectedCountry) + 1;
        
        peerData.push({
          country: selectedCountry,
          csi: currentCSI,
          trend,
          trendValue: value,
          rank,
          region: selectedData.region,
        });
        
        // Re-sort with selected country included
        peerData.sort((a, b) => b.csi - a.csi);
      }
      
      return peerData.slice(0, 10);
    }
  }, [selectedCountry, timeWindow]);

  const handleCountryClick = (country: string) => {
    setSelectedEntity(country);
  };

  // Export functionality
  const handleExport = () => {
    const headers = [
      'Rank',
      'Country',
      'Region',
      'CSI Score',
      'Trend',
      'Change',
      'Risk Level'
    ];
    
    const getRiskLevel = (csi: number): string => {
      if (csi >= 70) return 'Critical';
      if (csi >= 50) return 'High';
      if (csi >= 30) return 'Medium';
      return 'Low';
    };
    
    const rows = comparisonData.map(item => [
      item.rank,
      item.country,
      item.region,
      item.csi.toFixed(1),
      item.trend.charAt(0).toUpperCase() + item.trend.slice(1),
      `${item.trendValue > 0 ? '+' : ''}${item.trendValue.toFixed(1)}`,
      getRiskLevel(item.csi)
    ]);
    
    const scope = selectedCountry ? `${sanitizeFilename(selectedCountry)}-peers` : 'top-risk-countries';
    const date = formatDateForFilename();
    const filename = `country-comparison-${scope}-${date}.csv`;
    
    downloadCSV({
      headers,
      rows,
      filename,
      metadata: {
        title: selectedCountry ? `${selectedCountry} - Peer Country Comparison` : 'Top Risk Countries',
        generatedAt: formatDateTime(),
        selectedCountry: selectedCountry || 'Global',
        timeWindow: timeWindow,
      }
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-400" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-400';
      case 'down':
        return 'text-green-400';
      case 'stable':
        return 'text-gray-400';
    }
  };

  const getRiskLevelBadge = (csi: number) => {
    if (csi >= 70) return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    if (csi >= 50) return <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500">High</Badge>;
    if (csi >= 30) return <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500">Medium</Badge>;
    return <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500">Low</Badge>;
  };

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedCountry ? (
              <Users className="h-5 w-5 text-[#7fa89f]" />
            ) : (
              <Globe className="h-5 w-5 text-[#7fa89f]" />
            )}
            <CardTitle className="text-white text-lg font-semibold">
              {selectedCountry ? 'Peer Comparison' : 'Top Risk Countries'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
              {selectedCountry ? 'Peers' : 'Global'}
            </Badge>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {selectedCountry
            ? `Countries with similar economic and geopolitical profiles`
            : 'Countries with highest CSI scores globally'}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {comparisonData.map((item, index) => {
            const isSelected = item.country === selectedCountry;
            
            return (
              <div
                key={item.country}
                onClick={() => handleCountryClick(item.country)}
                className={`
                  p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${isSelected 
                    ? 'bg-[#0d5f5f]/30 border-[#7fa89f] shadow-lg' 
                    : 'bg-[#0a0f0d] border-[#0d5f5f]/20 hover:bg-[#0d5f5f]/10 hover:border-[#0d5f5f]/50'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge 
                      variant="outline" 
                      className={`
                        text-xs font-bold shrink-0
                        ${isSelected 
                          ? 'bg-[#7fa89f] text-[#0d1512] border-[#7fa89f]' 
                          : 'bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]'
                        }
                      `}
                    >
                      #{item.rank}
                    </Badge>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`
                          font-medium truncate
                          ${isSelected ? 'text-[#7fa89f]' : 'text-white'}
                        `}>
                          {item.country}
                        </span>
                        {isSelected && (
                          <Badge variant="outline" className="text-xs bg-[#7fa89f]/20 text-[#7fa89f] border-[#7fa89f]">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.region}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`
                        text-lg font-bold
                        ${isSelected ? 'text-[#7fa89f]' : 'text-white'}
                      `}>
                        {item.csi.toFixed(1)}
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${getTrendColor(item.trend)}`}>
                        {getTrendIcon(item.trend)}
                        <span>{item.trendValue > 0 ? '+' : ''}{item.trendValue.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRiskLevelBadge(item.csi)}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-[#0d5f5f]/30">
          <p className="text-gray-400 text-xs">
            {selectedCountry
              ? 'Peer countries are selected based on economic structure, income level, and geopolitical alignment. Click any country to view details.'
              : 'Click any country to view detailed risk analysis and peer comparisons.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};