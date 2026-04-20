'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Download,
  Settings,
  Calendar,
  Filter,
  TrendingUp,
  Play,
  Pause,
  Zap
} from 'lucide-react';
import { DataQualityChecker, DataQualityReport } from './DataQualityChecker';
import { MonthlyUpdater, MonthlyUpdateConfig, MonthlyUpdateResult, defaultMonthlyConfig } from './MonthlyUpdater';
import { SegmentFilter, FilterResult } from './SegmentFilter';

interface EnhancedQualitySummary {
  totalCompanies: number;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  avgScore: number;
  avgAge: number;
  staleDataCount: number;
  suspiciousDataCount: number;
  recommendedActions: string[];
  filteringStats?: any;
}

export function EnhancedDataQualityDashboard() {
  const [reports, setReports] = useState<DataQualityReport[]>([]);
  const [summary, setSummary] = useState<EnhancedQualitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [monthlyConfig, setMonthlyConfig] = useState<MonthlyUpdateConfig>(defaultMonthlyConfig);
  const [monthlyUpdater, setMonthlyUpdater] = useState<MonthlyUpdater | null>(null);
  const [updaterStatus, setUpdaterStatus] = useState<{isRunning: boolean, nextRun: Date | null}>({
    isRunning: false,
    nextRun: null
  });
  const [lastUpdateResult, setLastUpdateResult] = useState<MonthlyUpdateResult | null>(null);

  const checker = new DataQualityChecker();
  const filter = new SegmentFilter();

  useEffect(() => {
    runQualityCheck();
    initializeMonthlyUpdater();
  }, []);

  const initializeMonthlyUpdater = () => {
    const updater = new MonthlyUpdater(monthlyConfig);
    setMonthlyUpdater(updater);
    
    if (monthlyConfig.enabled) {
      updater.start();
    }
    
    updateStatus(updater);
  };

  const updateStatus = (updater: MonthlyUpdater) => {
    const status = updater.getStatus();
    setUpdaterStatus(status);
  };

  const runQualityCheck = async () => {
    setLoading(true);
    try {
      const qualityReports = await checker.runFullQualityCheck();
      const qualitySummary = checker.generateQualitySummary(qualityReports);
      
      // Run segment analysis for additional insights
      const { getCompaniesWithSpecificExposures, getCompanySpecificExposure } = await import('../../data/companySpecificExposures');
      const companies = getCompaniesWithSpecificExposures();
      const filterResults: FilterResult[] = [];
      
      for (const ticker of companies) {
        const exposure = getCompanySpecificExposure(ticker);
        if (exposure && exposure.exposures) {
          const filterResult = filter.filterSuspiciousSegments(exposure.exposures);
          filterResults.push(filterResult);
        }
      }
      
      const filteringStats = filter.getFilteringStats(filterResults);
      
      setReports(qualityReports);
      setSummary({
        ...qualitySummary,
        filteringStats
      });
      setLastRun(new Date());
    } catch (error) {
      console.error('Quality check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSegmentFiltering = async () => {
    setLoading(true);
    try {
      const { getCompaniesWithSpecificExposures, getCompanySpecificExposure } = await import('../../data/companySpecificExposures');
      const companies = getCompaniesWithSpecificExposures();
      let totalFiltered = 0;
      
      for (const ticker of companies) {
        const exposure = getCompanySpecificExposure(ticker);
        if (exposure && exposure.exposures) {
          const filterResult = filter.filterSuspiciousSegments(exposure.exposures);
          totalFiltered += filterResult.originalCount - filterResult.filteredCount;
          
          if (filterResult.removedSegments.length > 0) {
            console.log(`${ticker}: Removed ${filterResult.removedSegments.length} suspicious segments`);
          }
        }
      }
      
      alert(`Filtering complete! Removed ${totalFiltered} suspicious segments across all companies.`);
      await runQualityCheck(); // Refresh data
    } catch (error) {
      console.error('Segment filtering failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runManualMonthlyUpdate = async () => {
    if (!monthlyUpdater) return;
    
    setLoading(true);
    try {
      const result = await monthlyUpdater.runManualUpdate();
      setLastUpdateResult(result);
      await runQualityCheck(); // Refresh data after update
      alert(`Monthly update complete! Quality improved by ${result.qualityImprovement.toFixed(1)} points.`);
    } catch (error) {
      console.error('Manual update failed:', error);
      alert('Manual update failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonthlyUpdates = (enabled: boolean) => {
    const newConfig = { ...monthlyConfig, enabled };
    setMonthlyConfig(newConfig);
    
    if (monthlyUpdater) {
      monthlyUpdater.updateConfig(newConfig);
      if (enabled) {
        monthlyUpdater.start();
      } else {
        monthlyUpdater.stop();
      }
      updateStatus(monthlyUpdater);
    }
  };

  const updateMonthlyConfig = (updates: Partial<MonthlyUpdateConfig>) => {
    const newConfig = { ...monthlyConfig, ...updates };
    setMonthlyConfig(newConfig);
    
    if (monthlyUpdater) {
      monthlyUpdater.updateConfig(newConfig);
      updateStatus(monthlyUpdater);
    }
  };

  const exportResults = () => {
    const csvContent = [
      ['Ticker', 'Company', 'Score', 'Data Age (days)', 'Issues', 'Recommendations'].join(','),
      ...reports.map(report => [
        report.companyTicker,
        `"${report.companyName}"`,
        report.score,
        report.dataAge,
        report.issues.length,
        `"${report.recommendations.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-quality-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Data Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor, filter, and automatically update geographic exposure data
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runQualityCheck} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
          <Button variant="outline" onClick={runSegmentFiltering} disabled={loading}>
            <Filter className="w-4 h-4 mr-2" />
            Filter Segments
          </Button>
          <Button variant="outline" onClick={exportResults} disabled={!reports.length}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {lastRun && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Last Quality Check</AlertTitle>
          <AlertDescription>
            Completed at {lastRun.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="filtering">Segment Filtering</TabsTrigger>
          <TabsTrigger value="monthly-updates">Monthly Updates</TabsTrigger>
          <TabsTrigger value="companies">Company Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalCompanies}</div>
                  <p className="text-xs text-muted-foreground">
                    With geographic exposure data
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getScoreColor(summary.avgScore)}`}>
                    {summary.avgScore}/100
                  </div>
                  <Progress value={summary.avgScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suspicious Segments</CardTitle>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {summary.filteringStats?.segmentsRemoved || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Can be filtered out
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Updates</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant={monthlyConfig.enabled ? 'default' : 'secondary'}>
                      {monthlyConfig.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {updaterStatus.nextRun ? `Next: ${updaterStatus.nextRun.toLocaleDateString()}` : 'Not scheduled'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="filtering" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Filtering Results</CardTitle>
              <CardDescription>
                Analysis of suspicious non-geographic segments in the data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.filteringStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{summary.filteringStats.totalOriginalSegments}</div>
                      <div className="text-sm text-muted-foreground">Original Segments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{summary.filteringStats.segmentsRemoved}</div>
                      <div className="text-sm text-muted-foreground">Suspicious Segments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{summary.filteringStats.totalFilteredSegments}</div>
                      <div className="text-sm text-muted-foreground">Clean Segments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{summary.filteringStats.removalRate}</div>
                      <div className="text-sm text-muted-foreground">Removal Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Categories of Removed Segments</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span>Financial Items:</span>
                        <Badge>{summary.filteringStats.categorizedRemovals.financialItems}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Business Segments:</span>
                        <Badge>{summary.filteringStats.categorizedRemovals.businessSegments}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Accounting Notes:</span>
                        <Badge>{summary.filteringStats.categorizedRemovals.accountingNotes}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Other:</span>
                        <Badge>{summary.filteringStats.categorizedRemovals.other}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Most Frequently Removed Segments</h4>
                    <div className="space-y-1">
                      {summary.filteringStats.topRemovedSegments?.slice(0, 5).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">{item.segment}</span>
                          <Badge variant="outline">{item.count} companies</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={runSegmentFiltering} disabled={loading} className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Apply Filtering to All Companies
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Run a quality check to see filtering analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly-updates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Update Configuration</CardTitle>
                <CardDescription>
                  Configure automatic monthly data updates and segment filtering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monthly-enabled">Enable Monthly Updates</Label>
                  <Switch
                    id="monthly-enabled"
                    checked={monthlyConfig.enabled}
                    onCheckedChange={toggleMonthlyUpdates}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day-of-month">Day of Month (1-28)</Label>
                  <Input
                    id="day-of-month"
                    type="number"
                    min="1"
                    max="28"
                    value={monthlyConfig.dayOfMonth}
                    onChange={(e) => updateMonthlyConfig({ dayOfMonth: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-of-day">Time of Day (24-hour format)</Label>
                  <Input
                    id="time-of-day"
                    type="time"
                    value={monthlyConfig.timeOfDay}
                    onChange={(e) => updateMonthlyConfig({ timeOfDay: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-filter">Auto-filter Suspicious Segments</Label>
                  <Switch
                    id="auto-filter"
                    checked={monthlyConfig.autoFilterSuspiciousSegments}
                    onCheckedChange={(checked) => updateMonthlyConfig({ autoFilterSuspiciousSegments: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality-threshold">Quality Threshold for Auto-Update</Label>
                  <Input
                    id="quality-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={monthlyConfig.qualityThresholdForAutoUpdate}
                    onChange={(e) => updateMonthlyConfig({ qualityThresholdForAutoUpdate: parseInt(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>
                  Current status and controls for monthly updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={updaterStatus.isRunning ? 'default' : 'secondary'}>
                    {updaterStatus.isRunning ? 'Running' : 'Idle'}
                  </Badge>
                  {updaterStatus.isRunning && <Zap className="w-4 h-4 text-yellow-500" />}
                </div>

                {updaterStatus.nextRun && (
                  <div>
                    <Label>Next Scheduled Run</Label>
                    <p className="text-sm text-muted-foreground">
                      {updaterStatus.nextRun.toLocaleString()}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={runManualMonthlyUpdate} 
                  disabled={loading || updaterStatus.isRunning}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Manual Update Now
                </Button>

                {lastUpdateResult && (
                  <div className="space-y-2">
                    <Label>Last Update Results</Label>
                    <div className="text-sm space-y-1">
                      <div>Date: {lastUpdateResult.runDate.toLocaleString()}</div>
                      <div>Companies Updated: {lastUpdateResult.companiesUpdated}/{lastUpdateResult.companiesProcessed}</div>
                      <div>Quality Improvement: +{lastUpdateResult.qualityImprovement.toFixed(1)} points</div>
                      <div>Segments Filtered: {lastUpdateResult.segmentsFiltered}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.companyTicker}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {report.companyTicker}
                        <Badge variant={report.score >= 80 ? 'default' : report.score >= 60 ? 'secondary' : 'destructive'}>
                          Score: {report.score}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{report.companyName}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Updated: {report.lastUpdated}</div>
                      <div>Age: {report.dataAge} days</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Issues ({report.issues.length})</h4>
                        <div className="space-y-1">
                          {report.issues.slice(0, 3).map((issue, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(issue.severity) as any} className="text-xs">
                                {issue.severity}
                              </Badge>
                              <span className="text-sm">{issue.description}</span>
                            </div>
                          ))}
                          {report.issues.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              +{report.issues.length - 3} more issues
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {report.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <ul className="text-sm space-y-1">
                          {report.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}