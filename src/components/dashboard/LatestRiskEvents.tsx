/**
 * Latest Risk Events Component - Event-Driven Version with Real-Time Support
 * 
 * UPDATED: Now supports real-time event updates from the event processor
 * in addition to historical geopolitical events.
 * PHASE 1 FIXES APPLIED:
 * - Expanded event categories to include high-frequency types
 * - Added event synthesis fallback for countries with no events
 * - Enhanced filtering to never show "no events" when CSI changed
 * 
 * PHASE 2 ENHANCEMENTS APPLIED:
 * - Impact-based ranking with relevance scoring
 * - Spillover event prioritization
 * - Enhanced sorting algorithm (live > impact > date)
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Radio
} from 'lucide-react';
import { useGlobalDashboardStore } from '@/store/globalDashboardState';
import type { TimeWindow } from '@/store/globalDashboardState';
import { 
  getEventsByTimeWindow,
  getEventsByCountry,
  formatEventDate,
  synthesizeEventsFromCSI,
  type GeopoliticalEvent,
  type EventSeverity,
  type EventCategory
} from '@/data/geopoliticalEvents';
import { realTimeEventProcessor, type ProcessedEvent, type RealTimeUpdate } from '@/services/csi/realTimeEventProcessor';

interface LatestRiskEventsProps {
  selectedCountry?: string | null;
  timeWindow?: TimeWindow;
  onCountryClick?: (country: string) => void;
  maxEvents?: number;
  showLiveEvents?: boolean;
}

/**
 * Enhanced DisplayEvent interface with Phase 2 fields
 */
interface DisplayEvent {
  id: string;
  title: string;
  description: string;
  country: string;
  region: string;
  date: Date;
  category: EventCategory;
  severity: EventSeverity;
  deltaCSI: number;
  relatedCountries?: string[];
  isOngoing?: boolean;
  isLive?: boolean;
  isSynthetic?: boolean;
  // Phase 2 additions
  relevanceScore: number;  // 1.0 for primary country, 0.3 for spillover
  impactScore: number;     // |deltaCSI| * relevanceScore
}

export const LatestRiskEvents: React.FC<LatestRiskEventsProps> = ({
  selectedCountry,
  timeWindow = '30D',
  onCountryClick,
  maxEvents = 5,
  showLiveEvents = true
}) => {
  const { timeWindow: globalTimeWindow } = useGlobalDashboardStore();
  const activeTimeWindow = timeWindow || globalTimeWindow;

  const [liveEvents, setLiveEvents] = useState<ProcessedEvent[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!showLiveEvents) return;

    const unsubscribe = realTimeEventProcessor.subscribe((update: RealTimeUpdate) => {
      if (update.type === 'event_processed') {
        setLiveEvents(realTimeEventProcessor.getRecentEvents(10));
        setIsLive(true);
        setTimeout(() => setIsLive(false), 3000);
      }
    });

    setLiveEvents(realTimeEventProcessor.getRecentEvents(10));
    setIsLive(realTimeEventProcessor.isActive());

    return unsubscribe;
  }, [showLiveEvents]);

  /**
   * PHASE 2: Enhanced filtering with impact-based ranking and spillover prioritization
   */
  const filteredEvents = useMemo((): DisplayEvent[] => {
    let historicalEvents: GeopoliticalEvent[];
    
    if (selectedCountry) {
      historicalEvents = getEventsByCountry(selectedCountry, activeTimeWindow);
      
      // PHASE 1 FIX: If no events, synthesize from CSI changes
      if (historicalEvents.length === 0) {
        historicalEvents = synthesizeEventsFromCSI(selectedCountry, activeTimeWindow);
      }
    } else {
      historicalEvents = getEventsByTimeWindow(activeTimeWindow);
    }
    
    // PHASE 2: Calculate relevance and impact scores for historical events
    const scoredHistorical: DisplayEvent[] = historicalEvents.map(event => {
      // Determine relevance score based on country match
      const relevanceScore = selectedCountry 
        ? (event.country === selectedCountry ? 1.0 : 0.3)  // Primary vs spillover
        : 1.0;  // All events equally relevant when no country selected
      
      // Calculate impact score: absolute delta CSI weighted by relevance
      const impactScore = Math.abs(event.deltaCSI) * relevanceScore;
      
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        country: event.country,
        region: event.region,
        date: event.date,
        category: event.category,
        severity: event.severity,
        deltaCSI: event.deltaCSI,
        relatedCountries: event.relatedCountries,
        isOngoing: event.isOngoing,
        isLive: false,
        isSynthetic: false,
        relevanceScore,
        impactScore
      };
    });

    // PHASE 2: Process live events with relevance scoring
    const scoredLive: DisplayEvent[] = showLiveEvents ? liveEvents
      .filter(event => {
        if (!selectedCountry) return true;
        return event.normalizedEvent.country === selectedCountry ||
               event.propagation.effects.some(e => e.targetCountry === selectedCountry);
      })
      .map(event => {
        // Determine relevance for live events
        const isPrimaryCountry = event.normalizedEvent.country === selectedCountry;
        const relevanceScore = selectedCountry 
          ? (isPrimaryCountry ? 1.0 : 0.3)
          : 1.0;
        
        const impactScore = Math.abs(event.classification.estimatedDeltaCSI) * relevanceScore;
        
        return {
          id: event.id,
          title: event.normalizedEvent.headline,
          description: event.normalizedEvent.description,
          country: event.normalizedEvent.country,
          region: event.normalizedEvent.region,
          date: event.normalizedEvent.timestamp,
          category: event.classification.primaryVector.vector,
          severity: event.classification.severity,
          deltaCSI: event.classification.estimatedDeltaCSI,
          relatedCountries: event.propagation.effects.map(e => e.targetCountry),
          isOngoing: event.lifecycleState !== 'resolved',
          isLive: true,
          isSynthetic: false,
          relevanceScore,
          impactScore
        };
      }) : [];

    // Deduplicate: remove historical events that match live event IDs
    const liveIds = new Set(scoredLive.map(e => e.id));
    const combined = [
      ...scoredLive,
      ...scoredHistorical.filter(e => !liveIds.has(e.id))
    ];
    
    // PHASE 2: Enhanced sorting algorithm
    // Priority: 1) Live events first, 2) Impact score (descending), 3) Date (most recent)
    combined.sort((a, b) => {
      // Live events always come first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // Sort by impact score (higher impact first)
      if (Math.abs(a.impactScore - b.impactScore) > 0.01) {
        return b.impactScore - a.impactScore;
      }
      
      // If impact scores are similar, sort by date (most recent first)
      return b.date.getTime() - a.date.getTime();
    });
    
    return combined.slice(0, maxEvents);
  }, [selectedCountry, activeTimeWindow, maxEvents, liveEvents, showLiveEvents]);

  const eventStats = useMemo(() => {
    const windowEvents = selectedCountry 
      ? getEventsByCountry(selectedCountry, activeTimeWindow)
      : getEventsByTimeWindow(activeTimeWindow);
    
    const criticalCount = windowEvents.filter(e => e.severity === 'Critical').length;
    const highCount = windowEvents.filter(e => e.severity === 'High').length;
    const positiveImpact = windowEvents.filter(e => e.deltaCSI > 0).length;
    const negativeImpact = windowEvents.filter(e => e.deltaCSI < 0).length;
    
    return {
      total: windowEvents.length + liveEvents.length,
      critical: criticalCount,
      high: highCount,
      riskIncreasing: positiveImpact,
      riskDecreasing: negativeImpact,
      liveCount: liveEvents.length
    };
  }, [selectedCountry, activeTimeWindow, liveEvents]);

  const getSeverityColor = (severity: EventSeverity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'Moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case 'Conflict': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Sanctions': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Trade': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Governance': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Cyber': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Unrest': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Currency': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Protest': return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'Regulatory': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Diplomatic': return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      case 'Infrastructure': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'Economic Policy': return 'bg-lime-500/10 text-lime-400 border-lime-500/30';
      case 'Military Posture': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Corporate': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getImpactIcon = (deltaCSI: number) => {
    if (deltaCSI > 0) {
      return <TrendingUp className="h-4 w-4 text-red-400" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-green-400" />;
    }
  };

  const getImpactColor = (deltaCSI: number) => {
    return deltaCSI > 0 ? 'text-red-400' : 'text-green-400';
  };

  const formatImpact = (deltaCSI: number) => {
    const sign = deltaCSI > 0 ? '+' : '';
    return `${sign}${deltaCSI.toFixed(1)} CSI`;
  };

  const getTimeWindowLabel = (window: TimeWindow) => {
    switch (window) {
      case '7D': return '7 days';
      case '30D': return '30 days';
      case '90D': return '90 days';
      case '12M': return '12 months';
      default: return '30 days';
    }
  };

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">
              Latest Risk Events
            </CardTitle>
            {eventStats.total > 0 && (
              <Badge variant="outline" className="text-xs bg-[#7fa89f]/20 text-[#7fa89f] border-[#7fa89f]">
                {eventStats.total}
              </Badge>
            )}
            {showLiveEvents && realTimeEventProcessor.isActive() && (
              <Badge className={`text-xs ${isLive ? 'bg-green-500/20 text-green-400 border-green-500 animate-pulse' : 'bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]'}`}>
                <Radio className={`h-3 w-3 mr-1 ${isLive ? 'animate-pulse' : ''}`} />
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-[#0d5f5f]/20 text-[#7fa89f] border-[#0d5f5f]">
              <Clock className="h-3 w-3 mr-1" />
              {activeTimeWindow}
            </Badge>
            {selectedCountry && (
              <Badge variant="outline" className="text-xs bg-[#0d5f5f]/30 text-[#7fa89f] border-[#7fa89f]">
                <MapPin className="h-3 w-3 mr-1" />
                {selectedCountry}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {selectedCountry
            ? `${eventStats.total} event${eventStats.total !== 1 ? 's' : ''} impacting ${selectedCountry}`
            : `Real geopolitical events • ${eventStats.total} event${eventStats.total !== 1 ? 's' : ''}`}
        </p>
        {eventStats.total > 0 && (
          <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
            {eventStats.critical > 0 && (
              <span className="text-red-400">{eventStats.critical} Critical</span>
            )}
            {eventStats.high > 0 && (
              <span className="text-orange-400">{eventStats.high} High</span>
            )}
            {eventStats.liveCount > 0 && (
              <span className="text-green-400">{eventStats.liveCount} Live</span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {selectedCountry
                ? `No recent events for ${selectedCountry}`
                : `No events found in the last ${getTimeWindowLabel(activeTimeWindow)}`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg bg-[#0a0f0d] border border-[#0d5f5f]/20 hover:border-[#0d5f5f]/50 transition-all duration-200 ${event.isLive ? 'ring-1 ring-green-500/30' : ''} ${event.isSynthetic ? 'opacity-80' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getImpactIcon(event.deltaCSI)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm leading-tight truncate">
                          {event.title}
                        </h4>
                        {event.isLive && (
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                        )}
                        {event.relevanceScore < 1.0 && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 shrink-0">
                            Spillover
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span 
                          className={`text-[#7fa89f] ${onCountryClick ? 'cursor-pointer hover:text-[#a0c9bf] underline' : ''}`}
                          onClick={(e) => {
                            if (onCountryClick) {
                              e.stopPropagation();
                              onCountryClick(event.country);
                            }
                          }}
                        >
                          {event.country}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{event.region}</span>
                        {event.isOngoing && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-orange-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                              Ongoing
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${getSeverityColor(event.severity)}`}
                  >
                    {event.severity}
                  </Badge>
                </div>

                <p className="text-gray-400 text-xs mt-2 line-clamp-2">
                  {event.description}
                </p>

                {event.relatedCountries && event.relatedCountries.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <span className="text-gray-500 text-xs">Also affects:</span>
                    {event.relatedCountries.slice(0, 3).map((country, idx) => (
                      <span 
                        key={country}
                        className={`text-xs text-gray-400 ${onCountryClick ? 'cursor-pointer hover:text-[#7fa89f]' : ''}`}
                        onClick={(e) => {
                          if (onCountryClick) {
                            e.stopPropagation();
                            onCountryClick(country);
                          }
                        }}
                      >
                        {country}{idx < Math.min(event.relatedCountries!.length - 1, 2) ? ',' : ''}
                      </span>
                    ))}
                    {event.relatedCountries.length > 3 && (
                      <span className="text-gray-500 text-xs">
                        +{event.relatedCountries.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#0d5f5f]/20">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">{formatEventDate(event.date)}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(event.category)}`}
                    >
                      {event.category}
                    </Badge>
                    {event.isLive && (
                      <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 font-semibold text-sm ${getImpactColor(event.deltaCSI)}`}>
                    {formatImpact(event.deltaCSI)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEvents.length > 0 && eventStats.total > maxEvents && (
          <Button
            variant="outline"
            className="w-full mt-4 border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
          >
            View All {eventStats.total} Events →
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestRiskEvents;