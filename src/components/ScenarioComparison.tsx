/**
 * Phase 5D-4: Scenario Comparison Component
 * 
 * Displays side-by-side comparison of base, optimistic, and pessimistic scenarios
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import type { ScenarioAnalysis } from '@/types/forecast.types';

interface ScenarioComparisonProps {
  analysis: ScenarioAnalysis;
  className?: string;
}

export function ScenarioComparison({ analysis, className = '' }: ScenarioComparisonProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low Risk': return 'bg-green-100 text-green-800';
      case 'Moderate Risk': return 'bg-yellow-100 text-yellow-800';
      case 'High Risk': return 'bg-orange-100 text-orange-800';
      case 'Very High Risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpreadSeverity = (spread: number) => {
    if (spread > 20) return { color: 'text-red-600', label: 'Very High Uncertainty' };
    if (spread > 15) return { color: 'text-orange-600', label: 'High Uncertainty' };
    if (spread > 10) return { color: 'text-yellow-600', label: 'Moderate Uncertainty' };
    return { color: 'text-green-600', label: 'Low Uncertainty' };
  };

  const spreadSeverity = getSpreadSeverity(analysis.scenarioRange.spread);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
          <CardDescription>
            {analysis.companyName} ({analysis.ticker}) • {analysis.sector}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Optimistic Scenario */}
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm font-medium text-green-800 mb-2">Optimistic</div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analysis.optimisticCase.predictedScore.toFixed(1)}
              </div>
              <Badge className={getRiskLevelColor(analysis.optimisticCase.riskLevel)}>
                {analysis.optimisticCase.riskLevel}
              </Badge>
              <div className="mt-2 text-sm text-green-700">
                {analysis.optimisticCase.delta > 0 ? '+' : ''}
                {analysis.optimisticCase.delta.toFixed(1)} pts
              </div>
            </div>

            {/* Base Case */}
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
              <div className="text-sm font-medium text-blue-800 mb-2">Base Case</div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analysis.baseCase.predictedScore.toFixed(1)}
              </div>
              <Badge className={getRiskLevelColor(analysis.baseCase.riskLevel)}>
                {analysis.baseCase.riskLevel}
              </Badge>
              <div className="mt-2 text-sm text-blue-700">
                {analysis.baseCase.delta > 0 ? '+' : ''}
                {analysis.baseCase.delta.toFixed(1)} pts
              </div>
            </div>

            {/* Pessimistic Scenario */}
            <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-sm font-medium text-red-800 mb-2">Pessimistic</div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {analysis.pessimisticCase.predictedScore.toFixed(1)}
              </div>
              <Badge className={getRiskLevelColor(analysis.pessimisticCase.riskLevel)}>
                {analysis.pessimisticCase.riskLevel}
              </Badge>
              <div className="mt-2 text-sm text-red-700">
                {analysis.pessimisticCase.delta > 0 ? '+' : ''}
                {analysis.pessimisticCase.delta.toFixed(1)} pts
              </div>
            </div>
          </div>

          {/* Scenario Range */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Scenario Range</span>
              <Badge variant="outline" className={spreadSeverity.color}>
                {spreadSeverity.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-medium">Min:</span> {analysis.scenarioRange.min.toFixed(1)}
              </div>
              <div>
                <span className="font-medium">Max:</span> {analysis.scenarioRange.max.toFixed(1)}
              </div>
              <div>
                <span className="font-medium">Spread:</span> {analysis.scenarioRange.spread.toFixed(1)} pts
              </div>
            </div>
            
            {/* Visual Range Bar */}
            <div className="mt-3 relative h-2 bg-gradient-to-r from-green-200 via-blue-200 to-red-200 rounded-full">
              <div 
                className="absolute top-0 h-2 bg-blue-500 rounded-full"
                style={{
                  left: `${((analysis.scenarioRange.min - 0) / 100) * 100}%`,
                  width: `${(analysis.scenarioRange.spread / 100) * 100}%`
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      {analysis.keyRisks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Key Risks</CardTitle>
            </div>
            <CardDescription>
              Potential adverse scenarios and risk factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.keyRisks.map((risk, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Opportunities */}
      {analysis.keyOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Key Opportunities</CardTitle>
            </div>
            <CardDescription>
              Potential favorable scenarios and opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.keyOpportunities.map((opportunity, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingDown className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{opportunity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommended Actions */}
      {analysis.recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Recommended Actions</CardTitle>
            </div>
            <CardDescription>
              Strategic recommendations based on scenario analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendedActions.map((action, index) => (
                <Alert key={index} className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-sm text-gray-700">
                    {action}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Metadata */}
      <div className="text-xs text-gray-500 text-center">
        Analysis Date: {new Date(analysis.analysisDate).toLocaleString()}
      </div>
    </div>
  );
}