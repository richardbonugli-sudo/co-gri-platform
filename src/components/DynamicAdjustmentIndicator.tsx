/**
 * Dynamic Adjustment Indicator Component - Phase 2 Task 5
 * 
 * Displays active geopolitical events and market conditions affecting the COGRI score
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Calendar, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DynamicAdjustmentResult } from '@/services/dynamicAdjustmentRules';

interface DynamicAdjustmentIndicatorProps {
  result: DynamicAdjustmentResult;
  baseMultipliers: { revenue: number; supply: number; assets: number; financial: number };
}

export function DynamicAdjustmentIndicator({ result, baseMultipliers }: DynamicAdjustmentIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Extract applied rules from all channel adjustments
  const appliedRules = [
    ...new Set([
      ...(result.adjustments.revenue.appliedRules || []),
      ...(result.adjustments.supply.appliedRules || []),
      ...(result.adjustments.assets.appliedRules || []),
      ...(result.adjustments.financial.appliedRules || [])
    ])
  ];
  
  // Extract reasons (which contain event information)
  const allReasons = [
    ...(result.adjustments.revenue.reasons || []),
    ...(result.adjustments.supply.reasons || []),
    ...(result.adjustments.assets.reasons || []),
    ...(result.adjustments.financial.reasons || [])
  ];
  
  // Parse unique events from reasons
  const uniqueEvents = [...new Set(allReasons.map(r => r.split(':')[0]))];
  
  const getSeverityColor = (severity: number): string => {
    if (severity >= 8) return 'bg-red-500';
    if (severity >= 6) return 'bg-orange-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-blue-500';
  };
  
  const getSeverityLabel = (severity: number): string => {
    if (severity >= 8) return 'Critical';
    if (severity >= 6) return 'High';
    if (severity >= 4) return 'Medium';
    return 'Low';
  };
  
  const getPriorityColor = (priority: number): string => {
    if (priority >= 9) return 'text-red-600 border-red-300 bg-red-50';
    if (priority >= 7) return 'text-orange-600 border-orange-300 bg-orange-50';
    return 'text-yellow-600 border-yellow-300 bg-yellow-50';
  };

  return (
    <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold text-teal-900">
              Dynamic Risk Adjustments
            </CardTitle>
            <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300">
              Phase 2
            </Badge>
            {appliedRules.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {appliedRules.length} Active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-teal-700 hover:text-teal-900 hover:bg-teal-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <CardDescription className="text-teal-800">
          Real-time adjustments based on geopolitical events and market conditions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-teal-200">
          <div>
            <p className="text-sm text-gray-600">Total Adjustment</p>
            <p className="text-2xl font-bold text-teal-900">
              {result.blendedAdjustment > 1 ? '+' : ''}{((result.blendedAdjustment - 1) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Rules</p>
            <p className="text-2xl font-bold text-orange-600">{appliedRules.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="text-2xl font-bold text-green-600">{(result.overallConfidence * 100).toFixed(0)}%</p>
          </div>
        </div>
        
        {/* Active Events/Reasons */}
        {uniqueEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h4 className="font-semibold text-gray-900">Active Adjustments</h4>
            </div>
            
            <div className="space-y-2">
              {uniqueEvents.slice(0, expanded ? undefined : 3).map((eventName, idx) => {
                const relatedReasons = allReasons.filter(r => r.startsWith(eventName));
                const totalImpact = relatedReasons.reduce((sum, r) => {
                  const match = r.match(/\+(\d+\.?\d*)%/);
                  return sum + (match ? parseFloat(match[1]) : 0);
                }, 0);
                
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <h5 className="font-medium text-gray-900 text-sm">{eventName}</h5>
                      </div>
                      <Badge variant="outline" className="bg-orange-500 text-white border-transparent">
                        +{totalImpact.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    {expanded && (
                      <div className="space-y-2 mt-2">
                        <div className="text-xs text-gray-600">
                          {relatedReasons.map((reason, ridx) => (
                            <div key={ridx} className="mb-1">{reason}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {!expanded && uniqueEvents.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  className="w-full text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                >
                  Show {uniqueEvents.length - 3} more adjustments
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Channel Adjustments */}
        {expanded && (
          <div className="p-4 bg-white rounded-lg border border-teal-200">
            <h4 className="font-semibold text-gray-900 mb-3">Channel-Specific Adjustments</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(result.adjustments).map(([channel, adjustment]) => {
                const baseMultiplier = baseMultipliers[channel as keyof typeof baseMultipliers];
                const adjustedMultiplier = adjustment.adjustedMultiplier;
                const change = adjustedMultiplier - baseMultiplier;
                
                return (
                  <div key={channel} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 capitalize mb-1">{channel}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-teal-700">{adjustedMultiplier.toFixed(3)}x</span>
                      <span className={`text-xs ${change > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({change > 0 ? '+' : ''}{(change * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Base: {baseMultiplier.toFixed(3)}x</div>
                      <div>Geo: +{(adjustment.geopoliticalAdjustment * 100).toFixed(1)}%</div>
                      <div>Market: +{(adjustment.marketConditionAdjustment * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Summary Message */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            {result.summary}
          </p>
        </div>
        
        {appliedRules.length === 0 && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              No dynamic adjustments currently active for this assessment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}