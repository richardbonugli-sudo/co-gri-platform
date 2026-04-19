/**
 * Confirmed Events List
 * Displays confirmed events with netting details
 * Part of Phase 2B: Attribution & Explainability
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, TrendingUp, MinusCircle, Info } from 'lucide-react';
import { RiskVector } from '@/services/csi/engine/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EventDetail {
  event_id: string;
  vector: RiskVector;
  event_type: string;
  base_impact: number;
  netted_impact: number;
  current_impact: number;
  confirmed_date: Date;
}

interface ConfirmedEventsListProps {
  country: string;
  events: EventDetail[];
  totalDelta: number;
}

export function ConfirmedEventsList({ country, events, totalDelta }: ConfirmedEventsListProps) {
  const getVectorColor = (vector: RiskVector) => {
    const colors: Record<RiskVector, string> = {
      [RiskVector.POLITICAL]: 'bg-purple-500',
      [RiskVector.ECONOMIC]: 'bg-blue-500',
      [RiskVector.SECURITY]: 'bg-red-500',
      [RiskVector.SOCIAL]: 'bg-green-500',
      [RiskVector.ENVIRONMENTAL]: 'bg-teal-500',
      [RiskVector.TECHNOLOGICAL]: 'bg-indigo-500'
    };
    return colors[vector] || 'bg-gray-500';
  };

  const getVectorLabel = (vector: RiskVector) => {
    const labels: Record<RiskVector, string> = {
      [RiskVector.POLITICAL]: 'Political',
      [RiskVector.ECONOMIC]: 'Economic',
      [RiskVector.SECURITY]: 'Security',
      [RiskVector.SOCIAL]: 'Social',
      [RiskVector.ENVIRONMENTAL]: 'Environmental',
      [RiskVector.TECHNOLOGICAL]: 'Technological'
    };
    return labels[vector] || vector;
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'tariff_imposed': '💰',
      'tariff_threat': '⚠️',
      'sanction': '🚫',
      'trade_agreement': '🤝',
      'political_instability': '⚡',
      'natural_disaster': '🌪️',
      'regulatory_change': '📋',
      'supply_disruption': '📦',
      'unknown': '📌'
    };
    return icons[type] || icons['unknown'];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-400" />
              Confirmed Events
            </CardTitle>
            <CardDescription className="text-gray-400">
              Validated events with netting applied for {country}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-400">
              +{totalDelta.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Total Delta</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event, idx) => {
              const nettingAmount = event.base_impact - event.netted_impact;
              const decayAmount = event.netted_impact - event.current_impact;

              return (
                <div
                  key={event.event_id}
                  className="bg-[#0d5f5f]/20 border border-orange-500/30 rounded-lg p-4 hover:bg-[#0d5f5f]/30 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                      <div>
                        <div className="text-white font-mono text-sm">
                          {event.event_id.substring(0, 16)}...
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Confirmed: {formatDate(event.confirmed_date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-orange-500/20 text-orange-400 mb-1">
                        +{event.current_impact.toFixed(2)} CSI
                      </Badge>
                      <Badge 
                        className={`${getVectorColor(event.vector)} text-white text-xs`}
                      >
                        {getVectorLabel(event.vector)}
                      </Badge>
                    </div>
                  </div>

                  {/* Impact Breakdown with Netting */}
                  <div className="space-y-3">
                    {/* Base Impact */}
                    <div className="bg-[#0d5f5f]/30 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-white" />
                          <span className="text-sm text-gray-300">Base Event Impact</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-xs">
                                  The raw impact of the event before any adjustments
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="text-white font-semibold">
                          {event.base_impact.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Netting Applied */}
                    {nettingAmount > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MinusCircle className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-gray-300">Prior Drift Netted</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-xs">
                                    When an event is confirmed, related escalation drift is
                                    subtracted to prevent double-counting
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-red-400 font-semibold">
                            -{nettingAmount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Prevents double-counting of risk that was already priced in via drift
                        </p>
                      </div>
                    )}

                    {/* Decay Applied */}
                    {decayAmount > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MinusCircle className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-gray-300">Decay Applied</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-xs">
                                    Event impact decays over time (exponential, 30-day half-life)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span className="text-blue-400 font-semibold">
                            -{decayAmount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Exponential decay with 30-day half-life
                        </p>
                      </div>
                    )}

                    {/* Current Impact */}
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-semibold">
                          Current Impact on CSI
                        </span>
                        <span className="text-orange-400 font-bold text-lg">
                          +{event.current_impact.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Breakdown */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Impact Breakdown</span>
                      <span>{event.current_impact.toFixed(2)} / {event.base_impact.toFixed(2)}</span>
                    </div>
                    <div className="relative h-2 bg-[#0d5f5f]/30 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-orange-400 rounded-full"
                        style={{ width: `${(event.current_impact / event.base_impact) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Netting Explanation */}
            <div className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4 mt-4">
              <h4 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#7fa89f]" />
                Understanding Netting
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When escalation signals are confirmed as events, the <span className="text-white font-semibold">netting logic</span> subtracts
                the prior drift contribution from those signals. This prevents double-counting: the risk was already
                priced into CSI via drift, so when the event materializes, we only add the <span className="text-white font-semibold">incremental impact</span>.
                This ensures CSI moves smoothly and incrementally, not in large jumps.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No confirmed events</p>
            <p className="text-sm text-gray-500 mt-1">
              Delta component is zero - no validated events affecting CSI
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}