/**
 * Phase 5D-4: Forecast Card Component
 * 
 * Displays predictive COGRI forecast with confidence indicators
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PredictiveCOGRI, TimeHorizon, ScenarioType } from '@/types/forecast.types';

interface ForecastCardProps {
  forecast: PredictiveCOGRI;
  showDetails?: boolean;
  className?: string;
}

export function ForecastCard({ forecast, showDetails = true, className = '' }: ForecastCardProps) {
  const getTrendIcon = () => {
    if (forecast.delta > 2) return <TrendingUp className="h-5 w-5 text-red-500" />;
    if (forecast.delta < -2) return <TrendingDown className="h-5 w-5 text-green-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (forecast.delta > 2) return 'text-red-600';
    if (forecast.delta < -2) return 'text-green-600';
    return 'text-gray-600';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low Risk': return 'bg-green-100 text-green-800 border-green-300';
      case 'Moderate Risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'High Risk': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Very High Risk': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimeHorizonLabel = (horizon: TimeHorizon) => {
    const labels = {
      '6m': '6 Months',
      '1y': '1 Year',
      '2y': '2 Years',
      '5y': '5 Years'
    };
    return labels[horizon];
  };

  const getScenarioLabel = (scenario: ScenarioType) => {
    const labels = {
      'base': 'Base Case',
      'optimistic': 'Optimistic',
      'pessimistic': 'Pessimistic'
    };
    return labels[scenario];
  };

  const getScenarioBadgeColor = (scenario: ScenarioType) => {
    const colors = {
      'base': 'bg-blue-100 text-blue-800 border-blue-300',
      'optimistic': 'bg-green-100 text-green-800 border-green-300',
      'pessimistic': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[scenario];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Moderate';
    return 'Low';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Predictive COGRI</CardTitle>
            <CardDescription>
              {getTimeHorizonLabel(forecast.timeHorizon)} Forecast
            </CardDescription>
          </div>
          <Badge className={getScenarioBadgeColor(forecast.scenario)}>
            {getScenarioLabel(forecast.scenario)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Current Score</div>
              <div className="text-3xl font-bold text-gray-900">
                {forecast.currentScore.toFixed(1)}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Predicted Score</div>
              <div className="text-3xl font-bold text-blue-600">
                {forecast.predictedScore.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Change Indicator */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
            {getTrendIcon()}
            <div>
              <div className={`text-2xl font-bold ${getTrendColor()}`}>
                {forecast.delta > 0 ? '+' : ''}{forecast.delta.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">
                {forecast.percentageChange > 0 ? '+' : ''}{forecast.percentageChange.toFixed(1)}% change
              </div>
            </div>
          </div>

          {/* Risk Level */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Predicted Risk Level</div>
            <Badge className={`text-base px-4 py-2 ${getRiskLevelColor(forecast.riskLevel)}`}>
              {forecast.riskLevel}
            </Badge>
          </div>

          {/* Confidence Indicator */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Forecast confidence based on data quality,</p>
                    <p>coverage, and time horizon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm font-medium">Confidence</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-bold ${getConfidenceColor(forecast.confidence)}`}>
                {(forecast.confidence * 100).toFixed(0)}%
              </span>
              <Badge variant="outline" className={getConfidenceColor(forecast.confidence)}>
                {getConfidenceLabel(forecast.confidence)}
              </Badge>
            </div>
          </div>

          {/* Driving Factors */}
          {showDetails && forecast.drivingFactors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Key Drivers</span>
              </div>
              <ul className="space-y-1">
                {forecast.drivingFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-gray-600 pl-6">
                    • {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calculation Timestamp */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Calculated: {new Date(forecast.calculatedAt).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}