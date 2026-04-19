/**
 * Scenario Impact Summary Component (S2)
 * Displays high-level impact metrics and risk assessment with ΔCO-GRI
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Download, 
  Share2, 
  TrendingUp, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LensBadge } from '@/components/common/LensBadge';
import { ScenarioResult, RiskLevel } from '@/types/scenario';

interface ScenarioImpactSummaryProps {
  result: ScenarioResult | null;
  scenarioName?: string;
  isLoading?: boolean;
}

// Risk level colors
const RISK_COLORS: Record<RiskLevel, string> = {
  'Low Risk': 'text-green-600 bg-green-50 border-green-200',
  'Moderate Risk': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  'Elevated': 'text-orange-600 bg-orange-50 border-orange-200',
  'High Risk': 'text-red-600 bg-red-50 border-red-200',
  'Very High Risk': 'text-red-800 bg-red-100 border-red-300'
};

// ΔCO-GRI color coding by magnitude
function getDeltaColor(delta: number): string {
  if (delta < 0) return 'text-green-600';
  if (delta < 5) return 'text-yellow-600';
  if (delta < 10) return 'text-orange-600';
  return 'text-red-600';
}

function getDeltaBgColor(delta: number): string {
  if (delta < 0) return 'bg-green-50 border-green-200';
  if (delta < 5) return 'bg-yellow-50 border-yellow-200';
  if (delta < 10) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

export default function ScenarioImpactSummary({ 
  result, 
  scenarioName = 'Scenario Analysis',
  isLoading = false 
}: ScenarioImpactSummaryProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Scenario Impact Summary</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-muted-foreground">Calculating scenario impact...</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Scenario Impact Summary</CardTitle>
            <LensBadge lens="Scenario Shock" />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-semibold">No Scenario Results</p>
              <p className="text-sm text-muted-foreground mt-1">
                Configure and run a scenario to see impact analysis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { 
    baselineCOGRI, 
    scenarioCOGRI, 
    deltaCOGRI, 
    deltaPercentage,
    baselineRiskLevel,
    scenarioRiskLevel,
    riskLevelChange,
    confidence
  } = result;

  // Calculate confidence interval (±10% of delta as example)
  const confidenceInterval = Math.abs(deltaCOGRI * 0.1);

  const deltaIcon = deltaCOGRI > 0 ? ArrowUp : deltaCOGRI < 0 ? ArrowDown : Minus;
  const deltaColor = getDeltaColor(deltaCOGRI);
  const deltaBgColor = getDeltaBgColor(deltaCOGRI);
  const deltaSign = deltaCOGRI > 0 ? '+' : '';

  // Generate executive summary
  const generateExecutiveSummary = () => {
    const direction = deltaCOGRI > 0 ? 'increases' : deltaCOGRI < 0 ? 'decreases' : 'remains stable';
    const magnitude = Math.abs(deltaPercentage) > 50 ? 'significantly' : 
                     Math.abs(deltaPercentage) > 20 ? 'substantially' : 'moderately';
    
    const riskChange = riskLevelChange === 'Stable' 
      ? `Risk level remains at ${baselineRiskLevel}.`
      : `Risk level ${riskLevelChange === 'Upgrade' ? 'escalates' : 'de-escalates'} from ${baselineRiskLevel} to ${scenarioRiskLevel}.`;
    
    return `The "${scenarioName}" scenario ${magnitude} ${direction} the company's geopolitical risk score by ${Math.abs(deltaCOGRI).toFixed(1)} points (${Math.abs(deltaPercentage).toFixed(1)}%). ${riskChange} This analysis is based on multi-channel exposure assessment with ${(confidence * 100).toFixed(0)}% confidence.`;
  };

  const executiveSummary = generateExecutiveSummary();

  // Calculate gauge percentage (0-100 scale)
  const gaugePercentage = Math.min(100, Math.max(0, scenarioCOGRI));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Scenario Impact Summary</CardTitle>
          <LensBadge lens="Scenario Shock" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        {/* Score Comparison: Baseline vs Scenario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Baseline Score */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Baseline CO-GRI</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{baselineCOGRI.toFixed(1)}</p>
            </div>
            <Badge className={`${RISK_COLORS[baselineRiskLevel]} text-xs`} variant="outline">
              {baselineRiskLevel}
            </Badge>
          </div>

          {/* Arrow Separator */}
          <div className="flex justify-center items-center">
            <div className="text-4xl text-orange-500 font-bold">→</div>
          </div>
          
          {/* Scenario Score */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Scenario CO-GRI</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{scenarioCOGRI.toFixed(1)}</p>
            </div>
            <Badge className={`${RISK_COLORS[scenarioRiskLevel]} text-xs`} variant="outline">
              {scenarioRiskLevel}
            </Badge>
          </div>
        </div>

        {/* ΔCO-GRI Display - Large and Prominent */}
        <div className={`${deltaBgColor} border-2 rounded-lg p-6`}>
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  ΔCO-GRI (Change)
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Change in CO-GRI score from baseline to scenario. 
                        Positive values indicate increased risk, negative values indicate decreased risk.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <p className={`text-6xl font-bold ${deltaColor}`}>
                    {deltaSign}{deltaCOGRI.toFixed(1)}
                  </p>
                  {React.createElement(deltaIcon, { className: `h-10 w-10 ${deltaColor}` })}
                </div>
                <div className="space-y-1">
                  <p className={`text-3xl font-semibold ${deltaColor}`}>
                    ({deltaSign}{deltaPercentage.toFixed(1)}%)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ± {confidenceInterval.toFixed(1)} points
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Gauge */}
            <div className="hidden md:block">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(gaugePercentage / 100) * 351.86} 351.86`}
                    className={deltaColor.replace('text-', 'text-')}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{scenarioCOGRI.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Risk Level Change */}
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Risk Level Change:
              </span>
              <div className="flex items-center gap-2">
                <span className={RISK_COLORS[baselineRiskLevel].split(' ')[0] + ' font-semibold'}>
                  {baselineRiskLevel}
                </span>
                <span className="text-orange-600 font-bold">→</span>
                <span className={RISK_COLORS[scenarioRiskLevel].split(' ')[0] + ' font-semibold'}>
                  {scenarioRiskLevel}
                </span>
                {riskLevelChange !== 'Stable' && (
                  <Badge 
                    variant={riskLevelChange === 'Upgrade' ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {riskLevelChange}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Before/After Comparison Bars */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Score Comparison</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">Baseline</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, baselineCOGRI)}%` }}
                />
              </div>
              <span className="text-xs font-semibold w-12 text-right">{baselineCOGRI.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">Scenario</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    deltaCOGRI >= 10 ? 'bg-red-500' :
                    deltaCOGRI >= 5 ? 'bg-orange-500' :
                    deltaCOGRI >= 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, scenarioCOGRI)}%` }}
                />
              </div>
              <span className="text-xs font-semibold w-12 text-right">{scenarioCOGRI.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Confidence Score</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Based on data quality (exposure coverage, shock data freshness, alignment coverage).
                      Higher confidence indicates more reliable scenario results.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="font-semibold">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={confidence * 100} className="h-2" />
        </div>

        {/* Executive Summary - Expandable */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Executive Summary</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(executiveSummary)}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="h-8 px-2"
              >
                {summaryExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {summaryExpanded && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-sm leading-relaxed">
                {executiveSummary}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}