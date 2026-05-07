import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, Brush
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Loader2, BarChart3, Eye, EyeOff, ZoomIn, Database, RefreshCw } from 'lucide-react';
import { compositeCalculator } from '@/services/csi/compositeCalculator';
import { csiWorkerService } from '@/services/csi/csiWorkerService';
import { CSIDataPoint } from '@/services/csi/csiCache';
import { 
  ExtendedTimeWindow, 
  isExtendedTimeWindow, 
  getTimeWindowDays,
  getLandmarkEvents,
  HistoricalEventMarker
} from '@/data/historicalGeopoliticalEvents';
import {
  getMarketDataByTimeWindow,
  getRelevantIndicesForCountry,
  calculateCSIMarketCorrelation,
  MARKET_INDICES,
  MarketDataPoint
} from '@/data/marketIndexData';

interface RiskTrendComparisonProps {
  selectedCountry?: string;
  timeWindow?: ExtendedTimeWindow;
  onTimeWindowChange?: (timeWindow: ExtendedTimeWindow) => void;
}

interface TrendDataPoint {
  date: string;
  fullDate: Date;
  globalCSI: number;
  countryCSI?: number;
  countryName?: string;
  marketIndex?: number;
  marketIndexName?: string;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  estimatedTime: string;
  message: string;
  fromCache: boolean;
  calculationTime?: number;
}

// Time window options with metadata
const TIME_WINDOW_OPTIONS: { 
  value: ExtendedTimeWindow; 
  label: string; 
  isExtended: boolean;
  estimatedLoadTime?: string;
}[] = [
  { value: '7D', label: '7D', isExtended: false },
  { value: '30D', label: '30D', isExtended: false },
  { value: '90D', label: '90D', isExtended: false },
  { value: '12M', label: '12M', isExtended: false },
  { value: '3Y', label: '3Y', isExtended: true, estimatedLoadTime: '<5s' },
  { value: '5Y', label: '5Y', isExtended: true, estimatedLoadTime: '<10s' },
  { value: '10Y', label: '10Y', isExtended: true, estimatedLoadTime: '<20s' },
];

/**
 * Calculate the global average CSI at a specific date
 * Uses the optimized compositeCalculator method for better performance and accuracy
 */
const calculateGlobalCSIAtDate = (date: Date): number => {
  return compositeCalculator.calculateGlobalCSIAtDate(date);
};

/**
 * Get CSI for a specific country at a specific date
 * Uses the unified compositeCalculator for ALL dates
 */
const getCountryCSIAtDate = (country: string, date: Date): number => {
  return compositeCalculator.getCSIAtDate(country, date);
};

/**
 * Get estimated load time for extended time windows
 */
const getEstimatedLoadTime = (timeWindow: ExtendedTimeWindow): { min: number; max: number; display: string } => {
  switch (timeWindow) {
    case '3Y':
      return { min: 2, max: 5, display: '<5 seconds' };
    case '5Y':
      return { min: 5, max: 10, display: '<10 seconds' };
    case '10Y':
      return { min: 10, max: 20, display: '<20 seconds' };
    default:
      return { min: 0.1, max: 1, display: '<1 second' };
  }
};

/**
 * Get data point interval based on time window for performance optimization
 */
const getDataPointInterval = (timeWindow: ExtendedTimeWindow): { interval: number; unit: 'day' | 'week' } => {
  switch (timeWindow) {
    case '7D':
      return { interval: 1, unit: 'day' };
    case '30D':
      return { interval: 1, unit: 'day' };
    case '90D':
      return { interval: 3, unit: 'day' };
    case '12M':
      return { interval: 7, unit: 'week' };
    case '3Y':
      return { interval: 7, unit: 'week' };
    case '5Y':
      return { interval: 7, unit: 'week' };
    case '10Y':
      return { interval: 14, unit: 'week' };
    default:
      return { interval: 1, unit: 'day' };
  }
};

