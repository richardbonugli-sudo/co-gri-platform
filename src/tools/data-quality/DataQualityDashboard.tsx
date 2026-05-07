'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Download,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { DataQualityChecker, DataQualityReport } from './DataQualityChecker';

interface QualitySummary {
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
}

export function DataQualityDashboard() {
  const [reports, setReports] = useState<DataQualityReport[]>([]);
  const [summary, setSummary] = useState<QualitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const checker = new DataQualityChecker();

  const runQualityCheck = async () => {
    setLoading(true);
    try {
      const qualityReports = await checker.runFullQualityCheck();
      const qualitySummary = checker.generateQualitySummary(qualityReports);
      
      setReports(qualityReports);
      setSummary(qualitySummary);
      setLastRun(new Date());
    } catch (error) {
      console.error('Quality check failed:', error);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    runQualityCheck();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and maintain geographic exposure data quality
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runQualityCheck} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Check
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
              <CardTitle className="text-sm font-medium">Stale Data</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {summary.staleDataCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Companies need updates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.suspiciousDataCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Companies with suspicious segments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="companies">Company Details</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Distribution</CardTitle>
                  <CardDescription>Companies by quality score ranges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>High Quality (80-100)</span>
                    <Badge variant="default">{summary.qualityDistribution.high}</Badge>
                  </div>
                  <Progress value={(summary.qualityDistribution.high / summary.totalCompanies) * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span>Medium Quality (60-79)</span>
                    <Badge variant="secondary">{summary.qualityDistribution.medium}</Badge>
                  </div>
                  <Progress value={(summary.qualityDistribution.medium / summary.totalCompanies) * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span>Low Quality (0-59)</span>
                    <Badge variant="destructive">{summary.qualityDistribution.low}</Badge>
                  </div>
                  <Progress value={(summary.qualityDistribution.low / summary.totalCompanies) * 100} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>Priority improvements needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summary.recommendedActions.map((action, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{action}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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

        <TabsContent value="issues" className="space-y-4">
          <div className="grid gap-4">
            {['HIGH', 'MEDIUM', 'LOW'].map((severity) => {
              const issuesOfSeverity = reports.flatMap(report => 
                report.issues
                  .filter(issue => issue.severity === severity)
                  .map(issue => ({ ...issue, ticker: report.companyTicker }))
              );

              if (issuesOfSeverity.length === 0) return null;

              return (
                <Card key={severity}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {severity} Severity Issues
                      <Badge variant={getSeverityColor(severity) as any}>
                        {issuesOfSeverity.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {issuesOfSeverity.slice(0, 10).map((issue, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <span className="font-medium">{issue.ticker}</span>
                            <span className="ml-2 text-sm">{issue.description}</span>
                          </div>
                          <Badge variant="outline">{issue.type}</Badge>
                        </div>
                      ))}
                      {issuesOfSeverity.length > 10 && (
                        <div className="text-center text-sm text-muted-foreground">
                          +{issuesOfSeverity.length - 10} more {severity.toLowerCase()} issues
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}