/**
 * Regional Assessment Component (F5)
 * Displays regional risk outlook and key events
 * Part of CO-GRI Platform Phase 3 - Week 7
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RegionalAssessment as RegionalAssessmentType } from '@/types/forecast';

interface RegionalAssessmentProps {
  assessments: RegionalAssessmentType[];
}

export function RegionalAssessment({ assessments }: RegionalAssessmentProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Increasing':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'Decreasing':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'Increasing':
        return 'text-red-600';
      case 'Decreasing':
        return 'text-green-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Regional Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {assessments.map((assessment) => (
            <div key={assessment.region} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
              {/* Region Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{assessment.region}</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessment.countries.slice(0, 5).join(', ')}
                    {assessment.countries.length > 5 && ` +${assessment.countries.length - 5} more`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(assessment.risk_trajectory)}
                  <span className={`font-medium ${getTrendColor(assessment.risk_trajectory)}`}>
                    {assessment.risk_trajectory}
                  </span>
                </div>
              </div>

              {/* Risk Levels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Level</p>
                  <p className="text-2xl font-bold">{assessment.current_level.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">6M Forecast</p>
                  <p className="text-2xl font-bold">{assessment.forecast_level.toFixed(1)}</p>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm text-muted-foreground">{assessment.summary}</p>

              {/* Key Events */}
              {assessment.key_events.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Key Events</p>
                  <div className="space-y-2">
                    {assessment.key_events.slice(0, 3).map((event) => (
                      <div key={event.event_id} className="p-2 border rounded-lg">
                        <p className="text-sm font-medium">{event.event_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {(event.probability * 100).toFixed(0)}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {event.timing}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sector Implications */}
              {assessment.sector_implications.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Sector Implications</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {assessment.sector_implications.map((implication, idx) => {
                      const impactColors = {
                        'Positive': 'text-green-600',
                        'Negative': 'text-red-600',
                        'Mixed': 'text-yellow-600'
                      };

                      return (
                        <div key={idx} className="p-2 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{implication.sector}</span>
                            <span className={`text-xs font-medium ${impactColors[implication.impact]}`}>
                              {implication.impact}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{implication.reasoning}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}