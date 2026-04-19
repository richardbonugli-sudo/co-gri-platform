import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryShockIndex } from '@/data/globalCountries';

interface CountryRisk {
  country: string;
  riskLevel: number;
  exposureWeight: number;
  contribution: number;
}

interface RiskHeatMapProps {
  countryRisks: CountryRisk[];
  title?: string;
}

const RiskHeatMap: React.FC<RiskHeatMapProps> = ({ 
  countryRisks, 
  title = "Global Risk Heat Map" 
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const regions = {
    all: 'All Regions',
    'North America': ['United States', 'Canada', 'Mexico'],
    'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland'],
    'Asia Pacific': ['China', 'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Australia'],
    'Emerging Markets': ['Brazil', 'India', 'Russia', 'South Africa', 'Turkey', 'Indonesia'],
    'Middle East': ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Qatar', 'Kuwait']
  };

  const getRiskColor = (riskLevel: number): string => {
    if (riskLevel >= 80) return 'bg-red-600';
    if (riskLevel >= 60) return 'bg-orange-500';
    if (riskLevel >= 45) return 'bg-yellow-500';
    if (riskLevel >= 30) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getRiskLabel = (riskLevel: number): string => {
    if (riskLevel >= 80) return 'Critical';
    if (riskLevel >= 60) return 'High';
    if (riskLevel >= 45) return 'Moderate';
    if (riskLevel >= 30) return 'Low-Moderate';
    return 'Low';
  };

  const filteredRisks = useMemo(() => {
    if (selectedRegion === 'all') return countryRisks;
    const regionCountries = regions[selectedRegion as keyof typeof regions] as string[];
    return countryRisks.filter(risk => 
      regionCountries.some(country => 
        risk.country.toLowerCase().includes(country.toLowerCase()) ||
        country.toLowerCase().includes(risk.country.toLowerCase())
      )
    );
  }, [countryRisks, selectedRegion]);

  const maxExposure = Math.max(...countryRisks.map(r => r.exposureWeight));

  return (
    <Card className="bg-[#0f1e2e] border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">{title}</CardTitle>
          <div className="flex gap-2">
            {Object.entries(regions).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedRegion === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRegion(key)}
                className={selectedRegion === key ? 
                  "bg-[#0d5f5f] hover:bg-[#0a4d4d]" : 
                  "border-gray-600 text-gray-300 hover:bg-gray-700"
                }
              >
                {typeof label === 'string' ? label : key}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRisks
              .sort((a, b) => b.contribution - a.contribution)
              .slice(0, 24)
              .map((risk, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`
                        ${getRiskColor(risk.riskLevel)} 
                        rounded-lg p-3 cursor-pointer transition-all duration-200 
                        hover:scale-105 hover:shadow-lg relative overflow-hidden
                      `}
                      style={{
                        opacity: 0.7 + (risk.exposureWeight / maxExposure) * 0.3
                      }}
                    >
                      <div className="text-white text-xs font-semibold mb-1 truncate">
                        {risk.country}
                      </div>
                      <div className="text-white text-lg font-bold">
                        {risk.riskLevel.toFixed(0)}
                      </div>
                      <div className="text-white text-xs opacity-90">
                        {getRiskLabel(risk.riskLevel)}
                      </div>
                      <div 
                        className="absolute bottom-0 left-0 bg-white bg-opacity-20 h-1"
                        style={{ width: `${(risk.exposureWeight / maxExposure) * 100}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1a2332] border-gray-600 text-white">
                    <div className="space-y-1">
                      <div className="font-semibold">{risk.country}</div>
                      <div>Risk Level: {risk.riskLevel.toFixed(1)} ({getRiskLabel(risk.riskLevel)})</div>
                      <div>Exposure: {(risk.exposureWeight * 100).toFixed(2)}%</div>
                      <div>Contribution: {risk.contribution.toFixed(2)} points</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-6 p-4 bg-[#1a2332] rounded-lg">
          <h4 className="text-white font-semibold mb-3">Risk Level Legend</h4>
          <div className="flex flex-wrap gap-3">
            {[
              { level: 'Critical', color: 'bg-red-600', range: '80-100' },
              { level: 'High', color: 'bg-orange-500', range: '60-79' },
              { level: 'Moderate', color: 'bg-yellow-500', range: '45-59' },
              { level: 'Low-Moderate', color: 'bg-blue-500', range: '30-44' },
              { level: 'Low', color: 'bg-green-500', range: '0-29' }
            ].map(({ level, color, range }) => (
              <div key={level} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-gray-300 text-sm">
                  {level} ({range})
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Opacity indicates exposure weight • Bottom bar shows relative exposure size
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskHeatMap;