/**
 * Timeline Event Feed Component - Refactored to Use Real Events
 * 
 * MAJOR REFACTOR: Now uses Unified Event Service instead of mock data
 * - Connects to real geopolitical events database
 * - Filters events based on company exposure profile
 * - Shows same events as Country Dashboard (internal consistency)
 * - Supports real-time event updates
 * - Eliminates all mock/synthetic event generation
 * 
 * Part of CO-GRI Platform Phase 2 - Week 4
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  MapPin, 
  Filter,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import type { TimeWindow } from '@/store/globalDashboardState';
import { 
  unifiedEventService, 
  type UnifiedEvent,
  type CompanyExposureProfile 
} from '@/services/events/unifiedEventService';
import type { EventCategory, EventSeverity } from '@/data/geopoliticalEvents';

export interface TimelineEvent {
  event_id: string;
  date: Date;
  title: string;
  description: string;
  event_type: 'Historical' | 'Forecast' | 'Scenario';
  impact_level: 'High' | 'Medium' | 'Low';
  affected_countries: string[];
  affected_channels: string[];
  delta_CO_GRI?: number;
  probability?: number;
}

interface TimelineEventFeedProps {
  ticker: string;
  events?: TimelineEvent[];
  onEventClick?: (eventId: string) => void;
}

export const TimelineEventFeed: React.FC<TimelineEventFeedProps> = ({
  ticker,
  events: legacyEvents,
  onEventClick
}) => {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30D');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [liveEventCount, setLiveEventCount] = useState(0);

  // Get company profile
  const companyProfile = useMemo(() => {
    return unifiedEventService.getCompanyProfile(ticker);
  }, [ticker]);

  // Get real events from unified service
  const realEvents = useMemo(() => {
    return unifiedEventService.getCompanyEvents(ticker, timeWindow, true);
  }, [ticker, timeWindow]);

  // Subscribe to live events
  useEffect(() => {
    const unsubscribe = unifiedEventService.subscribeToLiveEvents((event) => {
      // Check if event is relevant to this company
      if (companyProfile) {
        const allCountries = [
          ...companyProfile.primaryCountries,
          ...companyProfile.supplyChainCountries,
          ...companyProfile.marketCountries
        ];
        
        if (allCountries.includes(event.country) ||
            event.relatedCountries?.some(c => allCountries.includes(c))) {
          setLiveEventCount(prev => prev + 1);
          setTimeout(() => setLiveEventCount(prev => Math.max(0, prev - 1)), 3000);
        }
      }
    });

    return unsubscribe;
  }, [companyProfile]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = realEvents;

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    // Live only filter
    if (showLiveOnly) {
      filtered = filtered.filter(event => event.isLive);
    }

    return filtered;
  }, [realEvents, categoryFilter, severityFilter, showLiveOnly]);

  // Event statistics
  const eventStats = useMemo(() => {
    return unifiedEventService.getEventStats(realEvents);
  }, [realEvents]);

  const getSeverityColor = (severity: EventSeverity): string => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'Moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getCategoryColor = (category: EventCategory): string => {
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

  const getRelevanceLabel = (relevance?: number): string => {
    if (!relevance) return 'Global';
    if (relevance >= 0.8) return 'Direct Impact';
    if (relevance >= 0.6) return 'Supply Chain';
    if (relevance >= 0.4) return 'Market Impact';
    return 'Indirect';
  };

  const getRelevanceColor = (relevance?: number): string => {
    if (!relevance) return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    if (relevance >= 0.8) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (relevance >= 0.6) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    if (relevance >= 0.4) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  };

  return (
    <Card className="w-full h-full flex flex-col" data-testid="timeline-event-feed">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Timeline / Event Feed</CardTitle>
            {eventStats.total > 0 && (
              <Badge variant="outline" className="text-xs">
                {eventStats.total}
              </Badge>
            )}
            {eventStats.liveCount > 0 && (
              <Badge className={`text-xs ${liveEventCount > 0 ? 'bg-green-500/20 text-green-400 border-green-500 animate-pulse' : 'bg-gray-500/20 text-gray-400 border-gray-500'}`}>
                <Radio className={`h-3 w-3 mr-1 ${liveEventCount > 0 ? 'animate-pulse' : ''}`} />
                {eventStats.liveCount} LIVE
              </Badge>
            )}
          </div>
        </div>
        
        <CardDescription className="text-sm">
          Real geopolitical events affecting {ticker}
          {companyProfile && (
            <span className="block text-xs text-gray-500 mt-1">
              Monitoring: {companyProfile.primaryCountries.slice(0, 3).join(', ')}
              {companyProfile.primaryCountries.length > 3 && ` +${companyProfile.primaryCountries.length - 3} more`}
            </span>
          )}
        </CardDescription>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Select value={timeWindow} onValueChange={(value: TimeWindow) => setTimeWindow(value)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7D">Last 7 days</SelectItem>
              <SelectItem value="30D">Last 30 days</SelectItem>
              <SelectItem value="90D">Last 90 days</SelectItem>
              <SelectItem value="12M">Last 12 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Conflict">Conflict</SelectItem>
              <SelectItem value="Trade">Trade</SelectItem>
              <SelectItem value="Sanctions">Sanctions</SelectItem>
              <SelectItem value="Regulatory">Regulatory</SelectItem>
              <SelectItem value="Cyber">Cyber</SelectItem>
              <SelectItem value="Governance">Governance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>

          {eventStats.liveCount > 0 && (
            <Button
              variant={showLiveOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLiveOnly(!showLiveOnly)}
              className="h-9"
            >
              <Radio className="h-3 w-3 mr-1" />
              Live Only
            </Button>
          )}
        </div>

        {/* Statistics */}
        {eventStats.total > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
            {Object.entries(eventStats.bySeverity).map(([severity, count]) => (
              count > 0 && (
                <span key={severity} className={
                  severity === 'Critical' ? 'text-red-400' :
                  severity === 'High' ? 'text-orange-400' :
                  severity === 'Moderate' ? 'text-yellow-400' :
                  'text-green-400'
                }>
                  {count} {severity}
                </span>
              )
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto pt-0">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {showLiveOnly 
                ? 'No live events at the moment'
                : categoryFilter !== 'all' || severityFilter !== 'all'
                ? 'No events match the selected filters'
                : `No events found for ${ticker} in the selected time window`}
            </p>
            {companyProfile && (
              <p className="text-gray-500 text-xs mt-2">
                Monitoring {companyProfile.primaryCountries.length} countries and {companyProfile.riskVectors.length} risk vectors
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline connector */}
                {index < filteredEvents.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-700/30" />
                )}
                
                <div className="flex gap-4">
                  {/* Timeline dot with impact indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getSeverityColor(event.severity)}`}>
                      {event.deltaCSI > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-6">
                    <div 
                      className={`bg-gray-900/50 border rounded-lg p-4 hover:bg-gray-900/70 transition-all cursor-pointer ${event.isLive ? 'ring-1 ring-green-500/30' : 'border-gray-700/50'}`}
                      onClick={() => onEventClick?.(event.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-white text-sm">
                              {event.title}
                            </h4>
                            {event.isLive && (
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(event.date, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.country}</span>
                        </div>
                        {event.isOngoing && (
                          <span className="text-orange-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                            Ongoing
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <Badge variant="outline" className={getCategoryColor(event.category)}>
                            {event.category}
                          </Badge>
                          {event.companyRelevance !== undefined && (
                            <Badge variant="outline" className={getRelevanceColor(event.companyRelevance)}>
                              {getRelevanceLabel(event.companyRelevance)}
                            </Badge>
                          )}
                          {event.isLive && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500">
                              LIVE
                            </Badge>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 font-semibold text-sm ${event.deltaCSI > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {event.deltaCSI > 0 ? '+' : ''}{event.deltaCSI.toFixed(1)} CSI
                        </div>
                      </div>

                      {event.relatedCountries && event.relatedCountries.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <p className="text-xs text-gray-500">
                            Also affects: {event.relatedCountries.slice(0, 3).join(', ')}
                            {event.relatedCountries.length > 3 && ` +${event.relatedCountries.length - 3} more`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!companyProfile && realEvents.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-400">
                <p className="font-semibold mb-1">Limited Event Filtering</p>
                <p className="text-yellow-400/80">
                  No exposure profile found for {ticker}. Showing global events. 
                  Register a company profile for more relevant event filtering.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineEventFeed;