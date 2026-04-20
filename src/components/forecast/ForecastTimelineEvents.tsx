/**
 * Forecast Timeline Events Component (F3)
 * Displays chronological forecast events with filtering and sorting
 * Part of CO-GRI Platform Phase 3 - Week 7
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter
} from 'lucide-react';
import { ForecastEvent, ForecastSortBy, ForecastSortOrder } from '@/types/forecast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ForecastTimelineEventsProps {
  events: ForecastEvent[];
  onEventClick?: (event: ForecastEvent) => void;
}

export function ForecastTimelineEvents({ events, onEventClick }: ForecastTimelineEventsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ForecastSortBy>('date');
  const [sortOrder, setSortOrder] = useState<ForecastSortOrder>('asc');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [filterProbability, setFilterProbability] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Impact filter
    if (filterImpact !== 'all') {
      filtered = filtered.filter(event => event.impact_level === filterImpact);
    }

    // Probability filter
    if (filterProbability !== 'all') {
      const threshold = parseFloat(filterProbability);
      filtered = filtered.filter(event => event.probability >= threshold);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.timing.localeCompare(b.timing);
          break;
        case 'probability':
          comparison = a.probability - b.probability;
          break;
        case 'impact':
          const impactOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          comparison = impactOrder[a.impact_level] - impactOrder[b.impact_level];
          break;
        case 'relevance':
          comparison = Math.abs(a.expected_delta_CO_GRI) - Math.abs(b.expected_delta_CO_GRI);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [events, searchQuery, sortBy, sortOrder, filterImpact, filterProbability]);

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const impactColors = {
    'Critical': 'bg-red-100 text-red-800 border-red-200',
    'High': 'bg-orange-100 text-orange-800 border-orange-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const probabilityColors = {
    'Very High': 'bg-purple-100 text-purple-800',
    'High': 'bg-blue-100 text-blue-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-gray-100 text-gray-800',
    'Very Low': 'bg-gray-100 text-gray-600'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Forecast Timeline
          <Badge variant="secondary" className="ml-auto">
            {filteredAndSortedEvents.length} Events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <Select value={filterImpact} onValueChange={setFilterImpact}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Impact</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProbability} onValueChange={setFilterProbability}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Probability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Probability</SelectItem>
                <SelectItem value="0.7">≥70%</SelectItem>
                <SelectItem value="0.5">≥50%</SelectItem>
                <SelectItem value="0.3">≥30%</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as ForecastSortBy)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="probability">Probability</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredAndSortedEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.event_id);
            
            return (
              <Collapsible
                key={event.event_id}
                open={isExpanded}
                onOpenChange={() => toggleEventExpansion(event.event_id)}
              >
                <Card 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onEventClick?.(event)}
                >
                  <CardContent className="p-4">
                    <CollapsibleTrigger asChild>
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{event.event_name}</h4>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          </div>
                          <Badge className={impactColors[event.impact_level]}>
                            {event.impact_level}
                          </Badge>
                        </div>

                        {/* Metrics Row */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{event.timing}</span>
                          </div>
                          <Badge className={probabilityColors[event.probability_level]}>
                            {(event.probability * 100).toFixed(0)}% probability
                          </Badge>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className={event.expected_delta_CO_GRI > 0 ? 'text-red-600' : 'text-green-600'}>
                              {event.expected_delta_CO_GRI > 0 ? '+' : ''}{event.expected_delta_CO_GRI.toFixed(1)} ΔCO-GRI
                            </span>
                          </div>
                        </div>

                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-1">
                          {(event.affected_regions || []).slice(0, 2).map(region => (
                            <Badge key={region} variant="outline" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                          {(event.affected_sectors || []).slice(0, 2).map(sector => (
                            <Badge key={sector} variant="secondary" className="text-xs">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Expanded Details */}
                    <CollapsibleContent className="pt-4 space-y-3 border-t mt-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Reasoning</p>
                        <p className="text-sm text-muted-foreground">{event.reasoning}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Affected Countries</p>
                          <div className="flex flex-wrap gap-1">
                            {(event.affected_countries || []).map(country => (
                              <Badge key={country} variant="outline" className="text-xs">
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Impact Range</p>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Best:</span>
                              <span className="text-green-600">{event.delta_range.best_case.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Base:</span>
                              <span className="font-medium">{event.delta_range.base_case.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Worst:</span>
                              <span className="text-red-600">{event.delta_range.worst_case.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Data Sources</p>
                        <p className="text-xs text-muted-foreground">
                          {(event.data_sources || []).join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {(event.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated: {event.last_updated.toLocaleDateString()}
                        </span>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}

          {filteredAndSortedEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events match your filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}