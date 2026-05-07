import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Network,
  Activity,
  Globe,
  RefreshCw,
  Home,
  AlertCircle,
  Shield,
  GitBranch
} from 'lucide-react';
import { csiEventStore, CSIEvent } from '@/services/csi/eventStore';
import {
  detectCorrelations,
  analyzeImpact,
  generateRiskPredictions,
  detectEarlyWarnings,
  getCorrelationMatrix,
  type CorrelationResult,
  type ImpactAnalysis,
  type RiskPrediction,
  type EarlyWarning
} from '@/services/csi/analytics/csiAnalyticsAdapter';

export default function CSIAnalyticsDashboard() {
  const [events, setEvents] = useState<CSIEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [impactAnalyses, setImpactAnalyses] = useState<ImpactAnalysis[]>([]);
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([]);
  const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarning[]>([]);

  useEffect(() => {
    loadData();
    
    // Subscribe to event updates
    const unsubscribe = csiEventStore.subscribe((updatedEvents) => {
      setEvents(updatedEvents);
      performAnalytics(updatedEvents);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allEvents = csiEventStore.getAllEvents();
      setEvents(allEvents);
      
      const stats = csiEventStore.getStatistics();
      setStatistics(stats);
      
      performAnalytics(allEvents);
    } catch (error) {
      console.error('Failed to load CSI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAnalytics = (eventData: CSIEvent[]) => {
    try {
      // Run all analytics
      const correlationResults = detectCorrelations(eventData);
      setCorrelations(correlationResults);

      const impactResults = analyzeImpact(eventData);
      setImpactAnalyses(impactResults);

      const riskResults = generateRiskPredictions(eventData);
      setRiskPredictions(riskResults);

      const warningResults = detectEarlyWarnings(eventData);
      setEarlyWarnings(warningResults);
    } catch (error) {
      console.error('Failed to perform analytics:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'tariff': return '💰';
      case 'sanction': return '🚫';
      case 'trade_agreement': return '🤝';
      case 'political_instability': return '⚠️';
      case 'natural_disaster': return '🌪️';
      case 'regulatory_change': return '📋';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-[#7fa89f] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading CSI Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0f1e2e] to-[#0a1628]">
      {/* Header */}
      <div className="bg-[#0d5f5f]/95 backdrop-blur-sm border-b border-[#0d5f5f]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-[#7fa89f]" />
                CSI Analytics Dashboard
              </h1>
              <p className="text-gray-300 mt-2">
                Advanced analytics, correlations, and risk predictions
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button 
                  variant="outline"
                  className="border-[#7fa89f] text-[#7fa89f] hover:bg-[#7fa89f] hover:text-[#0f1e2e]"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
              <Button 
                onClick={loadData}
                className="bg-[#7fa89f] hover:bg-[#6a8f86] text-[#0f1e2e]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#7fa89f]" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{statistics?.totalEvents || 0}</div>
              <p className="text-xs text-gray-400 mt-1">Tracked events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Critical Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {statistics?.bySeverity?.critical || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">Requiring immediate attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Network className="h-4 w-4 text-[#7fa89f]" />
                Correlations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{correlations.length}</div>
              <p className="text-xs text-gray-400 mt-1">Detected patterns</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#7fa89f]" />
                Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {Object.keys(statistics?.byCountry || {}).length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Affected regions</p>
            </CardContent>
          </Card>
        </div>

        {/* Early Warning Alerts */}
        {earlyWarnings.length > 0 && (
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Early Warning Signals
              </CardTitle>
              <CardDescription className="text-gray-400">
                Detected escalation patterns and contagion risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earlyWarnings.map((warning, index) => (
                  <div
                    key={index}
                    className="bg-[#0d5f5f]/20 border border-red-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{warning.country}</h3>
                        <p className="text-sm text-gray-400">{warning.warningType}</p>
                      </div>
                      <Badge className={`${getSeverityColor(warning.severity.toLowerCase())} text-white`}>
                        {warning.severity}
                      </Badge>
                    </div>
                    <p className="text-gray-300 text-sm">{warning.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-[#0d5f5f]/30 border border-[#7fa89f]/30">
            <TabsTrigger value="events" className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]">
              Recent Events
            </TabsTrigger>
            <TabsTrigger value="correlations" className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]">
              Correlations
            </TabsTrigger>
            <TabsTrigger value="impact" className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]">
              Impact Analysis
            </TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-[#0f1e2e]">
              Risk Predictions
            </TabsTrigger>
          </TabsList>

          {/* Recent Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader>
                <CardTitle className="text-white">Recent CSI Events</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest geopolitical events affecting supply chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4 hover:bg-[#0d5f5f]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getEventTypeIcon(event.eventType)}</span>
                          <div>
                            <h3 className="text-white font-semibold">{event.country}</h3>
                            <p className="text-sm text-gray-400">
                              {new Date(event.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{event.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {event.affectedSectors.map((sector) => (
                          <Badge
                            key={sector}
                            variant="outline"
                            className="border-[#7fa89f]/30 text-[#7fa89f]"
                          >
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Correlations Tab */}
          <TabsContent value="correlations" className="space-y-4">
            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-[#7fa89f]" />
                  Event Correlations
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Detected relationships and patterns between events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {correlations.length > 0 ? (
                  <div className="space-y-4">
                    {correlations.slice(0, 15).map((correlation, index) => (
                      <div
                        key={index}
                        className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{correlation.event1.country}</span>
                            <span className="text-gray-400">↔</span>
                            <span className="text-white font-semibold">{correlation.event2.country}</span>
                          </div>
                          <Badge className="bg-[#7fa89f] text-[#0f1e2e]">
                            {correlation.strength}% strength
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{correlation.description}</p>
                        <Badge variant="outline" className="border-[#7fa89f]/30 text-[#7fa89f] capitalize">
                          {correlation.correlationType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No significant correlations detected yet. More data needed for pattern analysis.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impact Analysis Tab */}
          <TabsContent value="impact" className="space-y-4">
            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader>
                <CardTitle className="text-white">Impact Analysis</CardTitle>
                <CardDescription className="text-gray-400">
                  Comprehensive impact scores for recent events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {impactAnalyses.length > 0 ? (
                  <div className="space-y-4">
                    {impactAnalyses.slice(0, 10).map((impact) => (
                      <div
                        key={impact.eventId}
                        className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{impact.country}</h3>
                          <Badge className="bg-orange-500 text-white">
                            Score: {impact.compositeScore}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Geographic Reach</span>
                              <span className="text-white">{impact.geographicReach}%</span>
                            </div>
                            <Progress value={impact.geographicReach} className="h-2 bg-[#0d5f5f]/30" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Sector Breadth</span>
                              <span className="text-white">{impact.sectorBreadth}%</span>
                            </div>
                            <Progress value={impact.sectorBreadth} className="h-2 bg-[#0d5f5f]/30" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Severity Impact</span>
                              <span className="text-white">{impact.severityImpact}%</span>
                            </div>
                            <Progress value={impact.severityImpact} className="h-2 bg-[#0d5f5f]/30" />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {impact.affectedSectors.map((sector) => (
                            <Badge
                              key={sector}
                              variant="outline"
                              className="border-[#7fa89f]/30 text-[#7fa89f]"
                            >
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Impact analysis in progress. Results will appear here.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <Card className="bg-gradient-to-br from-[#0d5f5f]/30 to-[#0d5f5f]/10 border-[#7fa89f]/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#7fa89f]" />
                  Risk Predictions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Country-specific risk assessments and predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {riskPredictions.length > 0 ? (
                  <div className="space-y-4">
                    {riskPredictions.map((prediction) => (
                      <div
                        key={prediction.country}
                        className="bg-[#0d5f5f]/20 border border-[#7fa89f]/20 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{prediction.country}</h3>
                          <Badge className={`${getRiskLevelColor(prediction.riskLevel)} text-white`}>
                            {prediction.riskLevel}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Overall Risk</span>
                            <span className="text-white">{prediction.overallRisk}%</span>
                          </div>
                          <Progress value={prediction.overallRisk} className="h-2 bg-[#0d5f5f]/30" />
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-400 mb-2">Top Risk Factors:</p>
                          <div className="flex flex-wrap gap-2">
                            {prediction.topRiskFactors.map((factor, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-orange-500/30 text-orange-400"
                              >
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-gray-400">Confidence: </span>
                          <span className="text-white">{prediction.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Generating predictions... Machine learning models are analyzing patterns.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}