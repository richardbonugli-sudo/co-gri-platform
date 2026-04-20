"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle, 
  AlertCircle,
  Info,
  Rocket,
  Database,
  Globe,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

// Import execution system
import { 
  dataExpansionExecutor, 
  ExpansionExecutionResult, 
  ExecutionProgress 
} from '../services/DataExpansionExecutor';

export default function DataExpansionExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<ExecutionProgress | null>(null);
  const [executionResult, setExecutionResult] = useState<ExpansionExecutionResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set up event handlers
    dataExpansionExecutor.onProgress((progress) => {
      setExecutionProgress(progress);
    });

    dataExpansionExecutor.onLog((logEntry) => {
      setExecutionLogs(prev => [logEntry, ...prev].slice(0, 200));
    });

    dataExpansionExecutor.onCompletion((result) => {
      setExecutionResult(result);
      setIsExecuting(false);
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  const executeDataExpansion = async () => {
    setIsExecuting(true);
    setStartTime(new Date());
    setExecutionResult(null);
    setExecutionLogs([]);
    
    try {
      console.log('🚀 Starting complete data expansion execution...');
      await dataExpansionExecutor.executeCompleteExpansion();
    } catch (error) {
      console.error('❌ Data expansion execution failed:', error);
      setIsExecuting(false);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'initialization': return <Database className="h-5 w-5 text-blue-500" />;
      case 'processing': return <Zap className="h-5 w-5 text-purple-500 animate-pulse" />;
      case 'integration': return <Globe className="h-5 w-5 text-green-500" />;
      case 'validation': return <Target className="h-5 w-5 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'initialization': return 'System initialization and validation';
      case 'processing': return 'Processing 3,300 NASDAQ companies';
      case 'integration': return 'Database integration and consolidation';
      case 'validation': return 'Quality validation and verification';
      case 'completed': return 'Expansion completed successfully';
      default: return 'Preparing for execution';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Rocket className="h-10 w-10 text-blue-400" />
            Data Expansion System Execution
          </h1>
          <p className="text-xl text-slate-300">
            Expanding from 500+ to 3,800+ Evidence-Based Companies
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Database className="h-4 w-4 mr-1" />
              3,300 NASDAQ Companies
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Target className="h-4 w-4 mr-1" />
              90%+ Evidence-Based
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <Globe className="h-4 w-4 mr-1" />
              95% Market Coverage
            </Badge>
          </div>
        </div>

        {/* Execution Status */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Execution Status
            </CardTitle>
            <CardDescription className="text-slate-300">
              Complete data expansion system execution progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Phase */}
            {executionProgress && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {getPhaseIcon(executionProgress.phase)}
                  <div>
                    <h3 className="font-semibold text-white capitalize">{executionProgress.phase} Phase</h3>
                    <p className="text-sm text-slate-400">{getPhaseDescription(executionProgress.phase)}</p>
                  </div>
                </div>
                
                {executionProgress.phase === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">
                        Processing Progress: {executionProgress.processedCompanies}/{executionProgress.totalCompanies}
                      </span>
                      <span className="text-sm text-slate-300">
                        {((executionProgress.processedCompanies / executionProgress.totalCompanies) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(executionProgress.processedCompanies / executionProgress.totalCompanies) * 100} 
                      className="h-2" 
                    />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Current Tier</div>
                        <div className="text-white font-medium capitalize">{executionProgress.currentTier || 'Initializing'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Success Rate</div>
                        <div className="text-white font-medium">{executionProgress.successRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Avg Confidence</div>
                        <div className="text-white font-medium">{executionProgress.averageConfidence.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Duration</div>
                        <div className="text-white font-medium">
                          {startTime ? formatDuration(startTime) : '0s'}
                        </div>
                      </div>
                    </div>
                    
                    {executionProgress.estimatedCompletion && (
                      <p className="text-xs text-slate-400">
                        Estimated completion: {executionProgress.estimatedCompletion.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Execution Button */}
            {!isExecuting && !executionResult && (
              <Button 
                onClick={executeDataExpansion} 
                className="bg-blue-600 hover:bg-blue-700 w-full"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Execute Complete Data Expansion System
              </Button>
            )}

            {/* Execution Alert */}
            <Alert className="bg-slate-700/50 border-slate-600">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-slate-300">
                <strong>System Execution:</strong> This will process all 3,300 NASDAQ companies using the enhanced 
                multi-source intelligence system with SEC EDGAR integration, sustainability reports, and advanced NLP. 
                Expected duration: 4-6 hours with parallel processing.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {executionResult && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {executionResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Execution Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {executionResult.success ? (
                <div className="space-y-4">
                  {/* Success Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {executionResult.totalCompaniesProcessed.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-300">Total Companies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {executionResult.evidenceBasedCompanies.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-300">Evidence-Based</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {(executionResult.qualityMetrics.overallConfidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-300">Avg Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {executionResult.qualityMetrics.evidenceBasedRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-300">Evidence Rate</div>
                    </div>
                  </div>

                  {/* Completion Summary */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                      {executionResult.completionSummary}
                    </pre>
                  </div>

                  {/* Achievement Badge */}
                  <Alert className="bg-green-900/20 border-green-500/50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-200">
                      <strong>🎉 SUCCESS!</strong> Database successfully expanded from 500+ to {executionResult.totalCompaniesProcessed}+ companies. 
                      The world's most comprehensive corporate geographic intelligence database is now operational with 
                      real-time monitoring and institutional-grade quality standards.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-red-900/20 border-red-500/50">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-200">
                      <strong>Execution Failed:</strong> {executionResult.completionSummary}
                    </AlertDescription>
                  </Alert>
                  
                  {executionResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Errors:</h4>
                      <ul className="space-y-1">
                        {executionResult.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-300">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Execution Logs */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Execution Logs</CardTitle>
            <CardDescription className="text-slate-300">
              Real-time system execution messages and progress updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full">
              <div className="space-y-1 font-mono text-sm">
                {executionLogs.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    No logs yet. Execute the data expansion system to see progress here.
                  </div>
                ) : (
                  executionLogs.map((log, index) => (
                    <div key={index} className="text-slate-300 text-xs">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2">Processing Specifications</h4>
                <ul className="space-y-1 text-slate-300">
                  <li>• Multi-source intelligence processing</li>
                  <li>• SEC EDGAR API integration</li>
                  <li>• Advanced NLP with context awareness</li>
                  <li>• Supply chain intelligence mapping</li>
                  <li>• Tiered quality validation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Quality Standards</h4>
                <ul className="space-y-1 text-slate-300">
                  <li>• Large-cap: 95%+ confidence target</li>
                  <li>• Mid-cap: 90%+ confidence target</li>
                  <li>• Small-cap: 85%+ confidence target</li>
                  <li>• Micro-cap: 80%+ confidence target</li>
                  <li>• Overall: 90%+ evidence-based rate</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}