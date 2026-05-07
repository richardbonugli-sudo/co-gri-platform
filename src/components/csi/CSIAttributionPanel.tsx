/**
 * CSI Attribution Panel
 * Shows "Why did CSI move?" with detailed breakdown
 * Part of Phase 2B: Attribution & Explainability
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, CheckCircle, Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RiskVector } from '@/services/csi/engine/types';

interface AttributionData {
  country: string;
  as_of_date: Date;
  composite_csi: number;
  baseline: {
    value: number;
    source: string;
    last_updated: Date;
  };
  drift: {
    total: number;
    signals: Array<{
      signal_id: string;
      contribution: number;
      probability: number;
    }>;
  };
  events: {
    total: number;
    deltas: Array<{
      event_id: string;
      vector: RiskVector;
      impact: number;
    }>;
  };
}

interface CSIAttributionPanelProps {
  attribution: AttributionData;
}

export function CSIAttributionPanel({ attribution }: CSIAttributionPanelProps) {
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

  return (
    <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Info className="h-5 w-5 text-[#7fa89f]" />
          Why Did CSI Move?
        </CardTitle>
        <CardDescription className="text-gray-400">
          Detailed attribution breakdown for {attribution.country}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {/* Baseline Attribution */}
          <AccordionItem 
            value="baseline" 
            className="bg-[#0d5f5f]/20 border border-blue-500/30 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-white font-semibold">Structural Baseline</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-blue-400 font-bold text-lg">
                    {attribution.baseline.value.toFixed(1)}
                  </span>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    {((attribution.baseline.value / attribution.composite_csi) * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-2">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Source:</span> {attribution.baseline.source}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Authoritative institutional risk assessment from World Bank WGI, IMF, and PRS/EIU
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Last Updated:</span>{' '}
                      {new Date(attribution.baseline.last_updated).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Baseline updates quarterly based on institutional data releases
                    </p>
                  </div>
                </div>
                <div className="bg-[#0d5f5f]/30 rounded p-3 mt-2">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-white">Why this matters:</span> The baseline
                    represents the fundamental institutional risk level. It's slow-moving and provides
                    the foundation upon which short-term risks (drift and events) are layered.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Drift Attribution */}
          <AccordionItem 
            value="drift" 
            className="bg-[#0d5f5f]/20 border border-yellow-500/30 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="text-white font-semibold">Escalation Drift</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-bold text-lg">
                    +{attribution.drift.total.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                    {attribution.drift.signals.length} signals
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-2">
              <div className="space-y-3">
                <div className="bg-[#0d5f5f]/30 rounded p-3">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-white">What is drift?</span> Probability-weighted
                    pre-event risk from active escalation signals. These are early warnings that haven't
                    yet materialized into confirmed events.
                  </p>
                </div>

                {attribution.drift.signals.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 font-semibold">Active Signals Contributing:</p>
                    {attribution.drift.signals.map((signal, idx) => (
                      <div 
                        key={signal.signal_id}
                        className="bg-[#0d5f5f]/20 border border-yellow-500/20 rounded p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-white font-mono">
                              {signal.signal_id.substring(0, 12)}...
                            </span>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            +{signal.contribution.toFixed(3)} CSI
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Probability of Materialization</span>
                            <span className="text-white">{(signal.probability * 100).toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={signal.probability * 100} 
                            className="h-1.5 bg-[#0d5f5f]/30"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No active escalation signals</p>
                  </div>
                )}

                <div className="bg-[#0d5f5f]/30 rounded p-3 mt-2">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-white">Formula:</span> Drift = Σ(Severity × 
                    Probability × Persistence × Recency). Capped at 0.25 per signal, 1.0 cumulative per 30 days.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Event Delta Attribution */}
          <AccordionItem 
            value="events" 
            className="bg-[#0d5f5f]/20 border border-orange-500/30 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  <span className="text-white font-semibold">Event Delta</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-bold text-lg">
                    +{attribution.events.total.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                    {attribution.events.deltas.length} events
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-2">
              <div className="space-y-3">
                <div className="bg-[#0d5f5f]/30 rounded p-3">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-white">What is event delta?</span> Confirmed
                    event impact with netting logic. When signals are confirmed as events, prior drift
                    is subtracted to prevent double-counting.
                  </p>
                </div>

                {attribution.events.deltas.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 font-semibold">Confirmed Events:</p>
                    {attribution.events.deltas.map((event, idx) => (
                      <div 
                        key={event.event_id}
                        className="bg-[#0d5f5f]/20 border border-orange-500/20 rounded p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-400" />
                            <span className="text-sm text-white font-mono">
                              {event.event_id.substring(0, 12)}...
                            </span>
                          </div>
                          <Badge className="bg-orange-500/20 text-orange-400">
                            +{event.impact.toFixed(2)} CSI
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${getVectorColor(event.vector)} text-white text-xs`}
                          >
                            {getVectorLabel(event.vector)}
                          </Badge>
                          <span className="text-xs text-gray-400">Risk Vector</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No confirmed events</p>
                  </div>
                )}

                <div className="bg-[#0d5f5f]/30 rounded p-3 mt-2">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-white">Netting Logic:</span> When an event
                    is confirmed, any prior drift from related signals is netted out. This ensures
                    CSI moves incrementally, not in jumps.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Summary */}
        <div className="mt-6 bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Attribution Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Baseline (Institutional)</span>
              <span className="text-blue-400 font-semibold">
                {attribution.baseline.value.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">+ Drift ({attribution.drift.signals.length} signals)</span>
              <span className="text-yellow-400 font-semibold">
                {attribution.drift.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">+ Delta ({attribution.events.deltas.length} events)</span>
              <span className="text-orange-400 font-semibold">
                {attribution.events.total.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-[#7fa89f]/20 pt-2 mt-2"></div>
            <div className="flex justify-between">
              <span className="text-white font-semibold">= Total CSI</span>
              <span className="text-[#7fa89f] font-bold text-lg">
                {attribution.composite_csi.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}