const RiskTrendComparison: React.FC<RiskTrendComparisonProps> = ({ 
  selectedCountry, 
  timeWindow: externalTimeWindow,
  onTimeWindowChange
}) => {
  // FIX: Internal time window state owns the selector.
  // Initialized ONCE from externalTimeWindow on mount (or defaults to '30D').
  // We never re-sync from externalTimeWindow on subsequent renders — that was the
  // root cause of buttons appearing frozen: the persisted Zustand prop always
  // overrode internalTimeWindow, making clicks appear to have no effect.
  // onTimeWindowChange is now a write-only side effect to keep the global store
  // in sync; we never read back from it.
  const [internalTimeWindow, setInternalTimeWindow] = useState<ExtendedTimeWindow>(
    externalTimeWindow ?? '30D'
  );
  const timeWindow = internalTimeWindow;
  
  // Loading state for extended time windows
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    estimatedTime: '',
    message: '',
    fromCache: false
  });
  
  // Market index overlay toggle
  const [showMarketIndex, setShowMarketIndex] = useState(false);
  
  // Zoom/pan state for 10Y charts
  const [enableZoom, setEnableZoom] = useState(false);
  
  // Cached trend data
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  
  // Market correlation coefficient
  const [correlation, setCorrelation] = useState<number | null>(null);

  // Cache status
  const [cacheStatus, setCacheStatus] = useState<{
    isCached: boolean;
    age?: number;
    expiresIn?: number;
  }>({ isCached: false });

  // Ref to track current calculation
  const calculationRef = useRef<string | null>(null);

  // FIX: Handle time window change — always update internal state immediately so
  // the chart re-renders at once. Fire the callback as a write-only side effect
  // so the parent/global store stays in sync, but we never READ back from it.
  const handleTimeWindowChange = useCallback((newTimeWindow: ExtendedTimeWindow) => {
    setInternalTimeWindow(newTimeWindow);
    onTimeWindowChange?.(newTimeWindow);
  }, [onTimeWindowChange]);

  // Get relevant market index for the selected country
  const relevantMarketIndex = useMemo(() => {
    if (selectedCountry) {
      const indices = getRelevantIndicesForCountry(selectedCountry);
      return indices[0] || 'msci-world';
    }
    return 'msci-world';
  }, [selectedCountry]);

  const marketIndexInfo = useMemo(() => {
    return MARKET_INDICES.find(idx => idx.id === relevantMarketIndex);
  }, [relevantMarketIndex]);

  // Helper function to format date labels based on time window
  const formatDateLabel = useCallback((date: Date, tw: ExtendedTimeWindow): string => {
    if (tw === '7D' || tw === '30D') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (tw === '90D' || tw === '12M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // Extended time windows: show month/year
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  }, []);

  // Find closest market data point to a given date
  const findClosestMarketData = useCallback((targetDate: Date, marketData: MarketDataPoint[]): MarketDataPoint | null => {
    if (marketData.length === 0) return null;
    
    let closest = marketData[0];
    let minDiff = Math.abs(targetDate.getTime() - closest.date.getTime());
    
    for (const point of marketData) {
      const diff = Math.abs(targetDate.getTime() - point.date.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    
    // Only return if within 30 days
    if (minDiff < 30 * 24 * 60 * 60 * 1000) {
      return closest;
    }
    return null;
  }, []);

  // Check cache status
  useEffect(() => {
    const checkCache = async () => {
      const metadata = csiWorkerService.getCacheMetadata(timeWindow, selectedCountry);
      if (metadata) {
        setCacheStatus({
          isCached: metadata.isCached,
          age: metadata.age,
          expiresIn: metadata.expiresIn
        });
      }
    };
    checkCache();
  }, [timeWindow, selectedCountry]);

  // Generate trend data with Web Worker for extended time windows
  useEffect(() => {
    const generateData = async () => {
      const isExtended = isExtendedTimeWindow(timeWindow);
      const calculationId = `${timeWindow}-${selectedCountry || 'global'}-${Date.now()}`;
      calculationRef.current = calculationId;
      
      // Check cache first for extended windows
      if (isExtended) {
        const loadTime = getEstimatedLoadTime(timeWindow);
        setLoadingState({
          isLoading: true,
          progress: 0,
          estimatedTime: loadTime.display,
          message: 'Checking cache...',
          fromCache: false
        });

        try {
          // Use Web Worker service with caching
          const startTime = performance.now();
          const result = await csiWorkerService.calculateTimeSeries(
            timeWindow,
            selectedCountry,
            {
              dataPoints: 100,
              onProgress: (progress) => {
                if (calculationRef.current === calculationId) {
                  setLoadingState(prev => ({
                    ...prev,
                    progress,
                    message: progress < 30 ? 'Fetching historical events...' :
                             progress < 60 ? 'Calculating CSI time series...' :
                             progress < 90 ? 'Processing market correlations...' :
                             'Finalizing data...'
                  }));
                }
              }
            }
          );

          // Check if this calculation is still current
          if (calculationRef.current !== calculationId) {
            console.log('[RiskTrendComparison] Calculation superseded, ignoring result');
            return;
          }

          const totalTime = performance.now() - startTime;
          console.log(`[RiskTrendComparison] Data loaded in ${totalTime.toFixed(2)}ms (from cache: ${result.fromCache})`);

          // Convert CSIDataPoint to TrendDataPoint
          const data = convertToTrendData(result.data, timeWindow, showMarketIndex, relevantMarketIndex);
          setTrendData(data);

          // Update cache status
          setCacheStatus({
            isCached: true,
            age: 0,
            expiresIn: result.fromCache ? undefined : (isExtended ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)
          });

          setLoadingState({
            isLoading: false,
            progress: 100,
            estimatedTime: '',
            message: '',
            fromCache: result.fromCache,
            calculationTime: result.calculationTime
          });

        } catch (error) {
          console.error('[RiskTrendComparison] Error calculating time series:', error);
          // Fall back to main thread calculation
          await generateDataMainThread();
        }
      } else {
        // For non-extended windows, use main thread (fast enough)
        await generateDataMainThread();
      }
    };

    const generateDataMainThread = async () => {
      const startTime = performance.now();
      const dataPoints = getTimeWindowDays(timeWindow);
      const { interval } = getDataPointInterval(timeWindow);
      const data: TrendDataPoint[] = [];
      const now = new Date();
      
      // Get market data for correlation
      const marketData = showMarketIndex ? getMarketDataByTimeWindow(relevantMarketIndex, timeWindow) : [];
      
      const csiChanges: number[] = [];
      const marketChanges: number[] = [];
      let prevCSI: number | null = null;
      let prevMarket: number | null = null;
      
      for (let i = dataPoints - 1; i >= 0; i -= interval) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const globalCSI = calculateGlobalCSIAtDate(date);
        
        const dataPoint: TrendDataPoint = {
          date: formatDateLabel(date, timeWindow),
          fullDate: date,
          globalCSI: parseFloat(globalCSI.toFixed(1)),
        };
        
        if (selectedCountry) {
          const countryCSI = getCountryCSIAtDate(selectedCountry, date);
          dataPoint.countryCSI = parseFloat(countryCSI.toFixed(1));
          dataPoint.countryName = selectedCountry;
        }
        
        // Add market index data if enabled
        if (showMarketIndex && marketIndexInfo) {
          const marketPoint = findClosestMarketData(date, marketData);
          if (marketPoint) {
            dataPoint.marketIndex = marketPoint.value;
            dataPoint.marketIndexName = marketIndexInfo.shortName;
            
            // Calculate changes for correlation
            if (prevCSI !== null && prevMarket !== null) {
              csiChanges.push(globalCSI - prevCSI);
              marketChanges.push(marketPoint.change);
            }
            prevMarket = marketPoint.value;
          }
        }
        
        prevCSI = globalCSI;
        data.push(dataPoint);
      }
      
      // Calculate correlation if we have market data
      if (csiChanges.length > 2 && marketChanges.length > 2) {
        const corr = calculateCSIMarketCorrelation(csiChanges, marketChanges);
        setCorrelation(parseFloat(corr.toFixed(3)));
      } else {
        setCorrelation(null);
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`[RiskTrendComparison] Main thread calculation completed in ${totalTime.toFixed(2)}ms`);
      
      setTrendData(data);
      setLoadingState({
        isLoading: false,
        progress: 100,
        estimatedTime: '',
        message: '',
        fromCache: false,
        calculationTime: totalTime
      });
    };

    const convertToTrendData = (
      csiData: CSIDataPoint[],
      tw: ExtendedTimeWindow,
      includeMarket: boolean,
      marketIndex: string
    ): TrendDataPoint[] => {
      const marketData = includeMarket ? getMarketDataByTimeWindow(marketIndex, tw) : [];
      const csiChanges: number[] = [];
      const marketChanges: number[] = [];
      let prevCSI: number | null = null;
      let prevMarket: number | null = null;

      const data = csiData.map(point => {
        const date = new Date(point.date);
        const dataPoint: TrendDataPoint = {
          date: formatDateLabel(date, tw),
          fullDate: date,
          globalCSI: point.globalCSI,
          countryCSI: point.countryCSI,
          countryName: point.countryName
        };

        if (includeMarket && marketIndexInfo) {
          const marketPoint = findClosestMarketData(date, marketData);
          if (marketPoint) {
            dataPoint.marketIndex = marketPoint.value;
            dataPoint.marketIndexName = marketIndexInfo.shortName;

            if (prevCSI !== null && prevMarket !== null) {
              csiChanges.push(point.globalCSI - prevCSI);
              marketChanges.push(marketPoint.change);
            }
            prevMarket = marketPoint.value;
          }
        }

        prevCSI = point.globalCSI;
        return dataPoint;
      });

      // Calculate correlation
      if (csiChanges.length > 2 && marketChanges.length > 2) {
        const corr = calculateCSIMarketCorrelation(csiChanges, marketChanges);
        setCorrelation(parseFloat(corr.toFixed(3)));
      } else {
        setCorrelation(null);
      }

      return data;
    };
    
    generateData();

    // Cleanup function to cancel ongoing calculations
    return () => {
      calculationRef.current = null;
    };
  }, [timeWindow, selectedCountry, showMarketIndex, relevantMarketIndex, marketIndexInfo, formatDateLabel, findClosestMarketData]);

  // Force recalculate (bypass cache)
  const handleForceRecalculate = useCallback(async () => {
    if (loadingState.isLoading) return;

    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      progress: 0,
      message: 'Recalculating...',
      fromCache: false
    }));

    try {
      const result = await csiWorkerService.calculateTimeSeries(
        timeWindow,
        selectedCountry,
        {
          dataPoints: 100,
          forceRecalculate: true,
          onProgress: (progress) => {
            setLoadingState(prev => ({
              ...prev,
              progress,
              message: `Recalculating... ${progress}%`
            }));
          }
        }
      );

      const data = result.data.map(point => {
        const date = new Date(point.date);
        return {
          date: formatDateLabel(date, timeWindow),
          fullDate: date,
          globalCSI: point.globalCSI,
          countryCSI: point.countryCSI,
          countryName: point.countryName
        } as TrendDataPoint;
      });

      setTrendData(data);
      setCacheStatus({ isCached: true, age: 0 });
      setLoadingState({
        isLoading: false,
        progress: 100,
        estimatedTime: '',
        message: '',
        fromCache: false,
        calculationTime: result.calculationTime
      });
    } catch (error) {
      console.error('[RiskTrendComparison] Force recalculate failed:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        message: 'Recalculation failed'
      }));
    }
  }, [timeWindow, selectedCountry, loadingState.isLoading, formatDateLabel]);

  // Get landmark events for chart annotations
  const landmarkEvents = useMemo(() => {
    if (!isExtendedTimeWindow(timeWindow)) return [];
    return getLandmarkEvents(timeWindow);
  }, [timeWindow]);

  // Calculate trend direction and change percentage
  const trendAnalysis = useMemo(() => {
    if (trendData.length < 2) return null;
    
    const firstPoint = trendData[0];
    const lastPoint = trendData[trendData.length - 1];
    
    const globalChange = lastPoint.globalCSI - firstPoint.globalCSI;
    const globalChangePercent = firstPoint.globalCSI > 0 
      ? ((globalChange / firstPoint.globalCSI) * 100).toFixed(1)
      : '0.0';
    
    const result: {
      global: { change: number; changePercent: string; direction: 'up' | 'down' | 'stable' };
      country?: { change: number; changePercent: string; direction: 'up' | 'down' | 'stable' };
    } = {
      global: {
        change: globalChange,
        changePercent: globalChangePercent,
        direction: globalChange > 0.5 ? 'up' : globalChange < -0.5 ? 'down' : 'stable'
      }
    };
    
    if (selectedCountry && lastPoint.countryCSI !== undefined && firstPoint.countryCSI !== undefined) {
      const countryChange = lastPoint.countryCSI - firstPoint.countryCSI;
      const countryChangePercent = firstPoint.countryCSI > 0
        ? ((countryChange / firstPoint.countryCSI) * 100).toFixed(1)
        : '0.0';
      
      result.country = {
        change: countryChange,
        changePercent: countryChangePercent,
        direction: countryChange > 0.5 ? 'up' : countryChange < -0.5 ? 'down' : 'stable'
      };
    }
    
    return result;
  }, [trendData, selectedCountry]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // Calculate Y-axis domain based on data range for better visualization
  const yAxisDomain = useMemo(() => {
    if (trendData.length === 0) return [0, 100];
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    trendData.forEach(point => {
      if (point.globalCSI < minVal) minVal = point.globalCSI;
      if (point.globalCSI > maxVal) maxVal = point.globalCSI;
      if (point.countryCSI !== undefined) {
        if (point.countryCSI < minVal) minVal = point.countryCSI;
        if (point.countryCSI > maxVal) maxVal = point.countryCSI;
      }
    });
    
    // Add padding to the range
    const padding = Math.max(5, (maxVal - minVal) * 0.2);
    const domainMin = Math.max(0, Math.floor(minVal - padding));
    const domainMax = Math.min(100, Math.ceil(maxVal + padding));
    
    // Ensure we have a reasonable range for visualization
    if (domainMax - domainMin < 10) {
      const mid = (domainMin + domainMax) / 2;
      return [Math.max(0, mid - 10), Math.min(100, mid + 10)];
    }
    
    return [domainMin, domainMax];
  }, [trendData]);

  // Calculate market index Y-axis domain
  const marketYAxisDomain = useMemo(() => {
    if (!showMarketIndex || trendData.length === 0) return [0, 100];
    
    const marketValues = trendData
      .filter(p => p.marketIndex !== undefined)
      .map(p => p.marketIndex as number);
    
    if (marketValues.length === 0) return [0, 100];
    
    const min = Math.min(...marketValues);
    const max = Math.max(...marketValues);
    const padding = (max - min) * 0.1;
    
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [trendData, showMarketIndex]);

  // Get X-axis interval based on time window
  const getXAxisInterval = () => {
    switch (timeWindow) {
      case '7D': return 0;
      case '30D': return 5;
      case '90D': return 4;
      case '12M': return 6;
      case '3Y': return 8;
      case '5Y': return 10;
      case '10Y': return 12;
      default: return 'preserveStartEnd';
    }
  };

  // Calculate data point count
  const dataPointCount = trendData.length;
  const { unit } = getDataPointInterval(timeWindow);

  // Format cache age for display
  const formatCacheAge = (ageMs?: number): string => {
    if (!ageMs) return '';
    const minutes = Math.floor(ageMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="bg-[#0d1512] border border-[#0d5f5f]/30 rounded-lg shadow-md p-6">
      {/* Header with title and controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Risk Trend Comparison
          </h3>
          <div className="flex items-center gap-4 text-sm">
            {trendAnalysis && !loadingState.isLoading && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Global CSI:</span>
                  {getTrendIcon(trendAnalysis.global.direction)}
                  <span className={`font-semibold ${getTrendColor(trendAnalysis.global.direction)}`}>
                    {trendAnalysis.global.changePercent}%
                  </span>
                </div>
                {trendAnalysis.country && selectedCountry && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{selectedCountry}:</span>
                    {getTrendIcon(trendAnalysis.country.direction)}
                    <span className={`font-semibold ${getTrendColor(trendAnalysis.country.direction)}`}>
                      {trendAnalysis.country.changePercent}%
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 mr-2">Time Window:</span>
          {TIME_WINDOW_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeWindowChange(option.value)}
              disabled={loadingState.isLoading}
              className={[
                'px-3 py-1.5 text-sm rounded-md transition-all duration-200',
                timeWindow === option.value
                  ? option.isExtended
                    ? 'bg-amber-600 text-white border border-amber-500'
                    : 'bg-[#0d5f5f] text-white border border-[#0d5f5f]'
                  : option.isExtended
                    ? 'bg-[#0d1512] text-amber-400 border border-amber-600/50 hover:bg-amber-900/30'
                    : 'bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20',
                loadingState.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
              title={option.isExtended ? `Extended window - Est. load time: ${option.estimatedLoadTime}` : ''}
            >
              {option.label}
              {option.isExtended && (
                <span className="ml-1 text-xs opacity-70">⏱</span>
              )}
            </button>
          ))}
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Market Index Toggle */}
          <button
            onClick={() => setShowMarketIndex(!showMarketIndex)}
            className={[
              'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all',
              showMarketIndex
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                : 'bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20',
            ].join(' ')}
          >
            {showMarketIndex ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <BarChart3 className="w-4 h-4" />
            <span>{marketIndexInfo?.shortName || 'Market Index'}</span>
          </button>

          {/* Zoom Toggle for 10Y */}
          {timeWindow === '10Y' && (
            <button
              onClick={() => setEnableZoom(!enableZoom)}
              className={[
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all',
                enableZoom
                  ? 'bg-purple-600/30 text-purple-400 border border-purple-500/50'
                  : 'bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20',
              ].join(' ')}
            >
              <ZoomIn className="w-4 h-4" />
              <span>Zoom/Pan</span>
            </button>
          )}

          {/* Cache Status Indicator */}
          {!loadingState.isLoading && isExtendedTimeWindow(timeWindow) && (
            <div className="flex items-center gap-2">
              <div className={[
                'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md',
                loadingState.fromCache 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'bg-[#0d5f5f]/20 text-gray-400 border border-[#0d5f5f]/30',
              ].join(' ')}>
                <Database className="w-4 h-4" />
                <span>
                  {loadingState.fromCache 
                    ? `Cached ${formatCacheAge(cacheStatus.age)}`
                    : 'Fresh data'
                  }
                </span>
                {loadingState.calculationTime && (
                  <span className="text-xs opacity-70">
                    ({loadingState.calculationTime.toFixed(0)}ms)
                  </span>
                )}
              </div>
              
              {/* Force Recalculate Button */}
              <button
                onClick={handleForceRecalculate}
                disabled={loadingState.isLoading}
                className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-md bg-[#0d1512] text-gray-400 border border-[#0d5f5f]/30 hover:bg-[#0d5f5f]/20 transition-all"
                title="Force recalculate (bypass cache)"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Correlation Display */}
          {showMarketIndex && correlation !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d5f5f]/20 rounded-md">
              <span className="text-xs text-gray-400">CSI-Market Correlation:</span>
              <span className={`text-sm font-semibold ${
                correlation > 0.3 ? 'text-red-400' :
                correlation < -0.3 ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {correlation > 0 ? '+' : ''}{correlation}
              </span>
            </div>
          )}

          {/* Data Point Count */}
          {!loadingState.isLoading && (
            <div className="text-xs text-gray-500">
              {dataPointCount} {unit === 'week' ? 'weekly' : 'daily'} data points
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadingState.isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 text-[#0d5f5f] animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium">{loadingState.message}</p>
            <p className="text-sm text-gray-400 mt-1">
              Estimated time: {loadingState.estimatedTime}
            </p>
          </div>
          {/* Progress Bar */}
          <div className="w-64 h-2 bg-[#0d5f5f]/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#0d5f5f] transition-all duration-300 ease-out"
              style={{ width: `${loadingState.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{Math.round(loadingState.progress)}% complete</p>
        </div>
      )}

      {/* Chart Description */}
      {!loadingState.isLoading && (
        <div className="text-sm text-gray-400 mb-4">
          {selectedCountry 
            ? `Comparing ${selectedCountry} CSI trend against Global Average over ${timeWindow}`
            : `Global CSI trend over ${timeWindow}`
          }
          {showMarketIndex && marketIndexInfo && (
            <span className="ml-2 text-blue-400">
              | {marketIndexInfo.shortName} overlay enabled
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      {!loadingState.isLoading && (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData} margin={{ top: 5, right: showMarketIndex ? 60 : 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#0d5f5f" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#7fa89f"
              style={{ fontSize: '11px' }}
              interval={getXAxisInterval()}
              angle={isExtendedTimeWindow(timeWindow) ? -45 : 0}
              textAnchor={isExtendedTimeWindow(timeWindow) ? 'end' : 'middle'}
              height={isExtendedTimeWindow(timeWindow) ? 60 : 30}
            />
            <YAxis 
              yAxisId="csi"
              stroke="#7fa89f"
              style={{ fontSize: '11px' }}
              domain={yAxisDomain}
              label={{ value: 'CSI Score', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#7fa89f' } }}
            />
            {showMarketIndex && (
              <YAxis 
                yAxisId="market"
                orientation="right"
                stroke="#60a5fa"
                style={{ fontSize: '11px' }}
                domain={marketYAxisDomain}
                label={{ value: marketIndexInfo?.shortName || 'Index', angle: 90, position: 'insideRight', style: { fontSize: '11px', fill: '#60a5fa' } }}
              />
            )}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0f0d', 
                border: '1px solid #0d5f5f',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#ffffff'
              }}
              formatter={(value: number, name: string) => {
                if (name.includes('Market') || name.includes('Index')) {
                  return [value.toLocaleString(), name];
                }
                return [value.toFixed(1), name];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: '#7fa89f' }}
              iconType="line"
            />
            
            {/* Landmark Event Reference Lines */}
            {isExtendedTimeWindow(timeWindow) && landmarkEvents.map((event: HistoricalEventMarker) => (
              <ReferenceLine
                key={event.id}
                x={formatDateLabel(event.date, timeWindow)}
                yAxisId="csi"
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                  value: event.shortTitle,
                  position: 'top',
                  fill: '#ef4444',
                  fontSize: 9,
                }}
              />
            ))}
            
            <Line 
              yAxisId="csi"
              type="monotone" 
              dataKey="globalCSI" 
              stroke="#7fa89f" 
              strokeWidth={2}
              name="Global CSI"
              dot={timeWindow === '7D'}
              activeDot={{ r: 6 }}
            />
            {selectedCountry && (
              <Line 
                yAxisId="csi"
                type="monotone" 
                dataKey="countryCSI" 
                stroke="#ef4444" 
                strokeWidth={2}
                name={`${selectedCountry} CSI`}
                dot={timeWindow === '7D'}
                activeDot={{ r: 6 }}
              />
            )}
            {showMarketIndex && (
              <Line 
                yAxisId="market"
                type="monotone" 
                dataKey="marketIndex" 
                stroke="#60a5fa" 
                strokeWidth={1.5}
                strokeDasharray="5 5"
                name={marketIndexInfo?.shortName || 'Market Index'}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            
            {/* Brush for zoom/pan on 10Y charts */}
            {enableZoom && timeWindow === '10Y' && (
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#0d5f5f"
                fill="#0d1512"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Summary Section */}
      {!loadingState.isLoading && selectedCountry && (
        <div className="mt-4 p-3 bg-[#0d5f5f]/20 border border-[#0d5f5f]/30 rounded-md">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">{selectedCountry}</span> is currently showing{' '}
            {trendAnalysis?.country?.direction === 'up' ? 'an increasing' : 
             trendAnalysis?.country?.direction === 'down' ? 'a decreasing' : 'a stable'} risk trend 
            compared to the global average over the selected {timeWindow} period.
            {showMarketIndex && correlation !== null && (
              <span className="block mt-2 text-blue-400">
                The CSI shows a {Math.abs(correlation) > 0.5 ? 'strong' : Math.abs(correlation) > 0.3 ? 'moderate' : 'weak'}{' '}
                {correlation > 0 ? 'positive' : 'negative'} correlation ({correlation}) with {marketIndexInfo?.shortName}.
              </span>
            )}
          </p>
        </div>
      )}

      {/* Extended Time Window Info */}
      {!loadingState.isLoading && isExtendedTimeWindow(timeWindow) && landmarkEvents.length > 0 && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-md">
          <p className="text-sm text-amber-400 font-medium mb-2">
            Major Events in {timeWindow} Window ({landmarkEvents.length} landmark events)
          </p>
          <div className="flex flex-wrap gap-2">
            {landmarkEvents.slice(0, 5).map((event: HistoricalEventMarker) => (
              <span 
                key={event.id}
                className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 rounded"
                title={event.description}
              >
                {event.shortTitle} ({event.date.getFullYear()})
              </span>
            ))}
            {landmarkEvents.length > 5 && (
              <span className="text-xs px-2 py-1 text-amber-500">
                +{landmarkEvents.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Performance Stats (Debug) */}
      {!loadingState.isLoading && isExtendedTimeWindow(timeWindow) && loadingState.calculationTime && (
        <div className="mt-2 text-xs text-gray-600 text-right">
          Performance: {loadingState.calculationTime.toFixed(0)}ms 
          {loadingState.fromCache && ' (cached)'} | 
          Worker: {csiWorkerService.isWorkerAvailable() ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
};

export { RiskTrendComparison };
export default RiskTrendComparison;