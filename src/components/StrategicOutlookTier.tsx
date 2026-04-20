/**
 * Strategic Outlook Tier (Tier 1)
 * 
 * High-level strategic insights for C-Suite executives and board members.
 * Provides executive summary, key events, risk movers, and investment implications.
 * 
 * @module StrategicOutlookTier
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import type { COGRIResult } from '@/utils/cogriCalculator';
import type { CedarOwlForecast, GeopoliticalEvent } from '@/types/forecast';
import type { AdjustedExposure } from '@/services/forecastEngine';

export interface StrategicOutlookTierProps {
  result: COGRIResult;
  forecast: CedarOwlForecast;
  exposures: AdjustedExposure[];
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Tier 1: Strategic Outlook Component
 * 
 * Target Audience: C-Suite Executives, Board Members
 * Purpose: High-level strategic insights and key takeaways
 */
export function StrategicOutlookTier({
  result,
  forecast,
  exposures,
  isExpanded,
  onToggle
}: StrategicOutlookTierProps) {
  // Calculate summary metrics
  const totalDelta = exposures.reduce((sum, exp) => sum + exp.delta, 0);
  const averageDelta = totalDelta / exposures.length;
  
  // Determine overall risk trend
  const improving = exposures.filter(exp => exp.riskTrend === 'IMPROVING').length;
  const deteriorating = exposures.filter(exp => exp.riskTrend === 'DETERIORATING').length;
  const overallTrend = improving > deteriorating ? 'IMPROVING' : 
                       deteriorating > improving ? 'DETERIORATING' : 'STABLE';

  // Get top 3 high-probability events
  const topEvents = forecast.geopoliticalEvents
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  // Get top 5 risk increases and decreases
  const riskIncreases = [...exposures]
    .filter(exp => exp.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  const riskDecreases = [...exposures]
    .filter(exp => exp.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 5);

  // Get investment recommendations from asset class forecasts
  const overweightAssets = Object.values(forecast.assetClassForecasts)
    .filter(ac => ac.recommendation === 'OVERWEIGHT')
    .sort((a, b) => b.expectedReturn - a.expectedReturn);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'DETERIORATING': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Tier 1: Strategic Outlook
            </CardTitle>
            <CardDescription>
              Executive summary and key strategic insights
            </CardDescription>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900">
                    Net Portfolio Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-700">
                    {averageDelta >= 0 ? '+' : ''}{averageDelta.toFixed(2)}
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Average CSI Change
                  </p>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${
                overallTrend === 'IMPROVING' ? 'from-green-50 to-green-100' :
                overallTrend === 'DETERIORATING' ? 'from-red-50 to-red-100' :
                'from-gray-50 to-gray-100'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Risk Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(overallTrend)}
                    <span className={`text-2xl font-bold ${
                      overallTrend === 'IMPROVING' ? 'text-green-700' :
                      overallTrend === 'DETERIORATING' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {overallTrend}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    {improving} improving, {deteriorating} deteriorating
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-900">
                    Forecast Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-700">
                    {(forecast.metadata.overallConfidence * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-purple-600 mt-1">
                    {forecast.metadata.expertSources} Expert Sources
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Key Geopolitical Events */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Key Geopolitical Events
              </h3>
              <div className="space-y-3">
                {topEvents.map((event, index) => (
                  <Card key={index} className="border-l-4" style={{
                    borderLeftColor: event.riskLevel === 'CRITICAL' ? '#EF4444' :
                                    event.riskLevel === 'HIGH' ? '#F97316' :
                                    event.riskLevel === 'MEDIUM' ? '#EAB308' : '#22C55E'
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{event.event}</h4>
                            <Badge className={getRiskLevelColor(event.riskLevel)}>
                              {event.riskLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">
                              Timeline: {event.timeline}
                            </span>
                            <span className="font-medium text-blue-600">
                              Probability: {(event.probability * 100).toFixed(0)}%
                            </span>
                            <span className="text-muted-foreground">
                              Affects {event.affectedCountries.length} countries
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Top Risk Movers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highest Risk Increases */}
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-red-700">
                  <TrendingUp className="h-5 w-5" />
                  Highest Risk Increases
                </h3>
                <div className="space-y-2">
                  {riskIncreases.map((exp, index) => (
                    <Card key={index} className="bg-red-50 border-red-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{exp.countryName}</p>
                            <p className="text-sm text-muted-foreground">
                              {exp.baseCsi.toFixed(1)} → {exp.adjustedCsi.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-700">
                              +{exp.delta.toFixed(2)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {exp.outlook}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Highest Risk Decreases */}
              <div>
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-green-700">
                  <TrendingDown className="h-5 w-5" />
                  Highest Risk Decreases
                </h3>
                <div className="space-y-2">
                  {riskDecreases.map((exp, index) => (
                    <Card key={index} className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{exp.countryName}</p>
                            <p className="text-sm text-muted-foreground">
                              {exp.baseCsi.toFixed(1)} → {exp.adjustedCsi.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-700">
                              {exp.delta.toFixed(2)}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {exp.outlook}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Investment Implications */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Investment Implications</h3>
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Overweights</h4>
                      <div className="flex flex-wrap gap-2">
                        {overweightAssets.map((asset, index) => (
                          <Badge key={index} className="bg-green-600 text-white">
                            {asset.assetClass}: +{(asset.expectedReturn * 100).toFixed(0)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Key Opportunities</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Defense sector: Elevated spending from geopolitical tensions</li>
                        <li>Energy: Supply disruption risks support prices</li>
                        <li>Emerging Markets: Selective opportunities in Asia-Pacific and Latin America</li>
                        <li>Commodities: Super-cycle driven by structural demand</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Risks to Monitor</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>US-China tech decoupling: Supply chain disruptions</li>
                        <li>Nuclear arms race: Elevated tail risk</li>
                        <li>European energy dependence: Persistent vulnerability</li>
                        <li>Emerging market volatility: Currency and political risks</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}