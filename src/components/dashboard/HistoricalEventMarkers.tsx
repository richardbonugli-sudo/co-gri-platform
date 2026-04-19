import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  Swords, 
  Building2, 
  TrendingDown, 
  Globe, 
  Shield, 
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Activity
} from 'lucide-react';
import { 
  ExtendedTimeWindow, 
  getLandmarkEvents,
  getHistoricalEventsByTimeWindow,
  HistoricalEventMarker
} from '@/data/historicalGeopoliticalEvents';
import { 
  GeopoliticalEvent, 
  EventCategory, 
  getEventsByTimeWindow 
} from '@/data/geopoliticalEvents';
import { getMarketDataByTimeWindow, MarketDataPoint } from '@/data/marketIndexData';

// Event category groupings for filtering
type EventCategoryGroup = 'Military' | 'Political' | 'Economic' | 'Other';

interface EventMarkerConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
}

// Category to group mapping
const CATEGORY_GROUPS: Record<EventCategory, EventCategoryGroup> = {
  'Conflict': 'Military',
  'Military Posture': 'Military',
  'Sanctions': 'Economic',
  'Trade': 'Economic',
  'Currency': 'Economic',
  'Economic Policy': 'Economic',
  'Corporate': 'Economic',
  'Governance': 'Political',
  'Protest': 'Political',
  'Unrest': 'Political',
  'Regulatory': 'Political',
  'Diplomatic': 'Political',
  'Cyber': 'Other',
  'Infrastructure': 'Other'
};

// Category group styling
const CATEGORY_GROUP_CONFIG: Record<EventCategoryGroup, EventMarkerConfig> = {
  'Military': {
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500/50',
    icon: <Swords className="w-4 h-4" />,
    label: 'Military Conflicts'
  },
  'Political': {
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-500/50',
    icon: <Building2 className="w-4 h-4" />,
    label: 'Political Upheaval'
  },
  'Economic': {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500/50',
    icon: <TrendingDown className="w-4 h-4" />,
    label: 'Economic Tensions'
  },
  'Other': {
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/50',
    icon: <Globe className="w-4 h-4" />,
    label: 'Other Events'
  }
};

// Severity styling
const SEVERITY_CONFIG = {
  'Critical': { opacity: 1, size: 'large', pulse: true },
  'High': { opacity: 0.9, size: 'medium', pulse: false },
  'Moderate': { opacity: 0.7, size: 'small', pulse: false },
  'Low': { opacity: 0.5, size: 'tiny', pulse: false }
};

// Local storage key for preferences
const STORAGE_KEY = 'csi-event-markers-preferences';

interface EventMarkersPreferences {
  visible: boolean;
  categoryFilters: Record<EventCategoryGroup, boolean>;
  showLandmarksOnly: boolean;
}

const DEFAULT_PREFERENCES: EventMarkersPreferences = {
  visible: true,
  categoryFilters: {
    'Military': true,
    'Political': true,
    'Economic': true,
    'Other': true
  },
  showLandmarksOnly: false
};

interface HistoricalEventMarkersProps {
  timeWindow: ExtendedTimeWindow;
  selectedCountry?: string;
  chartWidth?: number;
  chartHeight?: number;
  onEventSelect?: (event: GeopoliticalEvent | HistoricalEventMarker) => void;
  className?: string;
}

interface EventTooltipProps {
  event: GeopoliticalEvent | HistoricalEventMarker;
  marketImpact?: { date: Date; change: number } | null;
  position: { x: number; y: number };
  onClose: () => void;
}

// Helper to check if event is a landmark event
const isLandmarkEvent = (event: GeopoliticalEvent | HistoricalEventMarker): event is HistoricalEventMarker => {
  return 'shortTitle' in event;
};

// Helper to get category group for an event
const getEventCategoryGroup = (event: GeopoliticalEvent | HistoricalEventMarker): EventCategoryGroup => {
  if (isLandmarkEvent(event)) {
    // Map landmark categories to groups
    const category = event.category;
    if (category === 'Conflict' || category === 'Military Posture') return 'Military';
    if (category === 'Sanctions' || category === 'Trade' || category === 'Currency') return 'Economic';
    if (category === 'Governance' || category === 'Protest' || category === 'Unrest') return 'Political';
    return 'Other';
  }
  return CATEGORY_GROUPS[event.category] || 'Other';
};

// Event Tooltip Component
const EventTooltip: React.FC<EventTooltipProps> = ({ event, marketImpact, position, onClose }) => {
  const categoryGroup = getEventCategoryGroup(event);
  const config = CATEGORY_GROUP_CONFIG[categoryGroup];
  const isLandmark = isLandmarkEvent(event);
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get affected countries
  const getAffectedCountries = () => {
    if (isLandmark) {
      // Use the correct field name from HistoricalEventMarker interface
      return event.countries || [];
    }
    const countries = [event.country];
    if (event.relatedCountries) {
      countries.push(...event.relatedCountries);
    }
    return countries;
  };

  const affectedCountries = getAffectedCountries();
  // Use the correct field name from HistoricalEventMarker interface
  const deltaCSI = event.deltaCSI;

  return (
    <div 
      className={`
        absolute z-50 w-80 rounded-lg shadow-xl border
        ${config.bgColor} ${config.borderColor}
        backdrop-blur-sm
      `}
      style={{
        left: Math.min(position.x, window.innerWidth - 340),
        top: position.y + 10,
        transform: 'translateX(-50%)'
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b ${config.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          {isLandmark && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-500/30 text-amber-300 rounded">
              Landmark
            </span>
          )}
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Title */}
        <h4 className="text-white font-semibold text-sm leading-tight">
          {isLandmark ? event.shortTitle : event.title}
        </h4>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(event.date)}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-300 leading-relaxed">
          {event.description}
        </p>

        {/* Affected Countries */}
        {affectedCountries.length > 0 && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {affectedCountries.slice(0, 5).map((country, idx) => (
                <span 
                  key={idx}
                  className="px-1.5 py-0.5 text-xs bg-gray-700/50 text-gray-300 rounded"
                >
                  {country}
                </span>
              ))}
              {affectedCountries.length > 5 && (
                <span className="px-1.5 py-0.5 text-xs text-gray-500">
                  +{affectedCountries.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700/50">
          {/* CSI Impact */}
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">CSI Impact</div>
              <div className={`text-sm font-semibold ${
                deltaCSI > 0 ? 'text-red-400' : deltaCSI < 0 ? 'text-green-400' : 'text-gray-400'
              }`}>
                {deltaCSI > 0 ? '+' : ''}{deltaCSI.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Market Impact */}
          {marketImpact && (
            <div className="flex items-center gap-2">
              <TrendingDown className="w-3 h-3 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Market Impact</div>
                <div className={`text-sm font-semibold ${
                  marketImpact.change < 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {marketImpact.change > 0 ? '+' : ''}{marketImpact.change.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Severity Badge */}
        <div className="flex items-center justify-between pt-2">
          <span className={`
            px-2 py-1 text-xs rounded-full font-medium
            ${event.severity === 'Critical' ? 'bg-red-500/30 text-red-300' :
              event.severity === 'High' ? 'bg-orange-500/30 text-orange-300' :
              event.severity === 'Moderate' ? 'bg-yellow-500/30 text-yellow-300' :
              'bg-gray-500/30 text-gray-300'}
          `}>
            {event.severity} Severity
          </span>
          {!isLandmark && event.isOngoing && (
            <span className="px-2 py-1 text-xs bg-blue-500/30 text-blue-300 rounded-full">
              Ongoing
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const HistoricalEventMarkers: React.FC<HistoricalEventMarkersProps> = ({
  timeWindow,
  selectedCountry,
  chartWidth = 800,
  chartHeight = 350,
  onEventSelect,
  className = ''
}) => {
  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<EventMarkersPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load event marker preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save event marker preferences:', e);
    }
  }, [preferences]);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    event: GeopoliticalEvent | HistoricalEventMarker;
    position: { x: number; y: number };
  } | null>(null);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    setPreferences(prev => ({ ...prev, visible: !prev.visible }));
  }, []);

  // Toggle category filter
  const toggleCategoryFilter = useCallback((category: EventCategoryGroup) => {
    setPreferences(prev => ({
      ...prev,
      categoryFilters: {
        ...prev.categoryFilters,
        [category]: !prev.categoryFilters[category]
      }
    }));
  }, []);

  // Toggle landmarks only
  const toggleLandmarksOnly = useCallback(() => {
    setPreferences(prev => ({ ...prev, showLandmarksOnly: !prev.showLandmarksOnly }));
  }, []);

  // Get filtered events
  const filteredEvents = useMemo(() => {
    const allEvents: (GeopoliticalEvent | HistoricalEventMarker)[] = [];
    
    // Get landmark events for extended time windows
    const landmarks = getLandmarkEvents(timeWindow);
    allEvents.push(...landmarks);
    
    // Get regular events if not landmarks only
    if (!preferences.showLandmarksOnly) {
      const regularEvents = getEventsByTimeWindow(timeWindow);
      
      // Filter by country if selected
      const countryFiltered = selectedCountry
        ? regularEvents.filter(e => 
            e.country === selectedCountry || 
            e.relatedCountries?.includes(selectedCountry)
          )
        : regularEvents;
      
      // Only add events that aren't duplicates of landmarks
      const landmarkDates = new Set(landmarks.map(l => l.date.toISOString().split('T')[0]));
      const uniqueEvents = countryFiltered.filter(e => 
        !landmarkDates.has(e.date.toISOString().split('T')[0])
      );
      
      allEvents.push(...uniqueEvents);
    }

    // Filter by category groups
    return allEvents.filter(event => {
      const group = getEventCategoryGroup(event);
      return preferences.categoryFilters[group];
    });
  }, [timeWindow, selectedCountry, preferences.showLandmarksOnly, preferences.categoryFilters]);

  // Get market data for impact calculation
  const marketData = useMemo(() => {
    return getMarketDataByTimeWindow('msci-world', timeWindow);
  }, [timeWindow]);

  // Find market impact near an event date
  const findMarketImpact = useCallback((eventDate: Date): { date: Date; change: number } | null => {
    if (marketData.length === 0) return null;
    
    // Find market data within 7 days of the event
    const eventTime = eventDate.getTime();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    const nearbyData = marketData.filter(d => 
      Math.abs(d.date.getTime() - eventTime) < weekMs
    );
    
    if (nearbyData.length === 0) return null;
    
    // Find the largest change in the period
    const maxChange = nearbyData.reduce((max, d) => 
      Math.abs(d.change) > Math.abs(max.change) ? d : max
    , nearbyData[0]);
    
    return { date: maxChange.date, change: maxChange.change };
  }, [marketData]);

  // Handle event click
  const handleEventClick = useCallback((
    event: GeopoliticalEvent | HistoricalEventMarker, 
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedEvent({
      event,
      position: { x: e.clientX, y: e.clientY }
    });
    onEventSelect?.(event);
  }, [onEventSelect]);

  // Close tooltip
  const closeTooltip = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Calculate marker positions based on date
  const getMarkerPosition = useCallback((date: Date): number => {
    const now = new Date();
    const windowDays = {
      '7D': 7,
      '30D': 30,
      '90D': 90,
      '12M': 365,
      '3Y': 1095,
      '5Y': 1825,
      '10Y': 3650
    }[timeWindow] || 30;
    
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const windowMs = now.getTime() - windowStart.getTime();
    const eventMs = date.getTime() - windowStart.getTime();
    
    // Return percentage position (0-100)
    return Math.max(0, Math.min(100, (eventMs / windowMs) * 100));
  }, [timeWindow]);

  // Get marker size based on severity
  const getMarkerSize = (severity: string): string => {
    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG['Low'];
    switch (config.size) {
      case 'large': return 'w-3 h-3';
      case 'medium': return 'w-2.5 h-2.5';
      case 'small': return 'w-2 h-2';
      default: return 'w-1.5 h-1.5';
    }
  };

  // Count events by category
  const eventCounts = useMemo(() => {
    const counts: Record<EventCategoryGroup, number> = {
      'Military': 0,
      'Political': 0,
      'Economic': 0,
      'Other': 0
    };
    
    filteredEvents.forEach(event => {
      const group = getEventCategoryGroup(event);
      counts[group]++;
    });
    
    return counts;
  }, [filteredEvents]);

  if (!preferences.visible) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={toggleVisibility}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all
            bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20"
        >
          <EyeOff className="w-4 h-4" />
          <span>Show Event Markers</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Visibility Toggle */}
        <button
          onClick={toggleVisibility}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all
            bg-[#0d5f5f]/30 text-[#0d5f5f] border border-[#0d5f5f]/50 hover:bg-[#0d5f5f]/40"
        >
          <Eye className="w-4 h-4" />
          <span>Event Markers</span>
          <span className="px-1.5 py-0.5 text-xs bg-[#0d5f5f]/50 rounded">
            {filteredEvents.length}
          </span>
        </button>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all
            ${showFilters 
              ? 'bg-purple-600/30 text-purple-400 border border-purple-500/50'
              : 'bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20'
            }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Landmarks Only Toggle */}
        <button
          onClick={toggleLandmarksOnly}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all
            ${preferences.showLandmarksOnly
              ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
              : 'bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20'
            }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Landmarks Only</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-3 p-3 bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Filter by Category</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_GROUP_CONFIG) as EventCategoryGroup[]).map(group => {
              const config = CATEGORY_GROUP_CONFIG[group];
              const isActive = preferences.categoryFilters[group];
              const count = eventCounts[group];
              
              return (
                <button
                  key={group}
                  onClick={() => toggleCategoryFilter(group)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all
                    ${isActive
                      ? `${config.bgColor} ${config.color} ${config.borderColor} border`
                      : 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
                    }`}
                >
                  {config.icon}
                  <span>{config.label}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    isActive ? 'bg-white/10' : 'bg-gray-700/50'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Markers Timeline */}
      <div className="relative h-8 bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d5f5f]/10 via-transparent to-[#0d5f5f]/10" />
        
        {/* Markers */}
        {filteredEvents.map((event, index) => {
          const position = getMarkerPosition(event.date);
          const categoryGroup = getEventCategoryGroup(event);
          const config = CATEGORY_GROUP_CONFIG[categoryGroup];
          const severityConfig = SEVERITY_CONFIG[event.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG['Low'];
          const isLandmark = isLandmarkEvent(event);
          
          return (
            <button
              key={isLandmark ? event.id : `${event.id}-${index}`}
              onClick={(e) => handleEventClick(event, e)}
              className={`
                absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer
                transition-all duration-200 hover:scale-150 hover:z-10
                ${getMarkerSize(event.severity)}
                ${isLandmark ? 'ring-2 ring-amber-400/50' : ''}
                ${severityConfig.pulse ? 'animate-pulse' : ''}
              `}
              style={{
                left: `${position}%`,
                backgroundColor: config.color.replace('text-', '').includes('red') ? '#f87171' :
                                config.color.includes('orange') ? '#fb923c' :
                                config.color.includes('yellow') ? '#facc15' : '#60a5fa',
                opacity: severityConfig.opacity,
                transform: `translateX(-50%) translateY(-50%)`
              }}
              title={isLandmark ? event.shortTitle : event.title}
            />
          );
        })}
        
        {/* Time labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-gray-500">
          <span>{timeWindow} ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        {(Object.keys(CATEGORY_GROUP_CONFIG) as EventCategoryGroup[]).map(group => {
          const config = CATEGORY_GROUP_CONFIG[group];
          if (!preferences.categoryFilters[group]) return null;
          
          return (
            <div key={group} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: config.color.includes('red') ? '#f87171' :
                                  config.color.includes('orange') ? '#fb923c' :
                                  config.color.includes('yellow') ? '#facc15' : '#60a5fa'
                }}
              />
              <span>{group}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-2 h-2 rounded-full ring-2 ring-amber-400/50 bg-amber-400" />
          <span>Landmark Event</span>
        </div>
      </div>

      {/* Event Tooltip */}
      {selectedEvent && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={closeTooltip}
          />
          <EventTooltip
            event={selectedEvent.event}
            marketImpact={findMarketImpact(selectedEvent.event.date)}
            position={selectedEvent.position}
            onClose={closeTooltip}
          />
        </>
      )}
    </div>
  );
};

// Export for use in RiskTrendComparison chart
export interface ChartEventMarker {
  date: Date;
  label: string;
  category: EventCategoryGroup;
  severity: string;
  deltaCSI: number;
  color: string;
}

/**
 * Get event markers formatted for chart integration
 * Returns data that can be used with Recharts ReferenceLine
 */
export function getChartEventMarkers(
  timeWindow: ExtendedTimeWindow,
  categoryFilters?: Record<EventCategoryGroup, boolean>
): ChartEventMarker[] {
  const landmarks = getLandmarkEvents(timeWindow);
  const filters = categoryFilters || {
    'Military': true,
    'Political': true,
    'Economic': true,
    'Other': true
  };
  
  return landmarks
    .filter(event => {
      const group = getEventCategoryGroup(event);
      return filters[group];
    })
    .map(event => {
      const group = getEventCategoryGroup(event);
      const config = CATEGORY_GROUP_CONFIG[group];
      
      return {
        date: event.date,
        label: event.shortTitle,
        category: group,
        severity: event.severity,
        deltaCSI: event.deltaCSI,
        color: config.color.includes('red') ? '#f87171' :
               config.color.includes('orange') ? '#fb923c' :
               config.color.includes('yellow') ? '#facc15' : '#60a5fa'
      };
    });
}

export { HistoricalEventMarkers };
export default HistoricalEventMarkers;