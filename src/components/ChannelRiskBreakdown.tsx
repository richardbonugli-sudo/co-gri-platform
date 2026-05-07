/**
 * Channel Risk Breakdown Component - Phase 2 Task 5
 * 
 * Displays the four-channel risk breakdown with individual multipliers:
 * - Revenue Channel
 * - Supply Chain Channel
 * - Assets Channel
 * - Financial Operations Channel
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { BlendedChannelMultiplierResult } from '@/services/channelMultiplierCalculation';

interface ChannelRiskBreakdownProps {
  result: BlendedChannelMultiplierResult;
  rawScore: number;
  sectorMultiplier: number;
}

export function ChannelRiskBreakdown({ result, rawScore, sectorMultiplier }: ChannelRiskBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  
  const phase1Score = rawScore * sectorMultiplier;
  const phase2Score = phase1Score * result.blendedMultiplier;
  const channelImpact = phase2Score - phase1Score;
  
  const getChannelColor = (channel: string): string => {
    const colors: Record<string, string> = {
      'Revenue': 'bg-cyan-500',
      'Supply': 'bg-teal-500',
      'Assets': 'bg-emerald-500',
      'Financial': 'bg-blue-500'
    };
    return colors[channel] || 'bg-gray-500';
  };
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'text-green-600';
    if (confidence >= 0.70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getConfidenceBadge = (confidence: number): string => {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.70) return 'Medium';
    return 'Low';
  };
  
  const getTrendIcon = (multiplier: number) => {
    if (multiplier > 1.05) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (multiplier < 0.95) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-cyan-900">
              Channel Risk Breakdown
            </CardTitle>
            <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-300">
              Phase 2
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-cyan-700 hover:text-cyan-900 hover:bg-cyan-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <CardDescription className="text-cyan-800">
          Four-channel risk assessment with individual multipliers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-cyan-200">
          <div>
            <p className="text-sm text-gray-600">Blended Multiplier</p>
            <p className="text-2xl font-bold text-cyan-900">{result.blendedMultiplier.toFixed(3)}x</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Channel Impact</p>
            <p className={`text-2xl font-bold ${channelImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {channelImpact > 0 ? '+' : ''}{channelImpact.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Channel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.channelResults.map((channelResult) => (
            <div
              key={channelResult.channel}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getChannelColor(channelResult.channel)}`} />
                  <h4 className="font-semibold text-gray-900">{channelResult.channel}</h4>
                  {getTrendIcon(channelResult.adjustedMultiplier)}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className={`${getConfidenceColor(channelResult.confidence)} border-current`}
                      >
                        {getConfidenceBadge(channelResult.confidence)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confidence: {(channelResult.confidence * 100).toFixed(1)}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Multiplier:</span>
                  <span className="font-medium">{channelResult.baseMultiplier.toFixed(3)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Adjusted Multiplier:</span>
                  <span className="font-medium text-cyan-700">{channelResult.adjustedMultiplier.toFixed(3)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{(result.weights[channelResult.channel.toLowerCase() as keyof typeof result.weights] * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              {expanded && channelResult.riskFactors && channelResult.riskFactors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Risk Factors:</p>
                  <ul className="space-y-1">
                    {channelResult.riskFactors.map((factor, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-cyan-500 mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Expanded Details */}
        {expanded && (
          <div className="p-4 bg-white rounded-lg border border-cyan-200 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-600" />
              <h4 className="font-semibold text-gray-900">Calculation Details</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Raw COGRI Score:</span>
                <span className="font-medium">{rawScore.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After Sector Multiplier ({sectorMultiplier.toFixed(2)}x):</span>
                <span className="font-medium">{phase1Score.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">After Channel Multiplier ({result.blendedMultiplier.toFixed(3)}x):</span>
                <span className="font-bold text-cyan-700">{phase2Score.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Overall Confidence:</strong> {(result.overallConfidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Channel multipliers are calculated based on geographic exposure distribution, 
                country risk scores, and historical calibration data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}