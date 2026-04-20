/**
 * Risk Contribution Map (C3)
 * Show where risk comes from with world map visualization
 * Part of CO-GRI Platform Phase 2 - Week 2
 * 
 * Implements specification Part 3.3 C3
 * CRITICAL: Shows "risk contribution share" NOT "exposure share"
 * 
 * Updated: Full Dark Theme Alignment with Country Mode visualization
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ChevronDown, ChevronUp, Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import { getContributionLabel, formatPercentage } from '@/utils/riskCalculations';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type EvidenceTier = 'DIRECT' | 'ALLOCATED' | 'MODELED';

/**
 * GAP 5 FIX: TierBadge — small inline badge showing evidence quality tier.
 * DIRECT   = green  — explicitly disclosed in SEC filing
 * ALLOCATED= blue   — derived from structural constraint (region → prior split)
 * MODELED  = gray   — prior-based inference, no direct constraint
 */
const TIER_CONFIG: Record<EvidenceTier, { label: string; className: string; tooltip: string }> = {
  DIRECT: {
    label: 'DIRECT',
    className: 'bg-green-500/20 text-green-400 border-green-500/40',
    tooltip: 'Directly disclosed in SEC filing',
  },
  ALLOCATED: {
    label: 'ALLOC',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    tooltip: 'Allocated from regional total using channel prior',
  },
  MODELED: {
    label: 'MODEL',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    tooltip: 'Prior-based estimate — no direct filing constraint',
  },
};

const TierBadge: React.FC<{ tier: EvidenceTier }> = ({ tier }) => {
  const { label, className, tooltip } = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center text-[9px] font-semibold px-1 py-0.5 rounded border ${className}`}
      title={tooltip}
    >
      {label}
    </span>
  );
};

interface RiskContribution {
  country: string;
  risk_share: number;        // Percentage [0,100]
  contribution_label: string; // "Primary" | "Significant" | "Moderate"
  dominant_channel: string;   // "Supply Chain" | "Revenue" | etc.
  AdjS?: number;              // Adjusted shock (advanced toggle)
  W_c?: number;               // Alignment modifier (advanced toggle)
  /** GAP 5 FIX: Evidence tier for opacity control */
  tier?: EvidenceTier;
}

interface RiskContributionMapProps {
  /**
   * Full CountryExposure objects from cogriCalculationService.
   * Must include channelWeights and politicalAlignment for accurate channel
   * and alignment display (Bugs #1 and #2 fixes require these fields).
   */
  countryExposures: Array<{
    country: string;
    exposureWeight: number;
    countryShockIndex: number;
    contribution: number;
    channelWeights?: {
      revenue: number;
      financial: number;
      supply: number;
      assets: number;
      market: number;
    };
    politicalAlignment?: {
      alignmentFactor: number;
      relationship: string;
      source: string;
    };
    /** GAP 5 FIX: Evidence tier for opacity control on map */
    tier?: EvidenceTier;
  }>;
}

export const RiskContributionMap: React.FC<RiskContributionMapProps> = ({
  countryExposures
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<any>(null);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

  // Calculate risk contributions
  const totalRisk = countryExposures.reduce((sum, c) => sum + c.contribution, 0);
  const riskContributions: RiskContribution[] = countryExposures
    .map(exposure => {
      const risk_share = (exposure.contribution / totalRisk) * 100;
      return {
        country: exposure.country,
        risk_share,
        contribution_label: getContributionLabel(risk_share / 100),
        // BUG #1 FIX: determineDominantChannel now reads channelWeights deterministically
        dominant_channel: determineDominantChannel(exposure),
        AdjS: exposure.countryShockIndex,
        // BUG #2 FIX: Read actual alignmentFactor from the exposure object.
        W_c: exposure.politicalAlignment?.alignmentFactor ?? 0.5,
        // GAP 5 FIX: Propagate tier for opacity control
        tier: exposure.tier,
      };
    })
    .sort((a, b) => b.risk_share - a.risk_share);

  // Top 5-7 for map highlighting
  const topContributors = riskContributions.slice(0, 7);

  const getMarkerSize = (risk_share: number): number => {
    if (risk_share > 20) return 12;
    if (risk_share > 10) return 10;
    if (risk_share > 5) return 8;
    return 6;
  };

  const getMarkerColor = (risk_share: number): string => {
    if (risk_share > 20) return '#EF4444'; // red-500
    if (risk_share > 10) return '#F97316'; // orange-500
    if (risk_share > 5) return '#F59E0B';  // amber-500
    return '#10B981'; // green-500
  };

  // Get risk color for geography fill (matching Country mode)
  const getRiskColor = (risk_share: number): string => {
    if (risk_share > 20) return '#ef4444'; // red-500
    if (risk_share > 10) return '#f97316'; // orange-500
    if (risk_share > 5) return '#eab308';  // yellow-500
    return '#22c55e'; // green-500
  };

  // Get risk text color for dark theme
  const getRiskTextColor = (risk_share: number): string => {
    if (risk_share > 20) return 'text-red-400';
    if (risk_share > 10) return 'text-orange-400';
    if (risk_share > 5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCountryCoordinates = (country: string): [number, number] => {
    // Simplified coordinates - in production, use a proper geocoding service
    const coords: Record<string, [number, number]> = {
      'China': [104.1954, 35.8617],
      'Taiwan': [120.9605, 23.6978],
      'Vietnam': [108.2772, 14.0583],
      'Japan': [138.2529, 36.2048],
      'S. Korea': [127.7669, 35.9078],
      'South Korea': [127.7669, 35.9078],
      'Germany': [10.4515, 51.1657],
      'Mexico': [-102.5528, 23.6345],
      'India': [78.9629, 20.5937],
      'United States': [-95.7129, 37.0902],
      'USA': [-95.7129, 37.0902],
      'United Kingdom': [-3.4360, 55.3781],
      'UK': [-3.4360, 55.3781],
      'France': [2.2137, 46.2276],
      'Italy': [12.5674, 41.8719],
      'Spain': [-3.7492, 40.4637],
      'Canada': [-106.3468, 56.1304],
      'Brazil': [-51.9253, -14.2350],
      'Australia': [133.7751, -25.2744],
      'Russia': [105.3188, 61.5240],
    };
    return coords[country] || [0, 0];
  };

  // Zoom controls
  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }

  function handleReset() {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  }

  function handleMoveEnd(newPosition: any) {
    setPosition(newPosition);
  }

  // Get contributor data for a country
  const getContributorData = (countryName: string) => {
    return topContributors.find(c => 
      countryName.includes(c.country) || c.country.includes(countryName)
    );
  };

  return (
    <Card className="w-full bg-[#0d1512] border-[#0d5f5f]/30" data-testid="risk-contribution-map">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="border-[#0d5f5f]/50 text-[#7fa89f] hover:bg-[#0d5f5f]/20"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            Advanced
          </Button>
        </div>
        <CardTitle className="flex items-center gap-2 text-white">
          <MapPin className="h-5 w-5 text-[#7fa89f]" />
          Risk Contribution Map
        </CardTitle>
        <CardDescription className="text-gray-400">
          Geographic distribution of risk contributions (top 5-7 countries highlighted)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* CRITICAL LABEL - Dark Theme */}
        <div className="mb-4 p-3 bg-[#0d5f5f]/20 border border-[#0d5f5f]/40 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-[#7fa89f] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-300">
            <strong className="text-white">Note:</strong> This map shows <strong className="text-[#7fa89f]">risk contribution share</strong>, not exposure share. 
            Risk contribution = Exposure × Country Shock × Alignment Modifier.
          </p>
        </div>

        {/* Legend - Dark Theme */}
        <div className="flex flex-wrap items-center gap-4 mb-3 pb-3 border-b border-[#0d5f5f]/30">
          <span className="text-gray-400 text-sm font-medium">Risk Contribution:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span className="text-gray-300 text-sm">Primary (&gt;20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full" />
            <span className="text-gray-300 text-sm">Significant (10-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full" />
            <span className="text-gray-300 text-sm">Moderate (5-10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span className="text-gray-300 text-sm">Minor (&lt;5%)</span>
          </div>
        </div>

        {/* GAP 5 FIX: Evidence Tier Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-[#0d5f5f]/30">
          <span className="text-gray-400 text-sm font-medium">Evidence Tier:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500/80 border border-green-400" />
            <span className="text-gray-300 text-xs">Direct — SEC filing disclosure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500/80 border border-blue-400" />
            <span className="text-gray-300 text-xs">Allocated — region prior split</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-500/50 border border-gray-500 opacity-70" />
            <span className="text-gray-400 text-xs">Modeled — prior estimate (reduced opacity)</span>
          </div>
        </div>

        {/* World Map - Dark Theme with Fixed Aspect Ratio */}
        <div className="relative w-full mb-6" style={{ paddingBottom: '50%' }}>
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="bg-[#0d1512] border-[#0d5f5f] text-white hover:bg-[#0d5f5f] h-8 w-8 p-0"
              disabled={position.zoom >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="bg-[#0d1512] border-[#0d5f5f] text-white hover:bg-[#0d5f5f] h-8 w-8 p-0"
              disabled={position.zoom <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="bg-[#0d1512] border-[#0d5f5f] text-white hover:bg-[#0d5f5f] h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Tooltip Display - Dark Theme */}
          {hoveredCountry && tooltipContent && (
            <div className="absolute top-4 left-4 z-20 bg-[#0d1512] border border-[#0d5f5f] rounded-lg p-4 shadow-xl max-w-xs">
              <p className="font-semibold text-white text-lg mb-2">{tooltipContent.name}</p>
              <div className="space-y-1">
                <p className="text-sm text-gray-300">
                  Risk Share: <span className={`font-bold ${getRiskTextColor(tooltipContent.risk_share)}`}>
                    {tooltipContent.risk_share.toFixed(1)}%
                  </span>
                </p>
                <p className="text-sm text-gray-300">
                  Level: <Badge 
                    variant="outline" 
                    className={`ml-2 text-xs ${
                      tooltipContent.risk_share > 20 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      tooltipContent.risk_share > 10 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      tooltipContent.risk_share > 5 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    {tooltipContent.label}
                  </Badge>
                </p>
                <p className="text-xs text-[#7fa89f] mt-2">Channel: {tooltipContent.channel}</p>
              </div>
            </div>
          )}

          {/* Map Container - Dark Theme */}
          <div className="absolute top-0 left-0 w-full h-full bg-[#0a0f0d] rounded-lg border border-[#0d5f5f]/20 overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140
              }}
              width={800}
              height={400}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              <ZoomableGroup 
                center={position.coordinates as [number, number]} 
                zoom={position.zoom}
                onMoveEnd={handleMoveEnd}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const contributor = getContributorData(geo.properties.name);
                      const isHighlighted = !!contributor;
                      const isSelected = selectedCountry === geo.properties.name;
                      
                      // Dark theme colors - highlighted countries get risk-based colors
                      const fillColor = isHighlighted 
                        ? getRiskColor(contributor!.risk_share) 
                        : '#1a1a1a';
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke={isSelected ? "#7fa89f" : "#0d5f5f"}
                          strokeWidth={isSelected ? 2 : 0.5}
                          style={{
                            default: { 
                              outline: 'none',
                              filter: isSelected ? 'brightness(1.3)' : 'none',
                              transition: 'all 0.2s ease'
                            },
                            hover: { 
                              outline: 'none', 
                              fill: isHighlighted ? getRiskColor(contributor!.risk_share) : '#2a2a2a',
                              stroke: '#7fa89f',
                              strokeWidth: isHighlighted ? 1.5 : 0.5,
                              cursor: isHighlighted ? 'pointer' : 'default',
                              filter: isHighlighted ? 'brightness(1.4)' : 'none'
                            },
                            pressed: { outline: 'none' }
                          }}
                          onMouseEnter={() => {
                            if (isHighlighted && contributor) {
                              setHoveredCountry(geo.properties.name);
                              setTooltipContent({
                                name: contributor.country,
                                risk_share: contributor.risk_share,
                                label: contributor.contribution_label,
                                channel: contributor.dominant_channel
                              });
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredCountry(null);
                            setTooltipContent(null);
                          }}
                          onClick={() => {
                            if (isHighlighted) {
                              setSelectedCountry(geo.properties.name);
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                
                {/* Markers for top contributors */}
                {topContributors.map((contributor) => {
                  const coords = getCountryCoordinates(contributor.country);
                  return (
                    <Marker key={contributor.country} coordinates={coords}>
                      <circle
                        r={getMarkerSize(contributor.risk_share)}
                        fill={getMarkerColor(contributor.risk_share)}
                        stroke="#0d1512"
                        strokeWidth={2}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedCountry(contributor.country)}
                      />
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        {/* Ranked List - Dark Theme */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-white">Top Risk Contributors (Ranked)</h4>
          <div className="space-y-2">
            {riskContributions.slice(0, 10).map((contrib, idx) => (
              <div
                key={contrib.country}
                className={`p-3 border rounded-lg transition-all cursor-pointer ${
                  selectedCountry === contrib.country
                    ? 'border-[#0d5f5f] bg-[#0d5f5f]/20'
                    : 'border-[#0d5f5f]/30 hover:border-[#0d5f5f]/60 hover:bg-[#0d5f5f]/10'
                }`}
                style={{ opacity: contrib.tier === 'MODELED' ? 0.7 : 1 }}
                onClick={() => setSelectedCountry(contrib.country)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0d5f5f] text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{contrib.country}</span>
                        {/* GAP 5 FIX: Tier badge */}
                        {contrib.tier && <TierBadge tier={contrib.tier} />}
                      </div>
                      <div className="text-xs text-gray-400">
                        {contrib.dominant_channel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getRiskTextColor(contrib.risk_share)}`}>
                      {formatPercentage(contrib.risk_share)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        contrib.risk_share > 20 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        contrib.risk_share > 10 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        contrib.risk_share > 5 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}
                    >
                      {contrib.contribution_label}
                    </Badge>
                  </div>
                </div>
                
                {/* Advanced Details - Dark Theme */}
                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-[#0d5f5f]/30 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Adjusted Shock (AdjS):</span>
                      <span className="ml-2 font-semibold text-white">{contrib.AdjS?.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Alignment (W^c):</span>
                      <span className="ml-2 font-semibold text-white">{contrib.W_c?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer info - Dark Theme */}
        <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Interactive geographic visualization • Click and drag to pan • Use zoom controls
          </p>
          <p className="text-gray-500 text-xs">
            Updated in real-time
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Determine dominant channel for a country exposure.
 *
 * BUG #1 FIX: Replaced Math.random() with a deterministic calculation.
 * Reads channelWeights and returns the channel with the highest blended
 * contribution (weight × coefficient).
 *
 * Formula: dominantChannel = argmax{ revenue×0.40, supply×0.35, assets×0.15, financial×0.10 }
 */
const EXPOSURE_COEFFICIENTS_MAP = {
  revenue: 0.40,
  supply: 0.35,
  assets: 0.15,
  financial: 0.10,
};

function determineDominantChannel(exposure: {
  channelWeights?: {
    revenue: number;
    financial: number;
    supply: number;
    assets: number;
    market: number;
  };
}): string {
  const cw = exposure.channelWeights;
  if (!cw) return 'Revenue'; // safe deterministic fallback — no random

  const scores: Array<{ channel: string; score: number }> = [
    { channel: 'Revenue',         score: cw.revenue   * EXPOSURE_COEFFICIENTS_MAP.revenue   },
    { channel: 'Supply Chain',    score: cw.supply    * EXPOSURE_COEFFICIENTS_MAP.supply    },
    { channel: 'Physical Assets', score: cw.assets    * EXPOSURE_COEFFICIENTS_MAP.assets    },
    { channel: 'Financial',       score: cw.financial * EXPOSURE_COEFFICIENTS_MAP.financial },
  ];

  return scores.reduce((best, curr) => curr.score > best.score ? curr : best).channel;
}

export default RiskContributionMap;