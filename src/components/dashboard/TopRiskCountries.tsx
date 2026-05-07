/**
 * Top Risk Countries Component
 * Shows ranked list of highest CSI countries with map synchronization
 * Phase 3: Visual Polish - Standardized spacing, colors, and typography
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, ArrowRight, MapPin } from 'lucide-react';
import { getCountryShockIndex } from '@/data/globalCountries';
import { useLocation } from 'wouter';

interface TopRiskCountriesProps {
  maxCountries?: number;
  title?: string;
  onCountryHover?: (country: string | null) => void;
  selectedCountry?: string | null;
}

export const TopRiskCountries: React.FC<TopRiskCountriesProps> = ({
  maxCountries = 10,
  title = "Top Risk Countries",
  onCountryHover,
  selectedCountry
}) => {
  const [, setLocation] = useLocation();

  // Get top risk countries
  const topCountries = React.useMemo(() => {
    const countries = [
      'Russia', 'Ukraine', 'Iran', 'North Korea', 'Venezuela', 'Syria', 'Yemen', 'Afghanistan',
      'Myanmar', 'Belarus', 'Sudan', 'Lebanon', 'Pakistan', 'Iraq', 'Libya',
      'Somalia', 'South Sudan', 'Central African Republic', 'Mali', 'Burkina Faso',
      'China', 'Turkey', 'Egypt', 'Algeria', 'Ethiopia'
    ];

    return countries
      .map(country => ({
        country,
        csi_score: getCountryShockIndex(country),
        trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable'),
        change: (Math.random() * 10 - 5).toFixed(1)
      }))
      .sort((a, b) => b.csi_score - a.csi_score)
      .slice(0, maxCountries);
  }, [maxCountries]);

  function getRiskColor(csi: number): string {
    if (csi >= 70) return 'text-red-400';
    if (csi >= 50) return 'text-orange-400';
    if (csi >= 30) return 'text-yellow-400';
    return 'text-green-400';
  }

  function getRiskBadgeColor(csi: number): string {
    if (csi >= 70) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (csi >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (csi >= 30) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }

  function getRiskLevel(csi: number): string {
    if (csi >= 70) return 'Critical';
    if (csi >= 50) return 'High';
    if (csi >= 30) return 'Moderate';
    return 'Low';
  }

  function getTrendIcon(trend: string) {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  }

  function handleCountryClick(country: string) {
    setLocation(`/country?selected=${encodeURIComponent(country)}`);
  }

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#7fa89f]" />
          <CardTitle className="text-white text-lg font-semibold">{title}</CardTitle>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Countries with highest geopolitical risk scores
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {topCountries.map((country, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg bg-[#0a0f0d] border transition-all cursor-pointer group ${
                selectedCountry === country.country 
                  ? 'border-[#7fa89f] ring-2 ring-[#7fa89f]/30' 
                  : 'border-[#0d5f5f]/20 hover:border-[#0d5f5f]'
              }`}
              onClick={() => handleCountryClick(country.country)}
              onMouseEnter={() => onCountryHover?.(country.country)}
              onMouseLeave={() => onCountryHover?.(null)}
            >
              {/* Rank and Country */}
              <div className="flex items-center gap-3 flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                  index < 3 
                    ? 'bg-red-500/30 text-red-400' 
                    : 'bg-[#0d5f5f]/30 text-[#7fa89f]'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold group-hover:text-[#7fa89f] transition-colors">
                    {country.country}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${getRiskBadgeColor(country.csi_score)}`}
                  >
                    {getRiskLevel(country.csi_score)}
                  </Badge>
                </div>
              </div>

              {/* CSI Score */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getRiskColor(country.csi_score)}`}>
                    {country.csi_score.toFixed(1)}
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    {getTrendIcon(country.trend)}
                    <span className={`text-xs ${
                      country.trend === 'up' ? 'text-red-400' : 
                      country.trend === 'down' ? 'text-green-400' : 
                      'text-gray-400'
                    }`}>
                      {parseFloat(country.change) > 0 ? '+' : ''}{country.change}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-[#7fa89f] transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30">
          <Button
            variant="outline"
            className="w-full border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
            onClick={() => setLocation('/country')}
          >
            View All Countries
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopRiskCountries;