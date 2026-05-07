import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Database,
  Shield,
  FileText,
  BarChart3
} from 'lucide-react';

export default function CSIValidationDashboard() {
  const [systemHealth, setSystemHealth] = useState({
    initialized: true,
    totalSignals: 1247,
    activeCandidates: 23,
    validatedEvents: 156,
    activeCountries: 8,
    avgDataQuality: 0.87
  });

  const [csiScores, setCSIScores] = useState([
    { country: 'CHN', composite: 62.4, baseline: 58.2, drift: 2.8, delta: 1.4, trend: 'deteriorating' },
    { country: 'JPN', composite: 45.3, baseline: 44.8, drift: 0.3, delta: 0.2, trend: 'stable' },
    { country: 'KOR', composite: 48.7, baseline: 47.5, drift: 0.8, delta: 0.4, trend: 'deteriorating' },
    { country: 'TWN', composite: 51.2, baseline: 50.1, drift: 0.7, delta: 0.4, trend: 'deteriorating' },
    { country: 'VNM', composite: 55.8, baseline: 54.2, drift: 1.2, delta: 0.4, trend: 'deteriorating' },
    { country: 'THA', composite: 52.3, baseline: 51.8, drift: 0.3, delta: 0.2, trend: 'stable' },
    { country: 'SGP', composite: 38.9, baseline: 38.5, drift: 0.2, delta: 0.2, trend: 'stable' },
    { country: 'MYS', composite: 49.6, baseline: 48.9, drift: 0.5, delta: 0.2, trend: 'stable' }
  ]);

  const [gatingStats, setGatingStats] = useState({
    tierValidation: { passed: 145, failed: 34, rate: 81.0 },
    crossSource: { passed: 138, failed: 41, rate: 77.1 },
    temporalCoherence: { passed: 167, failed: 12, rate: 93.3 },
    vectorAlignment: { passed: 171, failed: 8, rate: 95.5 },
    criticalValidation: { passed: 12, failed: 3, rate: 80.0 }
  });

  const [recentDeltas, setRecentDeltas] = useState([
    {
      id: 'delta_001',
      timestamp: '2026-02-01 14:23:15',
      country: 'CHN',
      vector: 'Political',
      type: 'escalation',
      impact: '+2.8',
      validated: true
    },
    {
      id: 'delta_002',
      timestamp: '2026-02-01 13:45:32',
      country: 'KOR',
      vector: 'Economic',
      type: 'new',
      impact: '+1.2',
      validated: true
    },
    {
      id: 'delta_003',
      timestamp: '2026-02-01 12:18:47',
      country: 'VNM',
      vector: 'Political',
      type: 'escalation',
      impact: '+1.5',
      validated: true
    },
    {
      id: 'delta_004',
      timestamp: '2026-02-01 11:52:03',
      country: 'JPN',
      vector: 'Economic',
      type: 'de-escalation',
      impact: '-0.8',
      validated: true
    },
    {
      id: 'delta_005',
      timestamp: '2026-02-01 10:34:21',
      country: 'TWN',
      vector: 'Security',
      type: 'new',
      impact: '+1.1',
      validated: true
    }
  ]);

  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgCalculationTime: 45,
    avgSignalProcessing: 12,
    avgGatingValidation: 8,
    cacheHitRate: 89.3,
    errorRate: 0.2
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              CSI Engine Validation Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Phase 1 Implementation Monitoring & Validation
            </p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Live Monitoring
          </Badge>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="w-4 h-4 mr-2 text-blue-500" />
                Total Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemHealth.totalSignals.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">Escalation signals logged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                Active Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemHealth.activeCandidates}</div>
              <p className="text-xs text-slate-500 mt-1">Pending validation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Validated Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{systemHealth.validatedEvents}</div>
              <p className="text-xs text-slate-500 mt-1">Passed gating checks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Shield className="w-4 h-4 mr-2 text-purple-500" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(systemHealth.avgDataQuality * 100).toFixed(1)}%</div>
              <Progress value={systemHealth.avgDataQuality * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="csi-scores" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="csi-scores">CSI Scores</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
            <TabsTrigger value="gating">Gating Logic</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* CSI Scores Tab */}
          <TabsContent value="csi-scores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time CSI Calculations</CardTitle>
                <CardDescription>
                  Current CSI scores for monitored countries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {csiScores.map((score) => (
                    <div key={score.country} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{score.country}</span>
                          <Badge variant={
                            score.trend === 'deteriorating' ? 'destructive' : 
                            score.trend === 'improving' ? 'default' : 
                            'secondary'
                          }>
                            {score.trend === 'deteriorating' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {score.trend === 'improving' && <TrendingDown className="w-3 h-3 mr-1" />}
                            {score.trend}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold">{score.composite.toFixed(1)}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500">Baseline</div>
                          <div className="font-semibold">{score.baseline.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Drift</div>
                          <div className="font-semibold text-orange-600">+{score.drift.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Delta</div>
                          <div className="font-semibold text-red-600">+{score.delta.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attribution Tab */}
          <TabsContent value="attribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CSI Attribution Breakdown</CardTitle>
                <CardDescription>
                  Formula: CSI(t) = Baseline + Drift + Delta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {csiScores.slice(0, 3).map((score) => (
                    <div key={score.country} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{score.country}</span>
                        <span className="text-2xl font-bold">{score.composite.toFixed(1)}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Baseline (Historical Average)</span>
                          <span className="font-medium">{score.baseline.toFixed(1)}</span>
                        </div>
                        <Progress value={(score.baseline / score.composite) * 100} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Drift (Validated Events, 6mo)</span>
                          <span className="font-medium text-orange-600">+{score.drift.toFixed(1)}</span>
                        </div>
                        <Progress value={(score.drift / score.composite) * 100} className="h-2 bg-orange-100" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Delta (Recent Events w/ Decay)</span>
                          <span className="font-medium text-red-600">+{score.delta.toFixed(1)}</span>
                        </div>
                        <Progress value={(score.delta / score.composite) * 100} className="h-2 bg-red-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gating Logic Tab */}
          <TabsContent value="gating" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gating Rule Enforcement</CardTitle>
                <CardDescription>
                  Validation statistics for each gating rule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(gatingStats).map(([rule, stats]) => (
                    <div key={rule} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{rule.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Badge variant={stats.rate >= 80 ? 'default' : 'destructive'}>
                          {stats.rate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          Passed: {stats.passed}
                        </span>
                        <span className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                          Failed: {stats.failed}
                        </span>
                      </div>
                      <Progress value={stats.rate} className="mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent CSI Deltas</CardTitle>
                <CardDescription>
                  Audit trail of all CSI-affecting events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentDeltas.map((delta) => (
                    <div key={delta.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          delta.type === 'escalation' ? 'bg-red-500' :
                          delta.type === 'de-escalation' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{delta.country} - {delta.vector}</div>
                          <div className="text-xs text-slate-500">{delta.timestamp}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{delta.type}</Badge>
                        <span className={`font-semibold ${
                          delta.impact.startsWith('+') ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {delta.impact}
                        </span>
                        {delta.validated && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calculation Performance</CardTitle>
                  <CardDescription>Average processing times</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">CSI Calculation</span>
                      <span className="font-bold">{performanceMetrics.avgCalculationTime}ms</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Signal Processing</span>
                      <span className="font-bold">{performanceMetrics.avgSignalProcessing}ms</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Gating Validation</span>
                      <span className="font-bold">{performanceMetrics.avgGatingValidation}ms</span>
                    </div>
                    <Progress value={8} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>Efficiency indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="font-bold">{performanceMetrics.cacheHitRate}%</span>
                    </div>
                    <Progress value={performanceMetrics.cacheHitRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Error Rate</span>
                      <span className="font-bold">{performanceMetrics.errorRate}%</span>
                    </div>
                    <Progress value={performanceMetrics.errorRate} className="h-2 bg-red-100" />
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Performance Target</span>
                      <Badge variant="default">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Met (&lt;100ms)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Actions</CardTitle>
            <CardDescription>
              Tools for testing and validation
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              Run Test Suite
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Audit Trail
            </Button>
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}