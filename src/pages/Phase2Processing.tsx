"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  Database, 
  Globe, 
  Building, 
  BarChart3,
  Zap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Rocket,
  Activity,
  Users,
  Layers
} from 'lucide-react';

// Import processing engine
import { 
  nasdaqProcessingEngine, 
  ProcessingSession, 
  ProcessingPhase, 
  ProcessingResult 
} from '../services/NASDAQProcessingEngine';

export default function Phase2Processing() {
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [recentResults, setRecentResults] = useState<ProcessingResult[]>([]);
  const [phaseResults, setPhaseResults] = useState<Record<string, any>>({});

  useEffect(() => {
    // Set up event handlers
    nasdaqProcessingEngine.onProgress((updatedSession) => {
      setSession({ ...updatedSession });
    });

    nasdaqProcessingEngine.onPhaseComplete((phase) => {
      addLog(`🎯 Phase completed: ${phase.name} - ${phase.successCount}/${phase.companies.length} companies`);
      setPhaseResults(prev => ({
        ...prev,
        [phase.tier]: {
          ...phase,
          completedAt: new Date().toISOString()
        }
      }));
    });

    nasdaqProcessingEngine.onResult((result) => {
      setRecentResults(prev => [result, ...prev].slice(0, 100));
    });

    nasdaqProcessingEngine.onError((ticker, error) => {
      addLog(`❌ Error: ${ticker} - ${error}`);
    });

    nasdaqProcessingEngine.onLog((message) => {
      addLog(message);
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 300));
  };

  const initializePhase2 = async () => {
    try {
      addLog('🚀 Initializing Phase 2 NASDAQ Processing...');
      
      const newSession = await nasdaqProcessingEngine.initializePhase2Processing({
        parallelStreams: 3,
        processingMode: 'balanced',
        enableAdvancedNLP: true,
        enableSupplyChain: true,
        enableSustainability: true
      });
      
      setSession(newSession);
      setIsInitialized(true);
      
      addLog(`✅ Phase 2 initialized: ${newSession.totalCompanies} companies ready for processing`);
      
    } catch (error) {
      addLog(`❌ Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startProcessing = async () => {
    if (!session) return;
    
    try {
      setIsProcessing(true);
      addLog('🚀 Starting Phase 2 NASDAQ processing...');
      
      await nasdaqProcessingEngine.startPhase2Processing();
      
      addLog('🎉 Phase 2 processing completed successfully!');
      
    } catch (error) {
      addLog(`❌ Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const pauseProcessing = () => {
    nasdaqProcessingEngine.pauseProcessing();
    setIsPaused(true);
    addLog('⏸️ Processing paused');
  };

  const resumeProcessing = () => {
    nasdaqProcessingEngine.resumeProcessing();
    setIsPaused(false);
    addLog('▶️ Processing resumed');
  };

  const stopProcessing = () => {
    nasdaqProcessingEngine.stopProcessing();
    setIsProcessing(false);
    setIsPaused(false);
    addLog('⏹️ Processing stopped');
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'large': return 'bg-green-500';
      case 'mid': return 'bg-blue-500';
      case 'small': return 'bg-yellow-500';
      case 'micro': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Rocket className="h-10 w-10 text-indigo-400" />
            Phase 2: NASDAQ Processing
          </h1>
          <p className="text-xl text-slate-300">
            Processing 3,300+ NASDAQ Companies for Complete Market Coverage
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-indigo-400 border-indigo-400">
              <Database className="h-4 w-4 mr-1" />
              3,300+ Companies
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Target className="h-4 w-4 mr-1" />
              4-Tier Processing
            </Badge>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <Globe className="h-4 w-4 mr-1" />
              25,000+ Segments
            </Badge>
          </div>
        </div>

        {/* Processing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{session?.totalCompanies || 0}</div>
              <p className="text-xs text-slate-400">NASDAQ companies</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{session?.processedCompanies || 0}</div>
              <p className="text-xs text-slate-400">
                {session ? ((session.processedCompanies / session.totalCompanies) * 100).toFixed(1) : 0}% complete
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{session?.successfulCompanies || 0}</div>
              <p className="text-xs text-slate-400">
                {session && session.processedCompanies > 0 
                  ? ((session.successfulCompanies / session.processedCompanies) * 100).toFixed(1) 
                  : 0}% success rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {session ? (session.overallStats.averageConfidence * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-slate-400">average confidence</p>
            </CardContent>
          </Card>
        </div>

        {/* Initialization and Control */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Phase 2 Processing Control
            </CardTitle>
            <CardDescription className="text-slate-300">
              Initialize and execute comprehensive NASDAQ company processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            {session && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Overall Progress</span>
                  <span className="text-sm text-slate-300">
                    {((session.processedCompanies / session.totalCompanies) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(session.processedCompanies / session.totalCompanies) * 100} 
                  className="h-2" 
                />
                {session.overallStats.estimatedCompletion && (
                  <p className="text-xs text-slate-400">
                    Estimated completion: {session.overallStats.estimatedCompletion.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isInitialized ? (
                <Button onClick={initializePhase2} className="bg-indigo-600 hover:bg-indigo-700">
                  <Rocket className="h-4 w-4 mr-2" />
                  Initialize Phase 2
                </Button>
              ) : !isProcessing ? (
                <Button onClick={startProcessing} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Processing
                </Button>
              ) : (
                <>
                  {!isPaused ? (
                    <Button onClick={pauseProcessing} variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={resumeProcessing} className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={stopProcessing} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>

            {/* Status Alert */}
            <Alert className="bg-slate-700/50 border-slate-600">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-slate-300">
                <strong>Phase 2 Scope:</strong> Processing all 3,300 NASDAQ companies with tiered quality standards. 
                Large-cap companies (95% confidence) → Mid-cap (90%) → Small-cap (85%) → Micro-cap (80%).
                Expected duration: 4-6 weeks with parallel processing.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Processing Phases */}
        {session && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Processing Phases</CardTitle>
              <CardDescription className="text-slate-300">
                Progress across all market cap tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {session.phases.map((phase) => (
                  <div key={phase.tier} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className={getTierBadgeColor(phase.tier)}>
                          {phase.tier.toUpperCase()}-CAP
                        </Badge>
                        <span className="text-sm text-slate-300">{phase.name}</span>
                        {getStatusIcon(phase.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{phase.processedCount}/{phase.companies.length}</span>
                        <span>{((phase.processedCount / Math.max(phase.companies.length, 1)) * 100).toFixed(1)}%</span>
                        {phase.averageConfidence > 0 && (
                          <span>{(phase.averageConfidence * 100).toFixed(1)}% confidence</span>
                        )}
                        {phase.startTime && (
                          <span>{formatDuration(phase.startTime, phase.endTime)}</span>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={(phase.processedCount / Math.max(phase.companies.length, 1)) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monitoring Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
              Processing Logs ({processingLogs.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">
              Recent Results ({recentResults.length})
            </TabsTrigger>
            <TabsTrigger value="phases" className="data-[state=active]:bg-slate-700">
              Phase Details
            </TabsTrigger>
            <TabsTrigger value="statistics" className="data-[state=active]:bg-slate-700">
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Live Processing Logs</CardTitle>
                <CardDescription className="text-slate-300">
                  Real-time processing events and system messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-1 font-mono text-sm">
                    {processingLogs.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No logs yet. Initialize Phase 2 to start processing.
                      </div>
                    ) : (
                      processingLogs.map((log, index) => (
                        <div key={index} className="text-slate-300 text-xs">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Processing Results</CardTitle>
                <CardDescription className="text-slate-300">
                  Latest companies processed with quality metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-3">
                    {recentResults.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        No results yet. Start processing to see results here.
                      </div>
                    ) : (
                      recentResults.map((result) => (
                        <div key={result.processingId} className="border border-slate-600 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {result.ticker}
                              </Badge>
                              <Badge className={getTierBadgeColor(result.tier)}>
                                {result.tier.toUpperCase()}
                              </Badge>
                              <Badge className={`${result.dataQuality.startsWith('A') ? 'bg-green-500' : result.dataQuality.startsWith('B') ? 'bg-blue-500' : 'bg-yellow-500'}`}>
                                {result.dataQuality}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-white">
                                {(result.overallConfidence * 100).toFixed(1)}% confidence
                              </div>
                              <div className="text-xs text-slate-400">
                                {result.processingTime}ms
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-slate-300 font-medium">
                            {result.companyName}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{result.geographicSegments.length} segments</span>
                            <span>{result.sourcesUsed.length} sources</span>
                            <span>{result.evidenceBased ? 'Evidence-based' : 'Fallback'}</span>
                            <span>{result.validationResults.filter(v => v.passed).length}/{result.validationResults.length} validations</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(phaseResults).map(([tier, phase]) => (
                <Card key={tier} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Badge className={getTierBadgeColor(tier)}>
                        {tier.toUpperCase()}-CAP
                      </Badge>
                      Phase Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Companies</div>
                        <div className="text-white font-medium">{phase.companies?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Success Rate</div>
                        <div className="text-white font-medium">
                          {phase.companies?.length > 0 
                            ? ((phase.successCount / phase.companies.length) * 100).toFixed(1) 
                            : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Avg Confidence</div>
                        <div className="text-white font-medium">
                          {(phase.averageConfidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Processing Rate</div>
                        <div className="text-white font-medium">
                          {phase.processingRate?.toFixed(1) || 0} /min
                        </div>
                      </div>
                    </div>
                    
                    {phase.startTime && (
                      <div className="text-xs text-slate-400">
                        Duration: {formatDuration(new Date(phase.startTime), phase.endTime ? new Date(phase.endTime) : undefined)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Processing Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {session && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {session.overallStats.processingRate.toFixed(1)}
                        </div>
                        <div className="text-sm text-slate-300">Companies/min</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {(session.overallStats.averageConfidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-300">Avg Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {session.successfulCompanies}
                        </div>
                        <div className="text-sm text-slate-300">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {session.processedCompanies - session.successfulCompanies}
                        </div>
                        <div className="text-sm text-slate-300">Errors</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Expected Outcomes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">25,000+</div>
                      <div className="text-sm text-slate-300">Geographic Segments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">90%+</div>
                      <div className="text-sm text-slate-300">Evidence-Based</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">3,800+</div>
                      <div className="text-sm text-slate-300">Total Companies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">95%+</div>
                      <div className="text-sm text-slate-300">Market Coverage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}