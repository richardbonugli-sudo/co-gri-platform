import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, AlertCircle, Target, CheckCircle, XCircle } from 'lucide-react';
import { GroundTruthRecallAuditService } from '@/services/audits/GroundTruthRecallAuditService';
import { AuditReportGenerator } from '@/services/audits/AuditReportGenerator';
import { AuditProgressTracker } from '@/components/audit/shared/AuditProgressTracker';
import { AuditTimeRangeSelector } from '@/components/audit/shared/AuditTimeRangeSelector';
import { AuditExportMenu } from '@/components/audit/shared/AuditExportMenu';
import { AuditMetricCard } from '@/components/audit/shared/AuditMetricCard';
import { AuditSectionCard } from '@/components/audit/shared/AuditSectionCard';
import { GroundTruthEventList } from '@/components/audit/ground-truth/GroundTruthEventList';
import { RecallRateChart } from '@/components/audit/ground-truth/RecallRateChart';
import { FalseNegativeBreakdown } from '@/components/audit/ground-truth/FalseNegativeBreakdown';
import { RoutingAccuracyMatrix } from '@/components/audit/ground-truth/RoutingAccuracyMatrix';
import { GroundTruthRecallAuditResult, TimeWindow, AuditProgress } from '@/types/audit.types';

export default function GroundTruthRecallAuditDashboard() {
  const [auditService] = useState(() => new GroundTruthRecallAuditService());
  const [reportGenerator] = useState(() => new AuditReportGenerator());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ type: 'last_12_months' });
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [results, setResults] = useState<GroundTruthRecallAuditResult | null>(null);
  const [activeSection, setActiveSection] = useState('1');

  const handleRunAudit = async () => {
    setIsRunning(true);
    setProgress(null);
    setResults(null);

    try {
      const result = await auditService.executeAudit(timeWindow, (prog) => {
        setProgress(prog);
      });
      setResults(result);
    } catch (error) {
      console.error('Audit failed:', error);
      alert('Audit execution failed. Please try again.');
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleExportJSON = () => {
    if (!results) return;
    const json = reportGenerator.generateJSON(results);
    reportGenerator.downloadFile(json, `ground-truth-recall-audit-${Date.now()}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    if (!results) return;
    const csv = reportGenerator.generateCSV(results);
    reportGenerator.downloadFile(csv, `ground-truth-recall-audit-${Date.now()}.csv`, 'text/csv');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[#7fa89f]">Ground-Truth Recall Audit</h1>
          <p className="text-gray-400">
            Detection & Routing Performance Validation Against Curated Ground-Truth Events
          </p>
        </div>

        {/* Controls */}
        <Card className="border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <AuditTimeRangeSelector value={timeWindow} onChange={setTimeWindow} />
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRunAudit}
                  disabled={isRunning}
                  className="bg-[#7fa89f] hover:bg-[#6a9080]"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'Running Audit...' : 'Run Audit'}
                </Button>
                <AuditExportMenu
                  onExportJSON={handleExportJSON}
                  onExportCSV={handleExportCSV}
                  disabled={!results}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {isRunning && progress && <AuditProgressTracker progress={progress} />}

        {/* Results */}
        {results && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AuditMetricCard
                icon={Target}
                value={`${(results.recall_metrics.overall_recall_rate * 100).toFixed(1)}%`}
                label="Overall Recall Rate"
                status={
                  results.recall_metrics.overall_recall_rate >= 0.85
                    ? 'good'
                    : results.recall_metrics.overall_recall_rate >= 0.75
                    ? 'warning'
                    : 'critical'
                }
              />
              <AuditMetricCard
                icon={CheckCircle}
                value={results.recall_metrics.total_detected}
                label="Events Detected"
                status="good"
              />
              <AuditMetricCard
                icon={XCircle}
                value={results.recall_metrics.total_missed}
                label="Events Missed"
                status={results.recall_metrics.total_missed > 10 ? 'critical' : 'warning'}
              />
              <AuditMetricCard
                icon={Target}
                value={`${(results.recall_metrics.routing_accuracy * 100).toFixed(1)}%`}
                label="Routing Accuracy"
                status={results.recall_metrics.routing_accuracy >= 0.9 ? 'good' : 'warning'}
              />
            </div>

            {/* Sections */}
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid grid-cols-6 w-full bg-gray-900 border border-gray-800">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <TabsTrigger
                    key={num}
                    value={String(num)}
                    className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-white"
                  >
                    Section {num}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="1" className="mt-6">
                <AuditSectionCard
                  sectionNumber={1}
                  title="Ground-Truth Event Set"
                  status="pass"
                  defaultExpanded={true}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Total Events</p>
                        <p className="text-2xl font-bold">{results.recall_metrics.total_ground_truth_events}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Registry Version</p>
                        <p className="text-2xl font-bold">{results.ground_truth_registry_version}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Time Window</p>
                        <p className="text-2xl font-bold">{timeWindow.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="2" className="mt-6">
                <AuditSectionCard
                  sectionNumber={2}
                  title="Detection & Routing Recall"
                  status={results.recall_metrics.overall_recall_rate >= 0.85 ? 'pass' : 'fail'}
                  defaultExpanded={true}
                >
                  <div className="space-y-6">
                    <RecallRateChart data={results.recall_metrics.by_vector} />
                    <RoutingAccuracyMatrix confusionMatrix={results.routing_validation.confusion_matrix} />
                  </div>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="3" className="mt-6">
                <AuditSectionCard
                  sectionNumber={3}
                  title="Vector Recall Rate Summary"
                  status={results.recall_metrics.overall_recall_rate >= 0.85 ? 'pass' : 'fail'}
                  defaultExpanded={true}
                >
                  <RecallRateChart data={results.recall_metrics.by_vector} />
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="4" className="mt-6">
                <AuditSectionCard
                  sectionNumber={4}
                  title="False Negative Analysis"
                  status={results.false_negative_catalog.total_false_negatives < 10 ? 'pass' : 'warning'}
                  defaultExpanded={true}
                  anomalyCount={results.false_negative_catalog.total_false_negatives}
                >
                  <div className="space-y-6">
                    <FalseNegativeBreakdown data={results.false_negative_catalog.by_reason} />
                    <div className="space-y-3">
                      <h4 className="font-semibold">Priority Remediations</h4>
                      {results.false_negative_catalog.priority_remediations.map((rem, index) => (
                        <div key={index} className="flex gap-3 p-3 bg-gray-900 rounded-lg">
                          <Badge
                            variant="outline"
                            className={
                              rem.priority === 'HIGH'
                                ? 'border-red-500 text-red-500'
                                : rem.priority === 'MEDIUM'
                                ? 'border-yellow-500 text-yellow-500'
                                : 'border-gray-500 text-gray-500'
                            }
                          >
                            {rem.priority}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium">{rem.reason.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-400">{rem.recommended_action}</p>
                            <p className="text-xs text-gray-500 mt-1">{rem.affected_events} events affected</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="5" className="mt-6">
                <AuditSectionCard
                  sectionNumber={5}
                  title="Expectation Weighting Behavior"
                  status={
                    results.expectation_weighting_validation.drift_before_confirmation_rate >= 0.9
                      ? 'pass'
                      : 'warning'
                  }
                  defaultExpanded={true}
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Anticipated Events</p>
                      <p className="text-2xl font-bold">
                        {results.expectation_weighting_validation.total_anticipated_events}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">With Drift</p>
                      <p className="text-2xl font-bold">
                        {results.expectation_weighting_validation.events_with_drift}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Drift-Before-Confirmation Rate</p>
                      <p className="text-2xl font-bold">
                        {(results.expectation_weighting_validation.drift_before_confirmation_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="6" className="mt-6">
                <AuditSectionCard
                  sectionNumber={6}
                  title="Summary & Recommendations"
                  status="pass"
                  defaultExpanded={true}
                >
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Key Findings</h4>
                      <ul className="space-y-2">
                        {results.summary.key_findings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-400">
                            <span className="text-[#7fa89f] mt-1">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {results.summary.critical_issues.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          Critical Issues
                        </h4>
                        <ul className="space-y-2">
                          {results.summary.critical_issues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2 text-red-400">
                              <span className="mt-1">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AuditSectionCard>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}