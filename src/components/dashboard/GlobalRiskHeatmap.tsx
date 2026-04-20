/**
 * Global Risk Heatmap Component - Geographic Map Visualization
 * Interactive world map showing CSI scores for all countries
 * Phase 1 Critical Fix: State-based country selection, no page navigation
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryShockIndex } from '@/data/globalCountries';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup 
} from 'react-simple-maps';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GlobalRiskHeatmapProps {
  title?: string;
  showRegionFilter?: boolean;
  maxCountries?: number;
  highlightedRegion?: string | null;
  onCountryClick?: (country: string) => void;
  selectedCountry?: string | null;
}

// World map topology URL
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const GlobalRiskHeatmap: React.FC<GlobalRiskHeatmapProps> = ({ 
  title = "Global CSI Heatmap",
  showRegionFilter = true,
  highlightedRegion = null,
  onCountryClick,
  selectedCountry = null
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<any>(null);
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

  // Define regions with country mappings
  const regions = {
    all: 'All Regions',
    'North America': ['United States', 'Canada', 'Mexico'],
    'Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Greece', 'Portugal', 'Ireland'],
    'Western Europe': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal'],
    'Eastern Europe': ['Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Belarus', 'Russia', 'Slovakia', 'Croatia', 'Serbia', 'Slovenia'],
    'Asia Pacific': ['China', 'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Australia', 'New Zealand', 'India', 'Indonesia', 'Thailand', 'Malaysia', 'Philippines', 'Vietnam'],
    'Middle East': ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Qatar', 'Kuwait', 'Turkey', 'Iran', 'Iraq', 'Jordan', 'Lebanon', 'Oman', 'Bahrain', 'Syria', 'Yemen'],
    'Latin America': ['Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay'],
    'Africa': ['South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Morocco', 'Algeria', 'Tunisia', 'Ghana', 'Ethiopia', 'Tanzania']
  };

  // Country name mapping (map data names to our database names)
  const countryNameMap: Record<string, string> = {
    'United States of America': 'United States',
    'United Kingdom': 'United Kingdom',
    'Russian Federation': 'Russia',
    'Republic of Korea': 'South Korea',
    'Democratic Republic of the Congo': 'Democratic Republic of Congo',
    'Republic of the Congo': 'Republic of Congo',
    'Côte d\'Ivoire': 'Ivory Coast',
    'Myanmar': 'Myanmar',
    'Lao PDR': 'Laos',
    'Syrian Arab Republic': 'Syria',
    'Iran (Islamic Republic of)': 'Iran',
    'Viet Nam': 'Vietnam',
    'United Republic of Tanzania': 'Tanzania',
    'Central African Rep.': 'Central African Republic',
    'Dem. Rep. Korea': 'North Korea',
    'Bosnia and Herz.': 'Bosnia and Herzegovina',
    'Dominican Rep.': 'Dominican Republic',
    'Eq. Guinea': 'Equatorial Guinea',
    'eSwatini': 'Eswatini',
    'N. Cyprus': 'Cyprus',
    'S. Sudan': 'South Sudan',
    'Solomon Is.': 'Solomon Islands',
    'Timor-Leste': 'Timor-Leste',
    'W. Sahara': 'Morocco'
  };

  // Helper functions
  function getRiskLevel(csi: number): string {
    if (csi >= 70) return 'Critical';
    if (csi >= 50) return 'High';
    if (csi >= 30) return 'Moderate';
    return 'Low';
  }

  function getRiskColor(csi: number): string {
    if (csi >= 70) return '#ef4444'; // red-500
    if (csi >= 50) return '#f97316'; // orange-500
    if (csi >= 30) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  }

  function getRiskTextColor(csi: number): string {
    if (csi >= 70) return 'text-red-400';
    if (csi >= 50) return 'text-orange-400';
    if (csi >= 30) return 'text-yellow-400';
    return 'text-green-400';
  }

  function getCountryName(geoName: string): string {
    return countryNameMap[geoName] || geoName;
  }

  function handleCountryClick(countryName: string) {
    const mappedName = getCountryName(countryName);
    // Use callback instead of navigation
    if (onCountryClick) {
      onCountryClick(mappedName);
    }
  }

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

  function handleMoveEnd(position: any) {
    setPosition(position);
  }

  // Check if country should be highlighted based on region filter or hover
  function isCountryInSelectedRegion(countryName: string): boolean {
    if (selectedRegion === 'all') return true;
    const regionCountries = regions[selectedRegion as keyof typeof regions] as string[];
    return regionCountries.some(rc => 
      countryName.toLowerCase().includes(rc.toLowerCase()) ||
      rc.toLowerCase().includes(countryName.toLowerCase())
    );
  }

  // Check if country is in the hovered region from RegionalRiskPanel
  function isCountryInHighlightedRegion(countryName: string): boolean {
    if (!highlightedRegion) return false;
    const regionCountries = regions[highlightedRegion as keyof typeof regions] as string[];
    if (!regionCountries) return false;
    return regionCountries.some(rc => 
      countryName.toLowerCase().includes(rc.toLowerCase()) ||
      rc.toLowerCase().includes(countryName.toLowerCase())
    );
  }

  // Check if country is selected
  function isCountrySelected(countryName: string): boolean {
    if (!selectedCountry) return false;
    return countryName.toLowerCase() === selectedCountry.toLowerCase();
  }

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-white text-lg font-semibold">{title}</CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              Interactive world map - Click any country for detailed analysis
            </p>
          </div>
          
          {showRegionFilter && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(regions).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedRegion === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(key)}
                  className={
                    selectedRegion === key 
                      ? "bg-[#0d5f5f] hover:bg-[#0a4d4d] text-white h-8 text-xs" 
                      : "border-[#0d5f5f]/50 text-[#7fa89f] hover:bg-[#0d5f5f]/20 h-8 text-xs"
                  }
                >
                  {typeof label === 'string' ? label : key}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-[#0d5f5f]/30">
          <span className="text-gray-400 text-sm font-medium">Risk Levels:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-300 text-sm">Low (0-29)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-300 text-sm">Moderate (30-49)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-300 text-sm">High (50-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-300 text-sm">Critical (70-100)</span>
          </div>
        </div>

        {/* Map Container - Fixed aspect ratio to prevent whitespace */}
        <div className="relative w-full" style={{ paddingBottom: '62.5%' }}>
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

          {/* Tooltip Display */}
          {hoveredCountry && tooltipContent && (
            <div className="absolute top-4 left-4 z-20 bg-[#0d1512] border border-[#0d5f5f] rounded-lg p-4 shadow-xl max-w-xs">
              <p className="font-semibold text-white text-lg mb-2">{tooltipContent.name}</p>
              <div className="space-y-1">
                <p className="text-sm">
                  CSI Score: <span className={`font-bold ${getRiskTextColor(tooltipContent.csi)}`}>
                    {tooltipContent.csi.toFixed(1)}
                  </span>
                </p>
                <p className="text-sm text-gray-300">
                  Risk Level: <Badge 
                    variant="outline" 
                    className={`ml-2 text-xs ${
                      tooltipContent.csi >= 70 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      tooltipContent.csi >= 50 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      tooltipContent.csi >= 30 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    {tooltipContent.level}
                  </Badge>
                </p>
                <p className="text-xs text-[#7fa89f] mt-2">Click for detailed analysis</p>
              </div>
            </div>
          )}

          {/* Map - Absolute positioning with fixed aspect ratio */}
          <div className="absolute top-0 left-0 w-full h-full bg-[#0a0f0d] rounded-lg border border-[#0d5f5f]/20 overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140
              }}
              width={800}
              height={500}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates as [number, number]}
                onMoveEnd={handleMoveEnd}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryName = getCountryName(geo.properties.name);
                      const csi = getCountryShockIndex(countryName);
                      const isInRegion = isCountryInSelectedRegion(countryName);
                      const isHighlighted = isCountryInHighlightedRegion(countryName);
                      const isSelected = isCountrySelected(countryName);
                      
                      // Determine fill color based on region filter and highlight state
                      let fillColor = isInRegion ? getRiskColor(csi) : '#1a1a1a';
                      
                      const isHovered = hoveredCountry === geo.properties.name;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke={isSelected ? "#7fa89f" : (isHighlighted ? "#7fa89f" : "#0d5f5f")}
                          strokeWidth={isSelected ? 2 : (isHighlighted ? 1.2 : 0.5)}
                          style={{
                            default: {
                              fill: fillColor,
                              stroke: isSelected ? '#7fa89f' : (isHighlighted ? '#7fa89f' : '#0d5f5f'),
                              strokeWidth: isSelected ? 2 : (isHighlighted ? 1.2 : 0.5),
                              outline: 'none',
                              filter: (isSelected || isHighlighted) ? 'brightness(1.3)' : 'none',
                              transition: 'all 0.2s ease'
                            },
                            hover: {
                              fill: isInRegion ? getRiskColor(csi) : '#2a2a2a',
                              stroke: '#7fa89f',
                              strokeWidth: isInRegion ? 1.5 : 0.5,
                              outline: 'none',
                              cursor: isInRegion ? 'pointer' : 'default',
                              filter: isInRegion ? 'brightness(1.4)' : 'none'
                            },
                            pressed: {
                              fill: fillColor,
                              stroke: '#7fa89f',
                              strokeWidth: 1,
                              outline: 'none'
                            }
                          }}
                          onMouseEnter={() => {
                            if (isInRegion) {
                              setHoveredCountry(geo.properties.name);
                              setTooltipContent({
                                name: countryName,
                                csi: csi,
                                level: getRiskLevel(csi)
                              });
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredCountry(null);
                            setTooltipContent(null);
                          }}
                          onClick={() => {
                            if (isInRegion) {
                              handleCountryClick(geo.properties.name);
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        {/* Footer info */}
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

export default GlobalRiskHeatmap;