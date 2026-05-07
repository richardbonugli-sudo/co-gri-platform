/**
 * Top Risk Movers Component (Component 5)
 * Shows countries with largest CSI changes over selected time window
 * 
 * UPDATED: Now uses event-driven CSI changes from historicalCSIService
 * and supports real-time updates from the event processor.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, ArrowUp, ArrowDown, AlertCircle, Radio } from 'lucide-react';
import { 
  historicalCSIService, 
  type CSIChange 
} from '@/services/csi/historicalCSIService';
import { realTimeEventProcessor, type RealTimeUpdate, type ProcessedEvent } from '@/services/csi/realTimeEventProcessor';
import { formatEventDate } from '@/data/geopoliticalEvents';
import { getCountryShockIndex } from '@/data/globalCountries';

interface TopRiskMoversProps {
  timeWindow?: '7D' | '30D' | '90D' | '12M';
  maxCountries?: number;
  onCountryClick?: (country: string) => void;
  showLiveIndicator?: boolean;
}

interface RiskMover extends CSIChange {
  topEvent?: {
    title: string;
    date: Date;
    category: string;
  };
  isLive?: boolean;
}

export const TopRiskMovers: React.FC<TopRiskMoversProps> = ({
  timeWindow = '30D',
  maxCountries = 10,
  onCountryClick,
  showLiveIndicator = true
}) => {
  const [liveEvents, setLiveEvents] = useState<ProcessedEvent[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realTimeEventProcessor.subscribe((update: RealTimeUpdate) => {
      if (update.type === 'event_processed') {
        setLiveEvents(realTimeEventProcessor.getRecentEvents(5));
        setIsLive(true);
        
        // Reset live indicator after 3 seconds
        setTimeout(() => setIsLive(false), 3000);
      }
    });

    // Check if processor is running
    setIsLive(realTimeEventProcessor.isActive());

    return unsubscribe;
  }, []);

  // Get event-driven risk movers from historical CSI service
  const riskMovers = useMemo((): RiskMover[] => {
    const movers = historicalCSIService.getTopRiskMovers(timeWindow, maxCountries);
    
    // Enrich with top contributing event
    return movers.map(mover => {
      const topEvent = mover.contributingEvents.length > 0 
        ? {
            title: mover.contributingEvents[0].title,
            date: mover.contributingEvents[0].date,
            category: mover.contributingEvents[0].category
          }
        : undefined;
      
      // Check if this country has a recent live event
      const hasLiveEvent = liveEvents.some(e => e.normalizedEvent.country === mover.country);
      
      return {
        ...mover,
        topEvent,
        isLive: hasLiveEvent
      };
    });
  }, [timeWindow, maxCountries, liveEvents]);

  // Calculate summary stats from actual data
  const summaryStats = useMemo(() => {
    const stats = historicalCSIService.getWindowStatistics(timeWindow);
    const processorStats = realTimeEventProcessor.getStats();
    
    return {
      increasingCount: stats.increasingCountries,
      decreasingCount: stats.decreasingCountries,
      avgChange: stats.averageChange.toFixed(1),
      totalEvents: stats.totalEvents,
      liveEvents: processorStats.totalProcessed
    };
  }, [timeWindow]);

  function getChangeColor(direction: string) {
    if (direction === 'up') return 'text-red-400';
    if (direction === 'down') return 'text-green-400';
    return 'text-gray-400';
  }

  function getChangeBgColor(direction: string) {
    if (direction === 'up') return 'bg-red-500/10 border-red-500/20';
    if (direction === 'down') return 'bg-green-500/10 border-green-500/20';
    return 'bg-gray-500/10 border-gray-500/20';
  }

  function getRiskBadgeColor(csi: number): string {
    if (csi >= 70) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (csi >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (csi >= 30) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case 'Conflict': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Sanctions': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Trade': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Governance': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Cyber': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Unrest': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Currency': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">Top Risk Movers</CardTitle>
            {showLiveIndicator && realTimeEventProcessor.isActive() && (
              <Badge className={`text-xs ${isLive ? 'bg-green-500/20 text-green-400 border-green-500 animate-pulse' : 'bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]'}`}>
                <Radio className={`h-3 w-3 mr-1 ${isLive ? 'animate-pulse' : ''}`} />
                LIVE
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
            {timeWindow}
          </Badge>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Largest CSI changes over {timeWindow} • Event-driven analysis
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowUp className="h-4 w-4 text-red-400" />
              <p className="text-red-400 font-bold text-lg">{summaryStats.increasingCount}</p>
            </div>
            <p className="text-gray-400 text-xs">Increasing</p>
          </div>
          
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowDown className="h-4 w-4 text-green-400" />
              <p className="text-green-400 font-bold text-lg">{summaryStats.decreasingCount}</p>
            </div>
            <p className="text-gray-400 text-xs">Decreasing</p>
          </div>
          
          <div className="p-3 rounded-lg bg-[#0d5f5f]/10 border border-[#0d5f5f]/20 text-center">
            <p className={`font-bold text-lg ${parseFloat(summaryStats.avgChange) > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {parseFloat(summaryStats.avgChange) > 0 ? '+' : ''}{summaryStats.avgChange}
            </p>
            <p className="text-gray-400 text-xs">Avg Change</p>
          </div>

          <div className="p-3 rounded-lg bg-[#0d5f5f]/10 border border-[#0d5f5f]/20 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4 text-[#7fa89f]" />
              <p className="text-[#7fa89f] font-bold text-lg">{summaryStats.totalEvents}</p>
            </div>
            <p className="text-gray-400 text-xs">Events</p>
          </div>
        </div>

        {/* Risk Movers List */}
        {riskMovers.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No significant CSI changes in the last {timeWindow}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {riskMovers.map((mover, index) => (
              <div 
                key={`${mover.country}-${index}`}
                onClick={() => onCountryClick?.(mover.country)}
                className={`p-4 rounded-lg border ${getChangeBgColor(mover.direction)} hover:border-[#0d5f5f] transition-all ${onCountryClick ? 'cursor-pointer' : ''} ${mover.isLive ? 'ring-1 ring-green-500/50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{mover.country}</span>
                      <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
                        {mover.region}
                      </Badge>
                      {mover.isLive && (
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRiskBadgeColor(getCountryShockIndex(mover.country))}`}
                      >
                        CSI: {getCountryShockIndex(mover.country).toFixed(1)}
                      </Badge>
                      {mover.contributingEvents.length > 0 && (
                        <span className="text-gray-500 text-xs">
                          {mover.contributingEvents.length} event{mover.contributingEvents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      {mover.direction === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-red-400" />
                      ) : mover.direction === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-green-400" />
                      ) : null}
                      <span className={`text-lg font-bold ${getChangeColor(mover.direction)}`}>
                        {mover.change > 0 ? '+' : ''}{mover.change.toFixed(1)}
                      </span>
                    </div>
                    <p className={`text-xs ${getChangeColor(mover.direction)}`}>
                      {mover.percentChange > 0 ? '+' : ''}{mover.percentChange}%
                    </p>
                  </div>
                </div>
                
                {/* Top Contributing Event */}
                {mover.topEvent && (
                  <div className="mt-3 pt-3 border-t border-[#0d5f5f]/20">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs shrink-0 ${getCategoryColor(mover.topEvent.category)}`}
                      >
                        {mover.topEvent.category}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-xs leading-tight truncate">
                          {mover.topEvent.title}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatEventDate(mover.topEvent.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Change Bar */}
                <div className="mt-3">
                  <div className="h-2 bg-[#0a0f0d] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${mover.direction === 'up' ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(mover.percentChange))}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#0d5f5f]/30 text-center">
          <p className="text-gray-500 text-xs">
            Changes based on {summaryStats.totalEvents} geopolitical events in the last {timeWindow}
            {summaryStats.liveEvents > 0 && (
              <span className="text-green-400 ml-1">• {summaryStats.liveEvents} live events processed</span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopRiskMovers;