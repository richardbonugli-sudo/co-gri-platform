/**
 * Company Summary Panel (C1)
 * Single-glance state and investor-facing interpretation
 * Part of CO-GRI Platform Phase 2 - Week 2
 * 
 * Implements specification Part 3.3 C1
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';
import { RiskLevel, TrendDirection } from '@/types/company';
import { 
  getRiskLevel, 
  getTrendDirection, 
  calculateConcentration,
  getRiskLevelColor,
  getTrendStyle,
  formatDelta 
} from '@/utils/riskCalculations';

interface CompanySummaryPanelProps {
  ticker: string;
  companyName: string;
  sector: string;
  homeCountry: string;
  cogriScore: number;
  /** P2-4: Score uncertainty band (±) from evidence tier mix */
  scoreUncertainty?: number;
  previousScore?: number;  // For delta calculation
  riskContributions?: number[];  // For HHI calculation
  primaryDriver?: {
    country: string;
    channel: 'Revenue' | 'Supply Chain' | 'Physical Assets' | 'Financial';
  };
  // Forecast Overlay fields (optional)
  forecastOverlay?: {
    forecast_outlook: 'Headwind' | 'Tailwind' | 'Mixed';
    confidence: 'High' | 'Medium' | 'Low';
    horizon: string;
    expected_delta_CO_GRI: number;
  };
  // Scenario Shock fields (optional)
  scenarioShock?: {
    scenario_title: string;
    assumptions_summary: string;
    CO_GRI_scenario: number;
    delta_CO_GRI: number;
    top_impacted_channels: string[];
    top_impacted_countries: string[];
  };
  // Trading Signal fields (optional)
  tradingSignal?: {
    recommendation: 'Increase' | 'Decrease' | 'Hold';
    confidence: number;
    expected_impact: {
      return_delta: number;
      risk_reduction: number;
    };
  };
}

export const CompanySummaryPanel: React.FC<CompanySummaryPanelProps> = ({
  ticker,
  companyName,
  sector,
  homeCountry,
  cogriScore,
  scoreUncertainty,
  previousScore,
  riskContributions,
  primaryDriver,
  forecastOverlay,
  scenarioShock,
  tradingSignal
}) => {
  const activeLens = useGlobalState((state) => state.active_company_lens);

  // Calculate derived metrics
  const riskLevel = getRiskLevel(cogriScore);
  const delta_CO_GRI = previousScore ? cogriScore - previousScore : 0;
  const direction = previousScore ? getTrendDirection(cogriScore, previousScore) : TrendDirection.STABLE;
  
  // Calculate concentration if risk contributions provided
  const concentration = riskContributions 
    ? calculateConcentration(riskContributions.map(r => r / 100)) // Convert percentages to decimals
    : null;

  const trendStyle = getTrendStyle(direction);
  const riskLevelColor = getRiskLevelColor(riskLevel);

  const TrendIcon = direction === TrendDirection.INCREASING ? TrendingUp 
    : direction === TrendDirection.DECREASING ? TrendingDown 
    : Minus;

  return (
    <Card className="w-full" data-testid="company-summary-panel">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {companyName}
            </CardTitle>
            <CardDescription className="mt-2">
              {ticker} • {sector} • {homeCountry}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary mb-2">
              {cogriScore.toFixed(1)}
              {scoreUncertainty !== undefined && (
                <span className="text-xl font-normal text-muted-foreground ml-1">
                  ± {scoreUncertainty.toFixed(1)}
                </span>
              )}
            </div>
            <Badge className={riskLevelColor}>
              {riskLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Structural View (Default) */}
          {activeLens === 'Structural' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">CO-GRI Score</span>
                    <span className="font-semibold">
                      {cogriScore.toFixed(1)}
                      {scoreUncertainty !== undefined && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          ± {scoreUncertainty.toFixed(1)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <Badge variant="outline" className={riskLevelColor}>
                      {riskLevel}
                    </Badge>
                  </div>
                  {previousScore && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Δ30D</span>
                      <div className="flex items-center gap-2">
                        <TrendIcon className={`h-4 w-4 ${trendStyle.color}`} />
                        <span className={`font-semibold ${trendStyle.color}`}>
                          {formatDelta(delta_CO_GRI)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Direction</span>
                    <Badge variant="outline">{direction}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {primaryDriver && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Primary Driver</span>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{primaryDriver.country}</div>
                        <div className="text-xs text-muted-foreground">{primaryDriver.channel}</div>
                      </div>
                    </div>
                  )}
                  {concentration && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">Concentration</span>
                        <Badge variant="outline" className={
                          concentration.label === 'Concentrated' 
                            ? 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-green-100 text-green-700 border-green-300'
                        }>
                          {concentration.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground">HHI</span>
                        <span className="font-semibold">{concentration.HHI.toFixed(3)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Forecast Overlay View */}
          {activeLens === 'Forecast Overlay' && forecastOverlay && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-3">
                  Forecast Outlook ({forecastOverlay.horizon})
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Outlook</span>
                      <Badge className={
                        forecastOverlay.forecast_outlook === 'Headwind' 
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : forecastOverlay.forecast_outlook === 'Tailwind'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      }>
                        {forecastOverlay.forecast_outlook}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Confidence</span>
                      <Badge variant="outline" className={
                        forecastOverlay.confidence === 'High'
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : forecastOverlay.confidence === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }>
                        {forecastOverlay.confidence}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Expected ΔCO-GRI</span>
                      <span className={`font-semibold ${
                        forecastOverlay.expected_delta_CO_GRI > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatDelta(forecastOverlay.expected_delta_CO_GRI)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Horizon</span>
                      <span className="font-semibold">{forecastOverlay.horizon}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scenario Shock View */}
          {activeLens === 'Scenario Shock' && scenarioShock && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">
                  {scenarioShock.scenario_title}
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  {scenarioShock.assumptions_summary}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-700">Scenario CO-GRI</span>
                      <span className="font-semibold">{scenarioShock.CO_GRI_scenario.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-700">ΔCO-GRI</span>
                      <span className={`font-semibold ${
                        scenarioShock.delta_CO_GRI > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatDelta(scenarioShock.delta_CO_GRI)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-orange-700">Top Impacted Channels</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scenarioShock.top_impacted_channels.slice(0, 2).map((channel, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trading Signal View */}
          {activeLens === 'Trading Signal' && tradingSignal && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-3">
                  Trading Recommendation
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Recommendation</span>
                      <Badge className={
                        tradingSignal.recommendation === 'Increase'
                          ? 'bg-green-600 text-white'
                          : tradingSignal.recommendation === 'Decrease'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-600 text-white'
                      }>
                        {tradingSignal.recommendation}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Confidence</span>
                      <span className="font-semibold">
                        {(tradingSignal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Expected Return Δ</span>
                      <span className={`font-semibold ${
                        tradingSignal.expected_impact.return_delta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatDelta(tradingSignal.expected_impact.return_delta)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Risk Reduction</span>
                      <span className="font-semibold text-green-600">
                        {tradingSignal.expected_impact.risk_reduction.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* High Risk Alert */}
          {(riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.ELEVATED) && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-orange-900 mb-1">
                  {riskLevel === RiskLevel.HIGH ? 'High Risk Detected' : 'Elevated Risk Level'}
                </h5>
                <p className="text-sm text-orange-800">
                  This company has significant exposure to geopolitically sensitive regions. 
                  Review the detailed risk breakdown and consider diversification strategies.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySummaryPanel;