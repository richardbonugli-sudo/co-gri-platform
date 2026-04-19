/**
 * DEPRECATED: Legacy TimelineEventFeed Component
 * 
 * ⚠️ THIS COMPONENT IS DEPRECATED AND SHOULD NOT BE USED ⚠️
 * 
 * Please use the refactored version instead:
 * @see /workspace/shadcn-ui/src/components/company/TimelineEventFeed.tsx
 * 
 * Reason for deprecation:
 * - Contains hardcoded mock events (not real geopolitical data)
 * - Not connected to unified event service
 * - Causes internal inconsistency with Country Dashboard
 * 
 * Migration Guide:
 * Old import: import TimelineEventFeed from '@/components/TimelineEventFeed';
 * New import: import { TimelineEventFeed } from '@/components/company/TimelineEventFeed';
 * 
 * Old props: <TimelineEventFeed companyTicker={ticker} companyName={name} />
 * New props: <TimelineEventFeed ticker={ticker} onEventClick={(id) => {...}} />
 * 
 * The new component:
 * - Fetches real geopolitical events from unified event service
 * - Filters events based on company exposure profile
 * - Supports real-time event updates
 * - Maintains internal consistency with Country Dashboard
 * - Provides relevance scoring for each event
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, AlertTriangle, TrendingUp, MapPin, Filter } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { RiskLevelBadge } from './common/RiskLevelBadge';
import { LensBadge } from '@/components/common/LensBadge';
import { useGlobalState } from '@/store/globalState';

interface GeopoliticalEvent {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  country: string;
  region: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  vectors: string[];
  impactScore: number;
  cogriDelta: number;
  sources: string[];
  eventType: 'political' | 'economic' | 'social' | 'conflict' | 'regulatory' | 'environmental';
}

interface TimelineEventFeedProps {
  companyTicker: string;
  companyName: string;
}

/**
 * @deprecated Use TimelineEventFeed from @/components/company/TimelineEventFeed instead
 */
const TimelineEventFeed: React.FC<TimelineEventFeedProps> = ({ companyTicker, companyName }) => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const activeLens = useGlobalState((state) => state.active_company_lens);

  // Generate mock events based on company
  const events: GeopoliticalEvent[] = useMemo(() => {
    const mockEvents: GeopoliticalEvent[] = [
      {
        id: 'evt-001',
        timestamp: subDays(new Date(), 2),
        title: 'US-China Trade Tensions Escalate',
        description: 'New tariffs announced on technology imports, affecting semiconductor supply chains',
        country: 'China',
        region: 'Asia Pacific',
        severity: 'high',
        vectors: ['Political', 'Economic', 'Trade'],
        impactScore: 72,
        cogriDelta: 8.5,
        sources: ['Reuters', 'Bloomberg'],
        eventType: 'political',
      },
      {
        id: 'evt-002',
        timestamp: subDays(new Date(), 5),
        title: 'EU Regulatory Framework Update',
        description: 'New data privacy regulations announced affecting tech companies operating in Europe',
        country: 'European Union',
        region: 'Europe',
        severity: 'medium',
        vectors: ['Regulatory', 'Legal'],
        impactScore: 45,
        cogriDelta: 3.2,
        sources: ['EU Official Journal'],
        eventType: 'regulatory',
      },
      {
        id: 'evt-003',
        timestamp: subDays(new Date(), 8),
        title: 'Middle East Conflict Intensifies',
        description: 'Regional tensions affecting oil supply routes and energy markets',
        country: 'Middle East',
        region: 'Middle East',
        severity: 'critical',
        vectors: ['Conflict', 'Economic', 'Energy'],
        impactScore: 88,
        cogriDelta: 12.3,
        sources: ['Al Jazeera', 'Financial Times'],
        eventType: 'conflict',
      },
      {
        id: 'evt-004',
        timestamp: subDays(new Date(), 12),
        title: 'India Tech Sector Growth',
        description: 'Government announces new incentives for technology sector development',
        country: 'India',
        region: 'Asia Pacific',
        severity: 'low',
        vectors: ['Economic', 'Technology'],
        impactScore: 28,
        cogriDelta: -2.1,
        sources: ['Economic Times'],
        eventType: 'economic',
      },
      {
        id: 'evt-005',
        timestamp: subDays(new Date(), 15),
        title: 'Climate Policy Changes in Europe',
        description: 'New carbon emission standards affecting manufacturing operations',
        country: 'Germany',
        region: 'Europe',
        severity: 'medium',
        vectors: ['Environmental', 'Regulatory'],
        impactScore: 52,
        cogriDelta: 4.7,
        sources: ['Deutsche Welle'],
        eventType: 'environmental',
      },
      {
        id: 'evt-006',
        timestamp: subDays(new Date(), 20),
        title: 'Social Unrest in Latin America',
        description: 'Protests affecting business operations and supply chains in the region',
        country: 'Brazil',
        region: 'Latin America',
        severity: 'high',
        vectors: ['Social', 'Political'],
        impactScore: 65,
        cogriDelta: 6.8,
        sources: ['Reuters'],
        eventType: 'social',
      },
      {
        id: 'evt-007',
        timestamp: subMonths(new Date(), 2),
        title: 'Currency Volatility in Emerging Markets',
        description: 'Significant currency fluctuations affecting international operations',
        country: 'Turkey',
        region: 'Middle East',
        severity: 'medium',
        vectors: ['Economic', 'Financial'],
        impactScore: 48,
        cogriDelta: 5.2,
        sources: ['Bloomberg'],
        eventType: 'economic',
      },
    ];

    return mockEvents;
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Date range filter
    const now = new Date();
    if (dateRange !== 'all') {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const cutoffDate = subDays(now, days);
      filtered = filtered.filter(event => event.timestamp >= cutoffDate);
    }

    // Event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventType === eventTypeFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [events, dateRange, eventTypeFilter, severityFilter]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeIcon = (eventType: string): string => {
    switch (eventType) {
      case 'political': return '🏛️';
      case 'economic': return '💰';
      case 'social': return '👥';
      case 'conflict': return '⚔️';
      case 'regulatory': return '📋';
      case 'environmental': return '🌍';
      default: return '📌';
    }
  };

  return (
    <Card className="w-full" data-testid="timeline-event-feed">
      <CardHeader>
        {/* Deprecation Warning */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">⚠️ Deprecated Component</p>
              <p className="text-xs text-yellow-800 mt-1">
                This component uses mock data. Please use the refactored TimelineEventFeed from 
                <code className="mx-1 px-1 py-0.5 bg-yellow-100 rounded">@/components/company/TimelineEventFeed</code>
                which uses real geopolitical events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <LensBadge lens={activeLens} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Timeline & Event Feed</CardTitle>
            <CardDescription>
              Geopolitical events affecting {companyName} ({companyTicker})
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredEvents.length} events
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="political">Political</SelectItem>
              <SelectItem value="economic">Economic</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="conflict">Conflict</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
              <SelectItem value="environmental">Environmental</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No events match the selected filters</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline connector */}
                {index < filteredEvents.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}
                
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getSeverityColor(event.severity)} border-2`}>
                      {getEventTypeIcon(event.eventType)}
                    </div>
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(event.timestamp, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.country}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {event.vectors.map((vector) => (
                            <Badge key={vector} variant="outline" className="text-xs">
                              {vector}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`h-4 w-4 ${event.cogriDelta > 0 ? 'text-red-600' : 'text-green-600'}`} />
                              <span className={`font-semibold ${event.cogriDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {event.cogriDelta > 0 ? '+' : ''}{event.cogriDelta.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">CO-GRI Impact</p>
                          </div>
                          <RiskLevelBadge level={event.impactScore} />
                        </div>
                      </div>

                      {event.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500">
                            Sources: {event.sources.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineEventFeed;