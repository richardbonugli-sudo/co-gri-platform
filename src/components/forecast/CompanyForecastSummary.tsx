/**
 * Company Forecast Summary Component
 * Displays company-specific forecast outlook and impact
 * Part of CO-GRI Platform Phase 3 - Week 8
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { CompanyForecastOutlook } from '@/types/forecast';

interface CompanyForecastSummaryProps {
  outlook: CompanyForecastOutlook;
  onViewFullForecast?: () => void;
  onViewCompanyMode?: () => void;
}

export function CompanyForecastSummary({ 
  outlook, 
  onViewFullForecast,
  onViewCompanyMode 
}: CompanyForecastSummaryProps) {
  const outlookColors = {
    'Headwind': 'bg-red-100 text-red-800 border-red-200',
    'Tailwind': 'bg-green-100 text-green-800 border-green-200',
    'Mixed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Neutral': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const outlookIcons = {
    'Headwind': <TrendingUp className="h-5 w-5 text-red-600" />,
    'Tailwind': <TrendingDown className="h-5 w-5 text-green-600" />,
    'Mixed': <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    'Neutral': <TrendingUp className="h-5 w-5 text-blue-600" />
  };

  const confidenceColors = {
    'High': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-red-100 text-red-800'
  };

  const deltaColor = outlook.expected_delta_CO_GRI > 0 
    ? 'text-red-600' 
    : outlook.expected_delta_CO_GRI < 0 
    ? 'text-green-600' 
    : 'text-gray-600';

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              {outlook.company_name} ({outlook.ticker})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Forecast Outlook • {outlook.horizon}
            </p>
          </div>
          <Badge className={outlookColors[outlook.outlook]} variant="outline">
            <span className="flex items-center gap-1">
              {outlookIcons[outlook.outlook]}
              {outlook.outlook}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expected Impact Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Expected ΔCO-GRI */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Expected ΔCO-GRI</p>
            <p className={`text-2xl font-bold ${deltaColor}`}>
              {outlook.expected_delta_CO_GRI > 0 ? '+' : ''}
              {outlook.expected_delta_CO_GRI.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Base case scenario
            </p>
          </div>

          {/* Confidence Level */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Confidence Level</p>
            <Badge className={confidenceColors[outlook.confidence]} variant="outline">
              {outlook.confidence}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {outlook.top_forecast_drivers.length} events
            </p>
          </div>

          {/* Time Horizon */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Time Horizon</p>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{outlook.horizon}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Updated: {outlook.last_updated.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Scenario Range */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Scenario Range</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Best Case</p>
              <p className="text-lg font-semibold text-green-600">
                {outlook.delta_range.best_case > 0 ? '+' : ''}
                {outlook.delta_range.best_case.toFixed(1)}
              </p>
            </div>
            <div className="p-3 border rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">Base Case</p>
              <p className={`text-lg font-semibold ${deltaColor}`}>
                {outlook.delta_range.base_case > 0 ? '+' : ''}
                {outlook.delta_range.base_case.toFixed(1)}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Worst Case</p>
              <p className="text-lg font-semibold text-red-600">
                {outlook.delta_range.worst_case > 0 ? '+' : ''}
                {outlook.delta_range.worst_case.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Top Forecast Drivers */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Top Forecast Drivers</p>
          <div className="space-y-2">
            {outlook.top_forecast_drivers.slice(0, 3).map((event) => (
              <div key={event.event_id} className="p-3 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.event_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.why_relevant}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {(event.probability * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-muted-foreground">{event.timing}</span>
                  <span className={event.expected_delta_CO_GRI > 0 ? 'text-red-600' : 'text-green-600'}>
                    {event.expected_delta_CO_GRI > 0 ? '+' : ''}
                    {event.expected_delta_CO_GRI.toFixed(1)} ΔCO-GRI
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Materiality: {event.materiality_score.toFixed(0)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Impact Assessment */}
        {outlook.channel_impact_assessment.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Channel Impact Assessment</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outlook.channel_impact_assessment.map((assessment) => {
                const directionColors = {
                  'Increasing': 'text-red-600',
                  'Decreasing': 'text-green-600',
                  'Stable': 'text-gray-600'
                };

                const severityColors = {
                  'High': 'bg-red-100 text-red-800',
                  'Medium': 'bg-yellow-100 text-yellow-800',
                  'Low': 'bg-blue-100 text-blue-800'
                };

                return (
                  <div key={assessment.channel} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{assessment.channel}</span>
                      <Badge className={severityColors[assessment.severity]} variant="outline">
                        {assessment.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium ${directionColors[assessment.direction]}`}>
                        {assessment.direction}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{assessment.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {outlook.recommended_actions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Recommended Actions</p>
            <div className="space-y-2">
              {outlook.recommended_actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {onViewFullForecast && (
            <Button variant="outline" onClick={onViewFullForecast} className="gap-2">
              View Full Forecast
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {onViewCompanyMode && (
            <Button onClick={onViewCompanyMode} className="gap-2">
              View in Company Mode
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Data Coverage */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Data Coverage: {(outlook.data_coverage * 100).toFixed(0)}% • 
          Last Updated: {outlook.last_updated.toLocaleDateString()} • 
          Confidence: {outlook.confidence}
        </div>
      </CardContent>
    </Card>
  );
}