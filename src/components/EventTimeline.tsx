/**
 * Phase 5D-4: Event Timeline Component
 * 
 * Displays geopolitical events in a timeline format
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import type { GeopoliticalEvent } from '@/types/forecast.types';

interface EventTimelineProps {
  events: GeopoliticalEvent[];
  className?: string;
}

export function EventTimeline({ events, className = '' }: EventTimelineProps) {
  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'HIGH':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'MEDIUM':
        return <Info className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-red-300 bg-red-50';
      case 'HIGH':
        return 'border-orange-300 bg-orange-50';
      case 'MEDIUM':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-blue-300 bg-blue-50';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-red-600';
    if (probability >= 0.5) return 'text-orange-600';
    if (probability >= 0.3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const sortedEvents = [...events].sort((a, b) => {
    // Sort by risk level first (CRITICAL > HIGH > MEDIUM > LOW)
    const riskOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    
    // Then by probability (higher first)
    return b.probability - a.probability;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Geopolitical Events Forecast</CardTitle>
        <CardDescription>
          Key events that may impact geopolitical risk in 2026
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <Alert key={index} className={getRiskLevelColor(event.riskLevel)}>
              <div className="space-y-3">
                {/* Event Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getRiskLevelIcon(event.riskLevel)}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {event.event}
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getRiskBadgeColor(event.riskLevel)}>
                          {event.riskLevel} RISK
                        </Badge>
                        <Badge variant="outline">
                          {event.timeline}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getProbabilityColor(event.probability)}`}>
                      {(event.probability * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-600">Probability</div>
                  </div>
                </div>

                {/* Event Description */}
                <AlertDescription className="text-sm text-gray-700">
                  {event.description}
                </AlertDescription>

                {/* Affected Countries */}
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-600">Affected:</span>
                  {event.affectedCountries.slice(0, 6).map((country, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {country}
                    </Badge>
                  ))}
                  {event.affectedCountries.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.affectedCountries.length - 6} more
                    </Badge>
                  )}
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Base Impact</div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-gray-900">
                        +{event.baseImpact.toFixed(1)} points
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Investment Impact</div>
                    <div className="text-sm text-gray-700">
                      {event.investmentImpact.substring(0, 50)}
                      {event.investmentImpact.length > 50 && '...'}
                    </div>
                  </div>
                </div>

                {/* Sector Impacts */}
                {Object.keys(event.sectorImpacts).length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Sector Multipliers
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(event.sectorImpacts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 4)
                        .map(([sector, multiplier]) => (
                          <div
                            key={sector}
                            className="px-2 py-1 bg-white rounded border text-xs"
                          >
                            <span className="font-medium">{sector}:</span>{' '}
                            <span className={multiplier > 1 ? 'text-red-600' : 'text-green-600'}>
                              {multiplier.toFixed(2)}x
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </Alert>
          ))}

          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No geopolitical events identified for this forecast period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}