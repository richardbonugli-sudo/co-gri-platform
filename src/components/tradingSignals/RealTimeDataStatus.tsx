/**
 * Real-Time Data Status Component - Phase 3 Enhanced
 * 
 * Displays connection status for all data sources:
 * 
 * PHASE 2 - Core Data Sources:
 * - Alpha Vantage (Market data, VIX)
 * - SEC EDGAR (Company filings)
 * - GDELT Project (News sentiment - FREE)
 * - NewsAPI.org (News headlines)
 * - Event Registry (Global events)
 * - World Bank (Governance indicators - FREE)
 * - Fragile States Index (Country stability)
 * - ACLED (Conflict data)
 * 
 * PHASE 3 - Advanced Data Sources:
 * - Freightos Baltic Index (Shipping rates)
 * - Port Congestion (Global ports)
 * - Commodities API (Commodity prices)
 * - FRED API (Economic indicators)
 * - IMF Data (Global economics)
 * - Reddit (Social sentiment - FREE)
 * - StockTwits (Stock sentiment - FREE)
 * - Twitter/X (Social media)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, WifiOff, RefreshCw, Clock, AlertCircle, CheckCircle, 
  Database, Globe, Newspaper, Shield, Activity, TrendingUp,
  ChevronDown, ChevronUp, Ship, Factory, MessageSquare, DollarSign,
  BarChart3, Anchor
} from 'lucide-react';
import { 
  realTimeDataService, 
  type RealTimeDataStatus,
  type DataSourceStatus 
} from '@/services/RealTimeDataService';
import { supplyChainDataService } from '@/services/supplyChainDataService';
import { economicIndicatorsService } from '@/services/economicIndicatorsService';
import { socialSentimentService } from '@/services/socialSentimentService';

interface RealTimeDataStatusProps {
  compact?: boolean;
}

// Extended data source status for Phase 3
interface ExtendedDataSourceStatus {
  name: string;
  connected: boolean;
  dataFreshness: 'live' | 'cached' | 'stale' | 'offline' | 'static';
  requiresApiKey: boolean;
  hasApiKey: boolean;
  requestsRemaining: number;
  lastUpdate: Date | null;
  category: 'market' | 'news' | 'geopolitical' | 'supply-chain' | 'economic' | 'social';
}

export const RealTimeDataStatusComponent: React.FC<RealTimeDataStatusProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<RealTimeDataStatus | null>(null);
  const [phase3Status, setPhase3Status] = useState<ExtendedDataSourceStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize service and subscribe to updates
    realTimeDataService.initialize();
    
    const unsubscribe = realTimeDataService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    // Load Phase 3 service status
    loadPhase3Status();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPhase3Status = () => {
    const supplyChainServices = supplyChainDataService.getServiceStatus();
    const economicServices = economicIndicatorsService.getServiceStatus();
    const socialServices = socialSentimentService.getServiceStatus();

    const phase3Sources: ExtendedDataSourceStatus[] = [
      // Supply Chain Sources
      ...supplyChainServices.map(s => ({
        name: s.name,
        connected: s.status !== 'offline',
        dataFreshness: s.status as ExtendedDataSourceStatus['dataFreshness'],
        requiresApiKey: s.apiKeyRequired,
        hasApiKey: s.status === 'live',
        requestsRemaining: -1,
        lastUpdate: new Date(),
        category: 'supply-chain' as const
      })),
      // Economic Sources
      ...economicServices.map(s => ({
        name: s.name,
        connected: s.status !== 'offline',
        dataFreshness: s.status as ExtendedDataSourceStatus['dataFreshness'],
        requiresApiKey: s.apiKeyRequired,
        hasApiKey: s.status === 'live',
        requestsRemaining: -1,
        lastUpdate: new Date(),
        category: 'economic' as const
      })),
      // Social Sources
      ...socialServices.map(s => ({
        name: s.name,
        connected: s.status !== 'offline',
        dataFreshness: s.status as ExtendedDataSourceStatus['dataFreshness'],
        requiresApiKey: s.apiKeyRequired,
        hasApiKey: s.status === 'live',
        requestsRemaining: -1,
        lastUpdate: new Date(),
        category: 'social' as const
      }))
    ];

    setPhase3Status(phase3Sources);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await realTimeDataService.refreshAll();
      loadPhase3Status();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (freshness: string): string => {
    switch (freshness) {
      case 'live': return 'bg-green-500';
      case 'cached':
      case 'recent': return 'bg-yellow-500';
      case 'static': return 'bg-blue-500';
      case 'stale': return 'bg-orange-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (freshness: string): string => {
    switch (freshness) {
      case 'live': return 'Live';
      case 'cached':
      case 'recent': return 'Cached';
      case 'static': return 'Static';
      case 'stale': return 'Stale';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const getSourceIcon = (sourceName: string) => {
    switch (sourceName) {
      case 'Alpha Vantage': return <TrendingUp className="h-4 w-4" />;
      case 'SEC EDGAR': return <Database className="h-4 w-4" />;
      case 'GDELT Project': return <Globe className="h-4 w-4" />;
      case 'NewsAPI.org': return <Newspaper className="h-4 w-4" />;
      case 'Event Registry': return <Activity className="h-4 w-4" />;
      case 'World Bank': return <Shield className="h-4 w-4" />;
      case 'Fragile States Index': return <AlertCircle className="h-4 w-4" />;
      case 'ACLED': return <Activity className="h-4 w-4" />;
      // Phase 3 icons
      case 'Freightos Baltic Index': return <Ship className="h-4 w-4" />;
      case 'Port Congestion': return <Anchor className="h-4 w-4" />;
      case 'Commodities API': return <Factory className="h-4 w-4" />;
      case 'FRED API': return <BarChart3 className="h-4 w-4" />;
      case 'IMF Data': return <Globe className="h-4 w-4" />;
      case 'Trading Economics': return <TrendingUp className="h-4 w-4" />;
      case 'Reddit': return <MessageSquare className="h-4 w-4" />;
      case 'StockTwits': return <DollarSign className="h-4 w-4" />;
      case 'Twitter/X': return <MessageSquare className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString();
  };

  const renderSourceStatus = (source: DataSourceStatus | ExtendedDataSourceStatus) => {
    return (
      <div 
        key={source.name}
        className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
      >
        <div className="flex items-center gap-2">
          {source.connected ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          {getSourceIcon(source.name)}
          <span className="text-sm text-slate-300">{source.name}</span>
          {source.requiresApiKey && !source.hasApiKey && (
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
              No API Key
            </Badge>
          )}
          {!source.requiresApiKey && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-400">
              Free
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(source.dataFreshness)} text-white text-xs`}>
            {getStatusText(source.dataFreshness)}
          </Badge>
          {source.requestsRemaining >= 0 && (
            <span className="text-xs text-slate-400">
              {source.requestsRemaining} req
            </span>
          )}
        </div>
      </div>
    );
  };

  // Calculate total connected sources
  const getTotalConnected = (): { connected: number; total: number } => {
    let connected = 0;
    let total = 0;

    if (status) {
      const phase2Sources = Object.values(status.sources);
      connected += phase2Sources.filter(s => s.connected).length;
      total += phase2Sources.length;
    }

    connected += phase3Status.filter(s => s.connected).length;
    total += phase3Status.length;

    return { connected, total };
  };

  if (!status) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Initializing data services...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { connected, total } = getTotalConnected();

  if (compact && !expanded) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.overall.connected ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              <div>
                <span className="text-sm font-medium text-slate-200">
                  Data Status: 
                </span>
                <Badge className={`ml-2 ${getStatusColor(status.overall.dataFreshness)}`}>
                  {getStatusText(status.overall.dataFreshness)}
                </Badge>
                <span className="ml-2 text-xs text-slate-400">
                  ({connected}/{total} sources)
                </span>
              </div>
              {status.vixLevel && (
                <div className="flex items-center gap-1 ml-4">
                  <span className="text-xs text-slate-400">VIX:</span>
                  <span className={`text-sm font-bold ${
                    status.vixLevel < 20 ? 'text-green-400' :
                    status.vixLevel < 30 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {status.vixLevel.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-slate-400 hover:text-white"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.overall.connected ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-400" />
            )}
            <CardTitle className="text-lg text-cyan-400">Real-Time Data Status</CardTitle>
            <Badge className={`${getStatusColor(status.overall.dataFreshness)}`}>
              {getStatusText(status.overall.dataFreshness)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {status.vixLevel && (
              <div className="flex items-center gap-1 mr-4 bg-slate-700/50 px-3 py-1 rounded-lg">
                <span className="text-xs text-slate-400">VIX:</span>
                <span className={`text-lg font-bold ${
                  status.vixLevel < 20 ? 'text-green-400' :
                  status.vixLevel < 30 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {status.vixLevel.toFixed(1)}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(false)}
                className="text-slate-400 hover:text-white"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-slate-400">
          {connected} of {total} data sources connected
          {lastRefresh && (
            <span className="ml-2">
              <Clock className="h-3 w-3 inline mr-1" />
              Last refresh: {formatTimestamp(lastRefresh)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase 2: Market Data Sources */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Data
          </h4>
          <div className="space-y-2">
            {renderSourceStatus(status.sources.alphaVantage)}
            {renderSourceStatus(status.sources.secEdgar)}
          </div>
        </div>

        {/* Phase 2: News & Sentiment Sources */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            News & Sentiment
          </h4>
          <div className="space-y-2">
            {renderSourceStatus(status.sources.gdelt)}
            {renderSourceStatus(status.sources.newsApi)}
            {renderSourceStatus(status.sources.eventRegistry)}
          </div>
        </div>

        {/* Phase 2: Geopolitical Risk Sources */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geopolitical Risk
          </h4>
          <div className="space-y-2">
            {renderSourceStatus(status.sources.worldBank)}
            {renderSourceStatus(status.sources.fragileStatesIndex)}
            {renderSourceStatus(status.sources.acled)}
          </div>
        </div>

        {/* Phase 3: Supply Chain Sources */}
        {phase3Status.filter(s => s.category === 'supply-chain').length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Supply Chain
              <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">Phase 3</Badge>
            </h4>
            <div className="space-y-2">
              {phase3Status.filter(s => s.category === 'supply-chain').map(renderSourceStatus)}
            </div>
          </div>
        )}

        {/* Phase 3: Economic Indicators Sources */}
        {phase3Status.filter(s => s.category === 'economic').length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Economic Indicators
              <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">Phase 3</Badge>
            </h4>
            <div className="space-y-2">
              {phase3Status.filter(s => s.category === 'economic').map(renderSourceStatus)}
            </div>
          </div>
        )}

        {/* Phase 3: Social Sentiment Sources */}
        {phase3Status.filter(s => s.category === 'social').length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Social Sentiment
              <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">Phase 3</Badge>
            </h4>
            <div className="space-y-2">
              {phase3Status.filter(s => s.category === 'social').map(renderSourceStatus)}
            </div>
          </div>
        )}

        {/* Market Status */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Market Status:</span>
            <Badge className={
              status.marketStatus === 'open' ? 'bg-green-600' :
              status.marketStatus === 'pre-market' ? 'bg-blue-600' :
              status.marketStatus === 'after-hours' ? 'bg-purple-600' :
              'bg-slate-600'
            }>
              {status.marketStatus.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
          <div className="text-xs text-slate-500">
            Updated: {formatTimestamp(status.overall.lastUpdate)}
          </div>
        </div>

        {/* Data Source Legend */}
        <div className="pt-2 border-t border-slate-700">
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Live</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Cached</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Static</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>Stale</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Badge variant="outline" className="text-xs border-green-500 text-green-400 px-1">
                Free
              </Badge>
              <span>No API Key Required</span>
            </div>
          </div>
        </div>

        {/* API Key Reminder */}
        <div className="pt-2 border-t border-slate-700 bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div className="text-xs text-slate-400">
              <p className="font-medium text-yellow-400 mb-1">API Keys Required for Full Functionality:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Alpha Vantage (free tier) - Market data</li>
                <li>NewsAPI.org (free tier) - News headlines</li>
                <li>Event Registry (free tier) - Global events</li>
                <li>FRED API (free) - Economic indicators</li>
                <li>Commodities API (free tier) - Commodity prices</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeDataStatusComponent;