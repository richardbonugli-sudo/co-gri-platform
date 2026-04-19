/**
 * CSI Components Panel
 * Displays the three-component breakdown: Baseline + Drift + Delta
 * Part of Phase 2A: Core UI Integration
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CSIComponentsPanelProps {
  country: string;
  components: {
    structural_baseline: number;
    escalation_drift: number;
    event_delta: number;
    total: number;
  };
  metadata?: {
    activeSignals: number;
    confirmedEvents: number;
    confidence: number;
  };
  timestamp?: Date;
}

export function CSIComponentsPanel({ 
  country, 
  components, 
  metadata,
  timestamp 
}: CSIComponentsPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    if (score >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0.5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (value < -0.5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-2xl flex items-center gap-3">
              {country}
              <span className={`text-4xl font-bold ${getScoreColor(components.total)}`}>
                {components.total.toFixed(1)}
              </span>
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              CSI Score - Three Component Breakdown
            </CardDescription>
          </div>
          {timestamp && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Updated</p>
              <p className="text-sm text-white">
                {new Date(timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Formula */}
        <div className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4">
          <div className="flex items-center justify-center gap-3 text-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {components.structural_baseline.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Baseline</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Structural Baseline</p>
                  <p className="text-xs">Slow-moving institutional risk</p>
                  <p className="text-xs">Updates quarterly</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-white text-2xl">+</span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {components.escalation_drift.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Drift</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Escalation Drift</p>
                  <p className="text-xs">Probability-weighted pre-event risk</p>
                  <p className="text-xs">Updates daily</p>
                  <p className="text-xs mt-1">Active signals: {metadata?.activeSignals || 0}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-white text-2xl">+</span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {components.event_delta.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Delta</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Event Delta</p>
                  <p className="text-xs">Confirmed event impact (with netting)</p>
                  <p className="text-xs">Updates real-time</p>
                  <p className="text-xs mt-1">Confirmed events: {metadata?.confirmedEvents || 0}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-white text-2xl">=</span>

            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(components.total)}`}>
                {components.total.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Total CSI</div>
            </div>
          </div>
        </div>

        {/* Component Details */}
        <div className="space-y-4">
          {/* Structural Baseline */}
          <div className="bg-[#0d5f5f]/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h3 className="text-white font-semibold">Structural Baseline</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Slow-moving institutional risk based on authoritative sources 
                        (World Bank WGI, IMF, PRS/EIU). Updates quarterly.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-400">
                  {components.structural_baseline.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatPercentage(components.structural_baseline, components.total)} of total
                </div>
              </div>
            </div>
            <Progress 
              value={(components.structural_baseline / components.total) * 100} 
              className="h-2 bg-[#0d5f5f]/30"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>Quarterly update cycle</span>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                Stable
              </Badge>
            </div>
          </div>

          {/* Escalation Drift */}
          <div className="bg-[#0d5f5f]/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <h3 className="text-white font-semibold">Escalation Drift</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Probability-weighted pre-event risk from active escalation signals.
                        Formula: Σ(Severity × Probability × Persistence × Recency)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-400 flex items-center gap-1">
                  {components.escalation_drift.toFixed(2)}
                  {getTrendIcon(components.escalation_drift)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatPercentage(components.escalation_drift, components.total)} of total
                </div>
              </div>
            </div>
            <Progress 
              value={(components.escalation_drift / components.total) * 100} 
              className="h-2 bg-[#0d5f5f]/30"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>{metadata?.activeSignals || 0} active signals</span>
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                Daily updates
              </Badge>
            </div>
          </div>

          {/* Event Delta */}
          <div className="bg-[#0d5f5f]/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <h3 className="text-white font-semibold">Event Delta</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Confirmed event impact with netting logic. Prior drift is subtracted
                        when events are confirmed to prevent double-counting.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-400 flex items-center gap-1">
                  {components.event_delta.toFixed(2)}
                  {getTrendIcon(components.event_delta)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatPercentage(components.event_delta, components.total)} of total
                </div>
              </div>
            </div>
            <Progress 
              value={(components.event_delta / components.total) * 100} 
              className="h-2 bg-[#0d5f5f]/30"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>{metadata?.confirmedEvents || 0} confirmed events</span>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                Real-time
              </Badge>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        {metadata && (
          <div className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Data Confidence</span>
              <span className="text-white font-semibold">
                {(metadata.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={metadata.confidence * 100} 
              className="h-2 bg-[#0d5f5f]/30"
            />
            <p className="text-xs text-gray-400 mt-2">
              Based on signal count and event validation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}