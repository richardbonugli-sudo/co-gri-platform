/**
 * Sector Exposure Panel Component
 * UPDATED: Percentile-based scoring with risk level labels and tooltips
 * 
 * Features:
 * - Dual mode: Global sector overview / Country-specific sector exposure
 * - Percentile-based scoring (0-100 reflects global ranking)
 * - Risk level bands with color-coded badges
 * - Interactive hover tooltips showing raw scores
 * - Horizontal bar chart visualization
 * - Sorting and filtering options
 * - CSV export functionality
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Factory,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Info,
} from 'lucide-react';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import { getCountrySectorData, getGlobalSectorData, type SectorExposure } from '@/data/sectorData';
import { downloadCSV, formatDateForFilename, formatDateTime, sanitizeFilename } from '@/utils/exportUtils';

interface SectorExposureProps {
  selectedCountry?: string | null;
}

type SortOption = 'risk' | 'contribution' | 'name';

// Risk level bands based on percentile scores
type RiskLevel = 'Severe' | 'Very High' | 'High' | 'Moderate' | 'Low';

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Severe';
  if (score >= 60) return 'Very High';
  if (score >= 40) return 'High';
  if (score >= 20) return 'Moderate';
  return 'Low';
}

function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'Severe':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Very High':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'High':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Moderate':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Low':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
}

export const SectorExposure: React.FC<SectorExposureProps> = ({ selectedCountry }) => {
  const { selectedEntity } = useGlobalDashboardStore();
  const [sortBy, setSortBy] = useState<SortOption>('risk');
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  
  // Determine active country
  const activeCountry = selectedCountry || (selectedEntity?.type === 'country' ? selectedEntity.name : null);
  
  // Get sector data
  const sectorData = useMemo(() => {
    if (activeCountry) {
      return getCountrySectorData(activeCountry);
    }
    return getGlobalSectorData();
  }, [activeCountry]);
  
  // Sort sector data
  const sortedSectorData = useMemo(() => {
    const data = [...sectorData];
    switch (sortBy) {
      case 'risk':
        return data.sort((a, b) => b.riskScore - a.riskScore);
      case 'contribution':
        return data.sort((a, b) => b.contribution - a.contribution);
      case 'name':
        return data.sort((a, b) => a.sector.localeCompare(b.sector));
      default:
        return data;
    }
  }, [sectorData, sortBy]);
  
  // Helper functions
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'Very High':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    if (trend === 'Increasing') return <TrendingUp className="h-3 w-3 text-red-400" />;
    if (trend === 'Decreasing') return <TrendingDown className="h-3 w-3 text-green-400" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === 'Increasing') return 'text-red-400';
    if (trend === 'Decreasing') return 'text-green-400';
    return 'text-gray-400';
  };
  
  // Calculate summary statistics
  const avgRiskScore = useMemo(() => {
    const sum = sortedSectorData.reduce((acc, sector) => acc + sector.riskScore, 0);
    return (sum / sortedSectorData.length).toFixed(1);
  }, [sortedSectorData]);
  
  const highRiskCount = useMemo(() => {
    return sortedSectorData.filter(s => s.riskScore >= 60).length;
  }, [sortedSectorData]);
  
  // Export functionality
  const handleExport = () => {
    const headers = [
      'Sector',
      'Risk Score',
      'Risk Level',
      'CSI Contribution (%)',
      'Sensitivity',
      'Trend',
      'Description'
    ];
    
    const rows = sortedSectorData.map(sector => [
      sector.sector,
      sector.riskScore,
      getRiskLevel(sector.riskScore),
      sector.contribution,
      sector.sensitivity,
      sector.trend,
      sector.description
    ]);
    
    const scope = activeCountry ? sanitizeFilename(activeCountry) : 'global';
    const date = formatDateForFilename();
    const filename = `sector-exposure-${scope}-${date}.csv`;
    
    downloadCSV({
      headers,
      rows,
      filename,
      metadata: {
        title: activeCountry ? `${activeCountry} - Sector Exposure Analysis` : 'Global Sector Risk Overview',
        generatedAt: formatDateTime(),
        selectedCountry: activeCountry || 'Global',
        scoringMethod: 'Percentile-based (0-100 reflects global ranking)',
      }
    });
  };
  
  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30 h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">
              {activeCountry ? `${activeCountry} - Sector Exposure` : 'Global Sector Risk Overview'}
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
              Export CSV
            </Button>
            <button
              onClick={() => setSortBy('risk')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                sortBy === 'risk'
                  ? 'bg-[#0d5f5f] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Risk
            </button>
            <button
              onClick={() => setSortBy('contribution')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                sortBy === 'contribution'
                  ? 'bg-[#0d5f5f] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Impact
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                sortBy === 'name'
                  ? 'bg-[#0d5f5f] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Name
            </button>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {activeCountry
            ? `Sector-level risk exposure for ${activeCountry} (percentile-based scoring)`
            : 'Global sector risk scores across all monitored countries (percentile-based scoring)'}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Avg Risk Score</p>
            <p className="text-white text-2xl font-bold">{avgRiskScore}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">High Risk Sectors</p>
            <p className="text-orange-400 text-2xl font-bold">{highRiskCount}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-1">Total Sectors</p>
            <p className="text-white text-2xl font-bold">{sortedSectorData.length}</p>
          </div>
        </div>

        {/* Sector List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedSectorData.map((sector, index) => {
            const riskLevel = getRiskLevel(sector.riskScore);
            const isHovered = hoveredSector === sector.sector;
            
            return (
              <div
                key={index}
                className="p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20 hover:border-[#0d5f5f]/50 transition-all duration-200 group relative"
                onMouseEnter={() => setHoveredSector(sector.sector)}
                onMouseLeave={() => setHoveredSector(null)}
              >
                {/* Sector Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-white font-semibold text-sm group-hover:text-[#7fa89f] transition-colors">
                        {sector.sector}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRiskLevelColor(riskLevel)}`}
                      >
                        {riskLevel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSensitivityColor(sector.sensitivity)}`}
                      >
                        {sector.sensitivity}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {sector.description}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold text-white">
                        {sector.riskScore}
                      </p>
                      {isHovered && (
                        <div className="relative group/tooltip">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute right-0 top-6 w-48 p-2 bg-[#1a1f1d] border border-[#0d5f5f]/50 rounded shadow-lg z-10 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                            <p className="text-xs text-gray-300">
                              <span className="font-semibold">Percentile Score:</span> {sector.riskScore}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              This sector ranks in the {sector.riskScore}th percentile globally for geopolitical risk exposure.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {getTrendIcon(sector.trend)}
                      <span className={`text-xs font-medium ${getTrendColor(sector.trend)}`}>
                        {sector.trend}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Progress 
                      value={sector.riskScore} 
                      className="h-3"
                      style={{
                        background: 'rgba(13, 95, 95, 0.2)'
                      }}
                    />
                    <div 
                      className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getRiskColor(sector.riskScore)}`}
                      style={{ width: `${sector.riskScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Percentile:</span>
                      <span className="text-xs font-semibold text-white">
                        {sector.riskScore}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">CSI Contribution:</span>
                      <span className="text-xs font-semibold text-[#7fa89f]">
                        {sector.contribution}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note - UPDATED METHODOLOGY TEXT */}
        <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30">
          <p className="text-gray-500 text-xs leading-relaxed">
            <strong className="text-gray-400">Methodology (Percentile-Based Scoring):</strong> Scores reflect where each sector ranks globally in terms of geopolitical risk exposure.
            <br/>
            <br/>
            <strong className="text-gray-400">Score Interpretation:</strong>
            <br/>• <span className="text-red-400">80-100 (Severe):</span> Top 20% highest risk globally
            <br/>• <span className="text-orange-400">60-80 (Very High):</span> Top 40% highest risk globally
            <br/>• <span className="text-yellow-400">40-60 (High):</span> Middle 20% risk range
            <br/>• <span className="text-blue-400">20-40 (Moderate):</span> Lower 40% risk range
            <br/>• <span className="text-green-400">0-20 (Low):</span> Bottom 20% lowest risk globally
            <br/>
            <br/>
            <strong className="text-gray-400">Calculation:</strong> Sector exposure is calculated using the country's current CSI level, the structural sensitivity of each sector to geopolitical disruptions, the economic importance of that sector within the country, and the alignment between current geopolitical risk drivers and sector vulnerability. Scores are then ranked against ALL country-sector pairs globally to produce percentile scores (0-100).
            <br/>
            <br/>
            Unlike min-max normalization (which forces every country to have sectors scoring 0 and 100), percentile-based scoring provides global context. A score of 0 or 100 only appears for true global outliers, making extreme values statistically meaningful.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorExposure;