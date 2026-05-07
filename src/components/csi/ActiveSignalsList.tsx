/**
 * Active Signals List
 * Displays live escalation signals with contributions
 * Part of Phase 2B: Attribution & Explainability
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Clock, Activity } from 'lucide-react';
import { RiskVector } from '@/services/csi/engine/types';

interface SignalContribution {
  signal_id: string;
  base_severity: number;
  probability: number;
  persistence_factor: number;
  recency_factor: number;
  contribution: number;
}

interface ActiveSignalsListProps {
  country: string;
  signals: SignalContribution[];
  totalDrift: number;
}

export function ActiveSignalsList({ country, signals, totalDrift }: ActiveSignalsListProps) {
  const getSeverityColor = (severity: number) => {
    if (severity >= 0.8) return 'bg-red-500';
    if (severity >= 0.6) return 'bg-orange-500';
    if (severity >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 0.8) return 'Critical';
    if (severity >= 0.6) return 'High';
    if (severity >= 0.4) return 'Moderate';
    return 'Low';
  };

  const formatTimestamp = (signalId: string) => {
    // Extract timestamp from signal_id if available
    // Format: signal_TIMESTAMP_RANDOM
    const parts = signalId.split('_');
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      const timestamp = new Date(Number(parts[1]));
      return timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'Recent';
  };

  return (
    <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-400" />
              Active Escalation Signals
            </CardTitle>
            <CardDescription className="text-gray-400">
              Live signals contributing to drift for {country}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">
              +{totalDrift.toFixed(3)}
            </div>
            <div className="text-xs text-gray-400">Total Drift</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {signals.length > 0 ? (
          <div className="space-y-3">
            {signals.map((signal, idx) => (
              <div
                key={signal.signal_id}
                className="bg-[#0d5f5f]/20 border border-yellow-500/30 rounded-lg p-4 hover:bg-[#0d5f5f]/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div>
                      <div className="text-white font-mono text-sm">
                        {signal.signal_id.substring(0, 16)}...
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(signal.signal_id)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-500/20 text-yellow-400 mb-1">
                      +{signal.contribution.toFixed(3)} CSI
                    </Badge>
                    <Badge 
                      className={`${getSeverityColor(signal.base_severity)} text-white text-xs`}
                    >
                      {getSeverityLabel(signal.base_severity)}
                    </Badge>
                  </div>
                </div>

                {/* Contribution Factors */}
                <div className="space-y-2">
                  {/* Severity */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Base Severity</span>
                      <span className="text-white">{(signal.base_severity * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={signal.base_severity * 100} 
                      className="h-1.5 bg-[#0d5f5f]/30"
                    />
                  </div>

                  {/* Probability */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Probability of Materialization</span>
                      <span className="text-white">{(signal.probability * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={signal.probability * 100} 
                      className="h-1.5 bg-[#0d5f5f]/30"
                    />
                  </div>

                  {/* Persistence */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Persistence Factor</span>
                      <span className="text-white">{(signal.persistence_factor * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={signal.persistence_factor * 100} 
                      className="h-1.5 bg-[#0d5f5f]/30"
                    />
                  </div>

                  {/* Recency */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Recency Factor</span>
                      <span className="text-white">{(signal.recency_factor * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={signal.recency_factor * 100} 
                      className="h-1.5 bg-[#0d5f5f]/30"
                    />
                  </div>
                </div>

                {/* Formula Explanation */}
                <div className="mt-3 bg-[#0d5f5f]/30 rounded p-2">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold text-white">Contribution = </span>
                    {signal.base_severity.toFixed(2)} × {signal.probability.toFixed(2)} × {' '}
                    {signal.persistence_factor.toFixed(2)} × {signal.recency_factor.toFixed(2)} = {' '}
                    <span className="text-yellow-400 font-semibold">
                      {signal.contribution.toFixed(3)}
                    </span>
                  </p>
                </div>
              </div>
            ))}

            {/* Drift Caps Info */}
            <div className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-3 mt-4">
              <h4 className="text-white text-sm font-semibold mb-2">Drift Caps</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Per-signal cap:</span>
                  <span className="text-white">0.25 CSI points</span>
                </div>
                <div className="flex justify-between">
                  <span>30-day cumulative cap:</span>
                  <span className="text-white">1.0 CSI points</span>
                </div>
                <div className="flex justify-between">
                  <span>Current total drift:</span>
                  <span className="text-yellow-400 font-semibold">
                    {totalDrift.toFixed(3)} / 1.0
                  </span>
                </div>
              </div>
              <Progress 
                value={(totalDrift / 1.0) * 100} 
                className="h-2 bg-[#0d5f5f]/30 mt-2"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No active escalation signals</p>
            <p className="text-sm text-gray-500 mt-1">
              Drift component is zero - no pre-event risk detected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}