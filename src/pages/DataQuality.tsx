import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Database, 
  Cloud, 
  Globe, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Info,
  Settings,
  BarChart3,
  Clock,
  Trash2,
  Home,
  FileText
} from 'lucide-react';
import { getSystemStatus, clearAllCaches, getDataQualityBadge } from '@/services/hybridDataService';
import { getVerifiedCompanies } from '@/services/geographicExposureService';

interface RefreshSettings {
  enabled: boolean;
  interval: 'daily' | 'weekly' | 'monthly';
  lastRefresh: string | null;
}

export default function DataQualityDashboard() {
  const [systemStatus, setSystemStatus] = useState(getSystemStatus());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSettings, setRefreshSettings] = useState<RefreshSettings>(() => {
    const saved = localStorage.getItem('dataRefreshSettings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      interval: 'weekly',
      lastRefresh: null
    };
  });

  // Update system status
  const updateStatus = () => {
    setSystemStatus(getSystemStatus());
  };

  // Save refresh settings
  const saveRefreshSettings = (settings: RefreshSettings) => {
    setRefreshSettings(settings);
    localStorage.setItem('dataRefreshSettings', JSON.stringify(settings));
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear caches to force fresh data
      clearAllCaches();
      updateStatus();
      
      // Update last refresh time
      const newSettings = {
        ...refreshSettings,
        lastRefresh: new Date().toISOString()
      };
      saveRefreshSettings(newSettings);
      
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshing(false);
    }
  };

  // Clear all caches
  const handleClearCaches = () => {
    if (confirm('Are you sure you want to clear all cached data? This will force fresh data fetching for all companies.')) {
      clearAllCaches();
      updateStatus();
    }
  };

  // Automatic refresh check
  useEffect(() => {
    if (!refreshSettings.enabled || !refreshSettings.lastRefresh) return;

    const checkRefresh = () => {
      const lastRefresh = new Date(refreshSettings.lastRefresh!);
      const now = new Date();
      const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

      let shouldRefresh = false;
      switch (refreshSettings.interval) {
        case 'daily':
          shouldRefresh = hoursSinceRefresh >= 24;
          break;
        case 'weekly':
          shouldRefresh = hoursSinceRefresh >= 168; // 7 days
          break;
        case 'monthly':
          shouldRefresh = hoursSinceRefresh >= 720; // 30 days
          break;
      }

      if (shouldRefresh) {
        handleManualRefresh();
      }
    };

    // Check on mount and every hour
    checkRefresh();
    const interval = setInterval(checkRefresh, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshSettings]);

  // Calculate statistics
  const verifiedCompanies = getVerifiedCompanies();
  const totalCacheSize = systemStatus.totalCacheSize;
  const apiEnabled = Object.values(systemStatus.apiStatus).filter(api => api.enabled).length;
  
  const qualityDistribution = {
    verified: systemStatus.verifiedCompanies,
    api: systemStatus.apiStatus.cacheSize,
    scraped: systemStatus.scrapingStats.cacheSize,
    estimated: 0
  };

  const totalAssessed = qualityDistribution.verified + qualityDistribution.api + qualityDistribution.scraped;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Data Quality Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor data sources, cache statistics, and system health</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link href="/sector-multiplier-reference">
              <Button
                variant="outline"
                className="border-blue-300 hover:bg-blue-50 text-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Sector Multiplier Reference
              </Button>
            </Link>
            <Button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Now'}
            </Button>
            <Button
              onClick={handleClearCaches}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Caches
            </Button>
          </div>
        </div>

        {/* Auto-refresh settings alert */}
        {refreshSettings.enabled && (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Automatic Refresh Enabled</AlertTitle>
            <AlertDescription className="text-blue-700">
              Data will refresh automatically every {refreshSettings.interval}.
              {refreshSettings.lastRefresh && (
                <> Last refresh: {new Date(refreshSettings.lastRefresh).toLocaleString()}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                Verified Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{systemStatus.verifiedCompanies}</div>
              <p className="text-xs text-gray-500 mt-1">⭐⭐⭐⭐⭐ 100% Confidence</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                API Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{apiEnabled}/4</div>
              <p className="text-xs text-gray-500 mt-1">Active API integrations</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                Web Scraping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {systemStatus.scrapingStats.enabled ? 'Active' : 'Inactive'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{systemStatus.scrapingStats.sources.length} sources configured</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                Total Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">{totalCacheSize}</div>
              <p className="text-xs text-gray-500 mt-1">Cached companies</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apis">API Status</TabsTrigger>
            <TabsTrigger value="quality">Data Quality</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Data Quality Distribution
                </CardTitle>
                <CardDescription>Breakdown of data sources across all assessed companies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✅ Verified</Badge>
                        {qualityDistribution.verified} companies
                      </span>
                      <span className="text-sm text-gray-500">
                        {totalAssessed > 0 ? Math.round((qualityDistribution.verified / totalAssessed) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={totalAssessed > 0 ? (qualityDistribution.verified / totalAssessed) * 100 : 0} 
                      className="h-2 bg-gray-200"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">🔄 API Data</Badge>
                        {qualityDistribution.api} companies
                      </span>
                      <span className="text-sm text-gray-500">
                        {totalAssessed > 0 ? Math.round((qualityDistribution.api / totalAssessed) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={totalAssessed > 0 ? (qualityDistribution.api / totalAssessed) * 100 : 0} 
                      className="h-2 bg-gray-200"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">🌐 Web Scraped</Badge>
                        {qualityDistribution.scraped} companies
                      </span>
                      <span className="text-sm text-gray-500">
                        {totalAssessed > 0 ? Math.round((qualityDistribution.scraped / totalAssessed) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={totalAssessed > 0 ? (qualityDistribution.scraped / totalAssessed) * 100 : 0} 
                      className="h-2 bg-gray-200"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <strong>Total Companies Assessed:</strong> {totalAssessed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Potential Coverage:</strong> Thousands (via APIs and web scraping)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Verified Companies</CardTitle>
                <CardDescription>Sample of manually verified companies with 100% confidence data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {verifiedCompanies.slice(0, 20).map((ticker) => (
                    <Badge 
                      key={ticker} 
                      variant="outline" 
                      className="justify-center py-2 border-green-200 text-green-700"
                    >
                      {ticker}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500 text-center">
                  Showing 20 of {verifiedCompanies.length} verified companies
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Status Tab */}
          <TabsContent value="apis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Financial Modeling Prep */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Financial Modeling Prep</span>
                    {systemStatus.apiStatus.fmp.enabled ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300 text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Primary source for geographic revenue data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Key:</span>
                    <span className={systemStatus.apiStatus.fmp.hasKey ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.apiStatus.fmp.hasKey ? '✓ Configured' : '✗ Not configured'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span>{systemStatus.apiStatus.fmp.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  {!systemStatus.apiStatus.fmp.hasKey && (
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Add VITE_FMP_API_KEY to enable this source
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Yahoo Finance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Yahoo Finance</span>
                    {systemStatus.apiStatus.yahoo.enabled ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300 text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Free API for company profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Key:</span>
                    <span className="text-green-600">✓ Not required</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span>{systemStatus.apiStatus.yahoo.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <Alert className="mt-3 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-700">
                      No configuration needed - ready to use
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Alpha Vantage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Alpha Vantage</span>
                    {systemStatus.apiStatus.alphaVantage.enabled ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300 text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Secondary financial data source</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Key:</span>
                    <span className={systemStatus.apiStatus.alphaVantage.hasKey ? 'text-green-600' : 'text-red-600'}>
                      {systemStatus.apiStatus.alphaVantage.hasKey ? '✓ Configured' : '✗ Not configured'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span>{systemStatus.apiStatus.alphaVantage.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  {!systemStatus.apiStatus.alphaVantage.hasKey && (
                    <Alert className="mt-3">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Add VITE_ALPHA_VANTAGE_API_KEY to enable
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* SEC EDGAR */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>SEC EDGAR</span>
                    {systemStatus.apiStatus.sec.enabled ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-300 text-gray-500">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>SEC filings and company facts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Key:</span>
                    <span className="text-green-600">✓ Not required</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span>{systemStatus.apiStatus.sec.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <Alert className="mt-3 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs text-green-700">
                      Public API - ready to use
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Current cache sizes and durations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">API Cache</div>
                    <div className="text-2xl font-bold text-blue-600">{systemStatus.apiStatus.cacheSize}</div>
                    <div className="text-xs text-gray-500 mt-1">24-hour cache duration</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Web Scraping Cache</div>
                    <div className="text-2xl font-bold text-purple-600">{systemStatus.scrapingStats.cacheSize}</div>
                    <div className="text-xs text-gray-500 mt-1">7-day cache duration</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Levels</CardTitle>
                <CardDescription>Understanding confidence scores and data sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(['verified', 'api', 'scraped', 'estimated'] as const).map((quality) => {
                  const badge = getDataQualityBadge(quality);
                  return (
                    <div key={quality} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{badge.emoji}</span>
                          <div>
                            <div className="font-semibold">{badge.label}</div>
                            <div className="text-sm text-gray-500">{badge.stars} stars</div>
                          </div>
                        </div>
                        <Badge 
                          className={
                            quality === 'verified' ? 'bg-green-100 text-green-700' :
                            quality === 'api' ? 'bg-blue-100 text-blue-700' :
                            quality === 'scraped' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }
                        >
                          {quality === 'verified' ? '100%' :
                           quality === 'api' ? '90%' :
                           quality === 'scraped' ? '80%' : '60%'} Confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Source Priority</CardTitle>
                <CardDescription>How the system selects data sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { level: 1, source: 'Verified Database', confidence: '100%', description: '93 manually verified companies' },
                    { level: 2, source: 'API Cache', confidence: '90%', description: 'Recently fetched API data (24h cache)' },
                    { level: 3, source: 'Web Scraping Cache', confidence: '80%', description: 'Recently scraped data (7d cache)' },
                    { level: 4, source: 'Live API Fetch', confidence: '90%', description: 'Real-time API request' },
                    { level: 5, source: 'Live Web Scraping', confidence: '80%', description: 'Real-time web scraping' },
                    { level: 6, source: 'Sector Pattern Estimate', confidence: '60%', description: 'Fallback estimation' }
                  ].map((item) => (
                    <div key={item.level} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {item.level}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.source}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      <Badge variant="outline">{item.confidence}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Automatic Data Refresh
                </CardTitle>
                <CardDescription>Configure automatic refresh intervals for cached data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-refresh" className="text-base font-medium">
                      Enable Automatic Refresh
                    </Label>
                    <p className="text-sm text-gray-500">
                      Automatically refresh cached data at specified intervals
                    </p>
                  </div>
                  <Switch
                    id="auto-refresh"
                    checked={refreshSettings.enabled}
                    onCheckedChange={(enabled) => {
                      const newSettings = {
                        ...refreshSettings,
                        enabled,
                        lastRefresh: enabled ? new Date().toISOString() : refreshSettings.lastRefresh
                      };
                      saveRefreshSettings(newSettings);
                    }}
                  />
                </div>

                {refreshSettings.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="refresh-interval">Refresh Interval</Label>
                      <Select
                        value={refreshSettings.interval}
                        onValueChange={(interval: 'daily' | 'weekly' | 'monthly') => {
                          saveRefreshSettings({ ...refreshSettings, interval });
                        }}
                      >
                        <SelectTrigger id="refresh-interval">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily (24 hours)</SelectItem>
                          <SelectItem value="weekly">Weekly (7 days)</SelectItem>
                          <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        How often to automatically refresh cached data
                      </p>
                    </div>

                    {refreshSettings.lastRefresh && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>Last Refresh</AlertTitle>
                        <AlertDescription>
                          {new Date(refreshSettings.lastRefresh).toLocaleString()}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Setup instructions for external APIs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Environment Variables</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>Add these to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file:</p>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`VITE_FMP_API_KEY=your_fmp_key_here
VITE_ALPHA_VANTAGE_API_KEY=your_av_key_here`}
                    </pre>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Financial Modeling Prep</div>
                    <p className="text-sm text-gray-600 mb-2">
                      Get your free API key at: <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">financialmodelingprep.com</a>
                    </p>
                    <Badge variant="outline">Free tier: 250 requests/day</Badge>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">Alpha Vantage</div>
                    <p className="text-sm text-gray-600 mb-2">
                      Get your free API key at: <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">alphavantage.co</a>
                    </p>
                    <Badge variant="outline">Free tier: 500 requests/day</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
                <CardDescription>Manage cached data and storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Total Cached Companies</div>
                    <div className="text-sm text-gray-500">{totalCacheSize} companies in cache</div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleClearCaches}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Clearing caches will force fresh data fetching for all companies on their next assessment.
                    This may increase API usage and loading times.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}