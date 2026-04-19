import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, AlertCircle } from 'lucide-react';
import { VectorMovementForensicAuditService } from '@/services/audits/VectorMovementForensicAuditService';
import { AuditReportGenerator } from '@/services/audits/AuditReportGenerator';
import { AuditProgressTracker } from '@/components/audit/shared/AuditProgressTracker';
import { AuditTimeRangeSelector } from '@/components/audit/shared/AuditTimeRangeSelector';
import { AuditExportMenu } from '@/components/audit/shared/AuditExportMenu';
import { AuditSectionCard } from '@/components/audit/shared/AuditSectionCard';
import { MovementLedgerTable } from '@/components/audit/vector-movement/MovementLedgerTable';
import { VectorActivityChart } from '@/components/audit/vector-movement/VectorActivityChart';
import { SuppressionDynamicsChart } from '@/components/audit/vector-movement/SuppressionDynamicsChart';
import { BaselineFactorMatrix } from '@/components/audit/vector-movement/BaselineFactorMatrix';
import { ExpectationWeightingScatter } from '@/components/audit/vector-movement/ExpectationWeightingScatter';
import { VectorMovementAuditResult, TimeWindow, AuditProgress } from '@/types/audit.types';

export default function VectorMovementForensicAuditDashboard() {
  const [auditService] = useState(() => new VectorMovementForensicAuditService());
  const [reportGenerator] = useState(() => new AuditReportGenerator());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ type: 'last_90_days' });
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [results, setResults] = useState<VectorMovementAuditResult | null>(null);
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
    reportGenerator.downloadFile(json, `vector-movement-audit-${Date.now()}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    if (!results) return;
    const csv = reportGenerator.generateCSV(results);
    reportGenerator.downloadFile(csv, `vector-movement-audit-${Date.now()}.csv`, 'text/csv');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[#7fa89f]">Vector Movement Forensic Audit</h1>
          <p className="text-gray-400">
            Internal CSI Structural Integrity Validation - 9-Section Diagnostic Analysis
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
            {/* Summary */}
            <Card className="border-gray-800">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Overall Assessment</p>
                    <Badge
                      variant="outline"
                      className={
                        results.summary.overall_assessment === 'structural_integrity_confirmed'
                          ? 'border-green-500 text-green-500'
                          : results.summary.overall_assessment === 'partial_functionality'
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-red-500 text-red-500'
                      }
                    >
                      {results.summary.overall_assessment.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Sections Passed</p>
                    <p className="text-2xl font-bold">
                      {results.summary.sections_meeting_criteria} / {results.summary.total_sections}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-500">
                      {results.summary.critical_issues.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid grid-cols-9 w-full bg-gray-900 border border-gray-800">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <TabsTrigger
                    key={num}
                    value={String(num)}
                    className="data-[state=active]:bg-[#7fa89f] data-[state=active]:text-white"
                  >
                    {num}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="1" className="mt-6">
                <AuditSectionCard
                  sectionNumber={1}
                  title="Absolute Movement Ledger"
                  status={results.sections.section_1.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_1.anomalies.length}
                >
                  <MovementLedgerTable data={results.sections.section_1.data} />
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="2" className="mt-6">
                <AuditSectionCard
                  sectionNumber={2}
                  title="Movement Denominator Reconciliation"
                  status={results.sections.section_2.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_2.anomalies.length}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Total Drift</p>
                        <p className="text-xl font-bold">{results.sections.section_2.aggregates.total_drift_all.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Event</p>
                        <p className="text-xl font-bold">{results.sections.section_2.aggregates.total_event_all.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Movement</p>
                        <p className="text-xl font-bold">{results.sections.section_2.aggregates.total_movement_all.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Average Movement</p>
                        <p className="text-xl font-bold">{results.sections.section_2.aggregates.avg_movement.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="3" className="mt-6">
                <AuditSectionCard
                  sectionNumber={3}
                  title="Real-World Routing & Confirmation"
                  status={results.sections.section_3.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_3.anomalies.length}
                >
                  <p className="text-gray-400">Sample size: {results.sections.section_3.samples.length} signals</p>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="4" className="mt-6">
                <AuditSectionCard
                  sectionNumber={4}
                  title="Rolling Vector Activity"
                  status={results.sections.section_4.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_4.anomalies.length}
                >
                  <VectorActivityChart data={results.sections.section_4.time_series} />
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="5" className="mt-6">
                <AuditSectionCard
                  sectionNumber={5}
                  title="Suppression & Scoring Dynamics"
                  status={results.sections.section_5.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_5.anomalies.length}
                >
                  <SuppressionDynamicsChart data={results.sections.section_5.data} />
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="6" className="mt-6">
                <AuditSectionCard
                  sectionNumber={6}
                  title="Baseline Factor Matrix"
                  status={results.sections.section_6.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_6.anomalies.length}
                >
                  <BaselineFactorMatrix data={results.sections.section_6.sample_countries} />
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="7" className="mt-6">
                <AuditSectionCard
                  sectionNumber={7}
                  title="Source-to-Vector Concentration"
                  status={results.sections.section_7.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_7.anomalies.length}
                >
                  <p className="text-gray-400">HHI concentration analysis</p>
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="8" className="mt-6">
                <AuditSectionCard
                  sectionNumber={8}
                  title="Expectation Weighting Integrity"
                  status={results.sections.section_8.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_8.anomalies.length}
                >
                  <ExpectationWeightingScatter data={results.sections.section_8.samples} />
                </AuditSectionCard>
              </TabsContent>

              <TabsContent value="9" className="mt-6">
                <AuditSectionCard
                  sectionNumber={9}
                  title="Near-Term Horizon & Decay Behavior"
                  status={results.sections.section_9.success_criteria_met ? 'pass' : 'fail'}
                  defaultExpanded={true}
                  anomalyCount={results.sections.section_9.anomalies.length}
                >
                  <p className="text-gray-400">
                    Analyzing {results.sections.section_9.high_impact_events.length} high-impact events
                  </p>
                </AuditSectionCard>
              </TabsContent>
            </Tabs>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <Card className="border-gray-800">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Recommendations
                  </h3>
                  <div className="space-y-3">
                    {results.recommendations.map((rec, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-gray-900 rounded-lg">
                        <Badge
                          variant="outline"
                          className={
                            rec.priority === 'HIGH'
                              ? 'border-red-500 text-red-500'
                              : rec.priority === 'MEDIUM'
                              ? 'border-yellow-500 text-yellow-500'
                              : 'border-gray-500 text-gray-500'
                          }
                        >
                          {rec.priority}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{rec.category}</p>
                          <p className="text-sm text-gray-400">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}