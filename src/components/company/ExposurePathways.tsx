/**
 * Exposure Pathways (C4)
 * Channel breakdown showing how risk transmits
 * Part of CO-GRI Platform Phase 2 - Week 3
 * 
 * Implements specification Part 3.3 C4
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  Package, 
  Building, 
  CreditCard,
  AlertTriangle,
  Info
} from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import { CountryExposure } from '@/types/company';
import { 
  ChannelExposure,
  STANDARD_CHANNEL_WEIGHTS,
  generateChannelExposures 
} from '@/utils/channelCalculations';

interface ExposurePathwaysProps {
  ticker: string;
  countryExposures: CountryExposure[];
  channelExposures?: ChannelExposure[];  // Optional pre-calculated
  channelForecastImpacts?: Array<{
    channel: string;
    direction: 'Increasing' | 'Decreasing' | 'Stable';
    severity: 'High' | 'Medium' | 'Low';
    explanation: string;
    expected_delta: number;
  }>;
}

export const ExposurePathways: React.FC<ExposurePathwaysProps> = ({
  ticker,
  countryExposures,
  channelExposures,
  channelForecastImpacts
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);

  // Calculate base score for channel risk calculation
  const baseScore = countryExposures.reduce((sum, ce) => sum + ce.contribution, 0);

  // Generate channel exposures if not provided
  const channels = channelExposures || generateChannelExposures(countryExposures, baseScore);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Revenue': return DollarSign;
      case 'Supply Chain': return Package;
      case 'Physical Assets': return Building;
      case 'Financial': return CreditCard;
      default: return Info;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Revenue': return 'text-green-600';
      case 'Supply Chain': return 'text-blue-600';
      case 'Physical Assets': return 'text-purple-600';
      case 'Financial': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'Increasing': return TrendingUp;
      case 'Decreasing': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'Increasing': return 'text-red-600';
      case 'Decreasing': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full" data-testid="exposure-pathways">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Exposure Pathways
        </CardTitle>
        <CardDescription>
          How risk transmits through different business channels
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="structural">Structural</TabsTrigger>
            {activeLens === 'Forecast Overlay' && (
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            )}
            {activeLens === 'Scenario Shock' && (
              <TabsTrigger value="scenario">Scenario</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {channels.map((channel) => {
                const Icon = getChannelIcon(channel.channel);
                const colorClass = getChannelColor(channel.channel);
                const riskColorClass = getRiskScoreColor(channel.riskScore);

                return (
                  <Card key={channel.channel} className="border-l-4" style={{
                    borderLeftColor: channel.channel === 'Revenue' ? '#16a34a' :
                                    channel.channel === 'Supply Chain' ? '#2563eb' :
                                    channel.channel === 'Physical Assets' ? '#9333ea' :
                                    '#f97316'
                  }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${colorClass}`} />
                          <CardTitle className="text-lg">{channel.channel}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          {(channel.weight * 100).toFixed(0)}% weight
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Channel Risk Score</span>
                        <span className={`text-xl font-bold ${riskColorClass}`}>
                          {channel.riskScore.toFixed(1)}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Top Countries</span>
                          <span className="text-xs text-muted-foreground">
                            {channel.topCountries.length} countries
                          </span>
                        </div>
                        <div className="space-y-2">
                          {channel.topCountries.slice(0, 3).map((country, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-24 truncate">
                                {country.country}
                              </span>
                              <Progress 
                                value={country.percentage} 
                                className="flex-1 h-2"
                              />
                              <span className="text-xs text-muted-foreground w-12 text-right">
                                {country.percentage.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Forecast Impact */}
                      {activeLens === 'Forecast Overlay' && channel.forecastImpact && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {React.createElement(
                                getTrendIcon(channel.forecastImpact.direction),
                                { className: `h-4 w-4 ${getTrendColor(channel.forecastImpact.direction)}` }
                              )}
                              <span className="text-sm font-medium">
                                {channel.forecastImpact.direction}
                              </span>
                            </div>
                            <Badge variant="outline" className={
                              channel.forecastImpact.severity === 'High' ? 'bg-red-100 text-red-700 border-red-300' :
                              channel.forecastImpact.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                              'bg-green-100 text-green-700 border-green-300'
                            }>
                              {channel.forecastImpact.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {channel.forecastImpact.explanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Structural Tab */}
          <TabsContent value="structural" className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Structural View</h4>
              <p className="text-sm text-blue-800 mb-3">
                Current state channel breakdown based on existing exposures and country shocks.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-sm">Channel Weights</h5>
              {Object.entries(STANDARD_CHANNEL_WEIGHTS).map(([channel, weight]) => (
                <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{channel}</span>
                  <div className="flex items-center gap-3">
                    <Progress value={weight * 100} className="w-32 h-2" />
                    <span className="text-sm font-semibold w-12 text-right">
                      {(weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          {activeLens === 'Forecast Overlay' && (
            <TabsContent value="forecast" className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Forecast Overlay</h4>
                <p className="text-sm text-purple-800 mb-3">
                  Expected changes in channel risk based on forecast events (6-12 months).
                </p>
              </div>

              {channelForecastImpacts && channelForecastImpacts.length > 0 ? (
                <div className="space-y-3">
                  {channelForecastImpacts.map((impact, idx) => {
                    const TrendIcon = getTrendIcon(impact.direction);
                    const trendColor = getTrendColor(impact.direction);

                    return (
                      <Card key={idx}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{impact.channel}</CardTitle>
                            <div className="flex items-center gap-2">
                              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                              <Badge variant="outline" className={
                                impact.severity === 'High' ? 'bg-red-100 text-red-700 border-red-300' :
                                impact.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                'bg-green-100 text-green-700 border-green-300'
                              }>
                                {impact.severity}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {impact.explanation}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Expected ΔCO-GRI</span>
                            <span className={`font-semibold ${impact.expected_delta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {impact.expected_delta > 0 ? '+' : ''}{impact.expected_delta.toFixed(1)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No forecast impact data available
                </div>
              )}
            </TabsContent>
          )}

          {/* Scenario Tab */}
          {activeLens === 'Scenario Shock' && (
            <TabsContent value="scenario" className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-900 mb-2">Scenario Analysis</h4>
                  <p className="text-sm text-orange-800">
                    Channel-specific impacts under the active scenario. Scenario builder allows you to model
                    custom shocks to specific countries and channels.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExposurePathways;