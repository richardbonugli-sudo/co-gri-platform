/**
 * Top Relevant Risks (C5)
 * Display 1-2 most relevant geopolitical risks
 * Part of CO-GRI Platform Phase 2 - Week 3
 * 
 * Implements specification Part 3.3 C5
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import { CountryExposure } from '@/types/company';
import { 
  StructuralDriver,
  ForecastEvent,
  getTopStructuralDrivers,
  getTopRelevantForecastEvents,
  generateForecastRelevanceExplanation
} from '@/utils/riskRelevance';

interface TopRelevantRisksProps {
  ticker: string;
  countryExposures?: CountryExposure[];
  risks?: StructuralDriver[];  // Pre-calculated structural drivers
  forecastDrivers?: Array<{
    event_id: string;
    event_name: string;
    probability: number;
    timing: string;
    why_relevant: string;
    expected_delta_CO_GRI: number;
    top_country_nodes: string[];
  }>;
}

export const TopRelevantRisks: React.FC<TopRelevantRisksProps> = ({
  ticker,
  countryExposures,
  risks,
  forecastDrivers
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);

  // Calculate structural drivers if not provided
  const structuralDrivers = risks || (countryExposures 
    ? getTopStructuralDrivers(countryExposures, 2)
    : []);

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Revenue': return 'bg-green-100 text-green-700 border-green-300';
      case 'Supply Chain': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Physical Assets': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Financial': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.7) return 'bg-red-100 text-red-700 border-red-300';
    if (probability > 0.5) return 'bg-orange-100 text-orange-700 border-orange-300';
    if (probability > 0.3) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  return (
    <Card className="w-full" data-testid="top-relevant-risks">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Top Relevant Risks
        </CardTitle>
        <CardDescription>
          {activeLens === 'Structural' && 'Key structural drivers of current risk'}
          {activeLens === 'Forecast Overlay' && 'Most relevant forecast events (6-12 months)'}
          {activeLens === 'Scenario Shock' && 'Scenario-specific risk drivers'}
          {activeLens === 'Trading Signal' && 'Risk factors affecting trading recommendation'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Structural View */}
        {activeLens === 'Structural' && (
          <div className="space-y-4">
            {structuralDrivers.length > 0 ? (
              structuralDrivers.map((driver, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-base">{driver.country}</CardTitle>
                      </div>
                      <Badge variant="outline" className={getChannelColor(driver.channel)}>
                        {driver.channel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Risk Contribution</div>
                        <div className="text-lg font-bold text-primary">
                          {driver.risk_contribution.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Risk Share</div>
                        <div className="text-lg font-bold text-primary">
                          {driver.risk_share.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {driver.explanation}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No structural drivers available
              </div>
            )}
          </div>
        )}

        {/* Forecast Overlay View */}
        {activeLens === 'Forecast Overlay' && (
          <div className="space-y-4">
            {forecastDrivers && forecastDrivers.length > 0 ? (
              forecastDrivers.map((event, idx) => (
                <Card key={idx} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{event.event_name}</CardTitle>
                      <Badge variant="outline" className={getProbabilityColor(event.probability)}>
                        {(event.probability * 100).toFixed(0)}% probability
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{event.timing}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Expected ΔCO-GRI</div>
                        <div className={`text-lg font-bold ${
                          event.expected_delta_CO_GRI > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {event.expected_delta_CO_GRI > 0 ? '+' : ''}
                          {event.expected_delta_CO_GRI.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Top Countries</div>
                        <div className="flex flex-wrap gap-1">
                          {event.top_country_nodes.slice(0, 3).map((country, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {event.why_relevant}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No relevant forecast events</p>
                <p className="text-xs">
                  Events are filtered by: exposure &gt;5%, |ΔCO-GRI| &gt; 2, probability &gt; 30%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scenario Shock View */}
        {activeLens === 'Scenario Shock' && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Scenario-Specific Drivers</h4>
            <p className="text-sm text-orange-800">
              Risk drivers under the active scenario will be displayed here. Use the Scenario Builder
              to create custom shock scenarios and analyze their impact on specific countries and channels.
            </p>
          </div>
        )}

        {/* Trading Signal View */}
        {activeLens === 'Trading Signal' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Risk Factors in Trading Signal
            </h4>
            <p className="text-sm text-green-800">
              Key risk factors influencing the trading recommendation will be displayed here,
              including expected return impact and risk reduction potential.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopRelevantRisks;