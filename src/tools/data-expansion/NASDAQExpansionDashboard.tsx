"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Info
} from 'lucide-react';

// Import processors
import { NASDAQProcessor } from '../../services/NASDAQProcessor';
import { getNASDAQDatabaseStats, getProcessingQueue } from '../../data/nasdaqCompanyDatabase';

interface ExpansionProgress {
  currentPhase: 'planning' | 'processing' | 'validation' | 'completed';
  totalCompanies: number;
  processedCompanies: number;
  currentTier: string;
  currentTicker: string;
  estimatedCompletion: Date | null;
  processingRate: number;
}

interface TierProgress {
  tier: string;
  totalCompanies: number;
  processedCompanies: number;
  successRate: number;
  averageConfidence: number;
  status: 'pending' | 'processing' | 'completed';
}

interface ProcessingStats {
  totalTargetCompanies: number;
  currentDatabaseSize: number;
  expansionRatio: number;
  estimatedDuration: string;
  qualityTargets: Record<string, number>;
  expectedOutcomes: {
    evidenceBasedRate: number;
    averageConfidence: number;
    geographicSegments: number;
    marketCoverage: number;
  };
}

export default function NASDAQExpansionDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [expansionProgress, setExpansionProgress] = useState<ExpansionProgress>({
    currentPhase: 'planning',
    totalCompanies: 3800,
    processedCompanies: 60,
    currentTier: '',
    currentTicker: '',
    estimatedCompletion: null,
    processingRate: 0
  });

  const [tierProgress, setTierProgress] = useState<TierProgress[]>([
    { tier: 'large', totalCompanies: 150, processedCompanies: 0, successRate: 0, averageConfidence: 0, status: 'pending' },
    { tier: 'mid', totalCompanies: 400, processedCompanies: 0, successRate: 0, averageConfidence: 0, status: 'pending' },
    { tier: 'small', totalCompanies: 1200, processedCompanies: 0, successRate: 0, averageConfidence: 0, status: 'pending' },
    { tier: 'micro', totalCompanies: 1550, processedCompanies: 0, successRate: 0, averageConfidence: 0, status: 'pending' }
  ]);

  const [processingStats] = useState<ProcessingStats>({
    totalTargetCompanies: 3800,
    currentDatabaseSize: 60,
    expansionRatio: 63.3, // 3800/60
    estimatedDuration: '8-12 weeks',
    qualityTargets: {
      'large': 95,
      'mid': 90,
      'small': 85,
      'micro': 80
    },
    expectedOutcomes: {
      evidenceBasedRate: 90,
      averageConfidence: 88,
      geographicSegments: 23000,
      marketCoverage: 98
    }
  });

  const [processor] = useState(() => new NASDAQProcessor());
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with database stats
    const stats = getNASDAQDatabaseStats();
    addLog(`NASDAQ Expansion Dashboard initialized`);
    addLog(`Current evidence database: ${processingStats.currentDatabaseSize} companies`);
    addLog(`Target expansion: ${processingStats.totalTargetCompanies} companies (${processingStats.expansionRatio}x increase)`);
    addLog(`Sample NASDAQ database loaded: ${stats.totalCompanies} companies`);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  const startNASDAQExpansion = async () => {
    setIsProcessing(true);
    setExpansionProgress(prev => ({ ...prev, currentPhase: 'processing' }));
    
    addLog('🚀 Starting NASDAQ expansion processing...');
    addLog('📊 Processing 3,300+ NASDAQ companies in tiered approach');
    
    try {
      await processor.processAllNASDAQCompanies(
        // Progress callback
        (processed, total, currentTicker) => {
          setExpansionProgress(prev => ({
            ...prev,
            processedCompanies: prev.processedCompanies + processed,
            currentTicker,
            processingRate: calculateProcessingRate(processed, total)
          }));
          
          addLog(`Processing: ${currentTicker} (${processed}/${total})`);
        },
        
        // Result callback
        (result) => {
          addLog(`✅ Completed: ${result.ticker} - ${result.geographicSegments.length} segments, ${(result.overallConfidence * 100).toFixed(1)}% confidence`);
          
          // Update tier progress
          setTierProgress(prev => prev.map(tier => {
            if (tier.tier === result.tier) {
              return {
                ...tier,
                processedCompanies: tier.processedCompanies + 1,
                status: tier.processedCompanies + 1 >= tier.totalCompanies ? 'completed' : 'processing'
              };
            }
            return tier;
          }));
        },
        
        // Error callback
        (ticker, error) => {
          addLog(`❌ Error processing ${ticker}: ${error}`);
        }
      );
      
      setExpansionProgress(prev => ({ ...prev, currentPhase: 'completed' }));
      addLog('🎉 NASDAQ expansion completed successfully!');
      
    } catch (error) {
      addLog(`❌ NASDAQ expansion failed: ${error}`);
      setExpansionProgress(prev => ({ ...prev, currentPhase: 'planning' }));
    } finally {
      setIsProcessing(false);
    }
  };

  const pauseProcessing = () => {
    setIsProcessing(false);
    addLog('⏸️ Processing paused by user');
  };

  const calculateProcessingRate = (processed: number, total: number): number => {
    // Simplified rate calculation
    return processed > 0 ? (processed / total) * 100 : 0;
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

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'planning': return <Target className="h-5 w-5" />;
      case 'processing': return <Zap className="h-5 w-5 animate-pulse" />;
      case 'validation': return <CheckCircle className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Database className="h-10 w-10 text-purple-400" />
            NASDAQ Expansion System
          </h1>
          <p className="text-xl text-slate-300">
            Expanding from 500 S&P 500 to 3,800+ Companies with Institutional-Grade Intelligence
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              {getPhaseIcon(expansionProgress.currentPhase)}
              <span className="ml-2 capitalize">{expansionProgress.currentPhase} Phase</span>
            </Badge>
            <Badge variant="outline" className="text-slate-300">
              <Globe className="h-4 w-4 mr-1" />
              63.3x Database Expansion
            </Badge>
          </div>
        </div>

        {/* Expansion Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Current Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{processingStats.currentDatabaseSize}</div>
              <p className="text-xs text-slate-400">Evidence-confirmed companies</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Target Expansion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{processingStats.totalTargetCompanies.toLocaleString()}</div>
              <p className="text-xs text-slate-400">{processingStats.expansionRatio}x increase</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Expected Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{processingStats.expectedOutcomes.evidenceBasedRate}%</div>
              <p className="text-xs text-slate-400">Evidence-based rate</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{processingStats.estimatedDuration}</div>
              <p className="text-xs text-slate-400">Estimated duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Processing Control */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              NASDAQ Processing Control
            </CardTitle>
            <CardDescription className="text-slate-300">
              Execute the comprehensive expansion from 500 to 3,800+ companies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">
                    {expansionProgress.currentTicker ? `Processing: ${expansionProgress.currentTicker}` : 'Initializing...'}
                  </span>
                  <span className="text-sm text-slate-300">
                    {((expansionProgress.processedCompanies / expansionProgress.totalCompanies) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(expansionProgress.processedCompanies / expansionProgress.totalCompanies) * 100} 
                  className="h-2" 
                />
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isProcessing ? (
                <Button onClick={startNASDAQExpansion} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start NASDAQ Expansion
                </Button>
              ) : (
                <>
                  <Button onClick={pauseProcessing} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Processing
                  </Button>
                  <Button onClick={() => setIsProcessing(false)} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop Processing
                  </Button>
                </>
              )}
            </div>

            {/* Processing Alert */}
            <Alert className="bg-slate-700/50 border-slate-600">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-slate-300">
                <strong>Processing Strategy:</strong> Tiered approach processing large-cap first (95% quality target), 
                then mid-cap (90%), small-cap (85%), and micro-cap (80%) companies with adaptive quality standards.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Processing Progress by Tier</CardTitle>
            <CardDescription className="text-slate-300">
              Real-time progress across all market capitalization tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tierProgress.map((tier) => (
                <div key={tier.tier} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className={getTierBadgeColor(tier.tier)}>
                        {tier.tier.toUpperCase()}-CAP
                      </Badge>
                      <span className="text-sm text-slate-300">
                        {tier.processedCompanies}/{tier.totalCompanies} companies
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        Target: {processingStats.qualityTargets[tier.tier]}%
                      </span>
                      {tier.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {tier.status === 'processing' && <Zap className="h-4 w-4 text-blue-500 animate-pulse" />}
                    </div>
                  </div>
                  <Progress 
                    value={(tier.processedCompanies / tier.totalCompanies) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Details */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Expansion Overview
            </TabsTrigger>
            <TabsTrigger value="technical" className="data-[state=active]:bg-slate-700">
              Technical Architecture
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
              Processing Logs ({processingLogs.length})
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="data-[state=active]:bg-slate-700">
              Expected Outcomes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">NASDAQ Expansion Overview</CardTitle>
                <CardDescription className="text-slate-300">
                  Comprehensive plan to expand from 500 S&P 500 to 3,800+ companies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Market Coverage */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Market Coverage Expansion</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">500</div>
                        <div className="text-sm text-slate-300">S&P 500 Companies</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">3,300</div>
                        <div className="text-sm text-slate-300">NASDAQ Companies</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700/50 border-slate-600">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">3,800+</div>
                        <div className="text-sm text-slate-300">Total Coverage</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                {/* Quality Standards */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Tiered Quality Standards</h3>
                  <div className="space-y-3">
                    {Object.entries(processingStats.qualityTargets).map(([tier, target]) => (
                      <div key={tier} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge className={getTierBadgeColor(tier)}>
                            {tier.toUpperCase()}-CAP
                          </Badge>
                          <span className="text-slate-300">
                            {tier === 'large' ? '>$10B' : 
                             tier === 'mid' ? '$2B-$10B' : 
                             tier === 'small' ? '$200M-$2B' : '<$200M'}
                          </span>
                        </div>
                        <div className="text-white font-medium">{target}% Quality Target</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Technical Architecture</CardTitle>
                <CardDescription className="text-slate-300">
                  Scalable processing infrastructure for 3,800+ companies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Processing Pipeline</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li>✅ SEC EDGAR API Integration</li>
                      <li>✅ Multi-source Intelligence</li>
                      <li>✅ Advanced NLP Engine</li>
                      <li>✅ Supply Chain Intelligence</li>
                      <li>✅ Tiered Quality Validation</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Infrastructure Scaling</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li>📊 6x Database Capacity</li>
                      <li>⚡ 5x Parallel Processing</li>
                      <li>🔄 Adaptive Rate Limiting</li>
                      <li>💾 Optimized Storage</li>
                      <li>📈 Real-time Monitoring</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Processing Logs</CardTitle>
                <CardDescription className="text-slate-300">
                  Real-time processing activity and system messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                  {processingLogs.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      No logs yet. Start processing to see activity here.
                    </div>
                  ) : (
                    processingLogs.map((log, index) => (
                      <div key={index} className="text-slate-300 mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outcomes">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Expected Outcomes</CardTitle>
                <CardDescription className="text-slate-300">
                  Projected results and competitive advantages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Key Success Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {processingStats.expectedOutcomes.evidenceBasedRate}%
                      </div>
                      <div className="text-sm text-slate-300">Evidence-Based Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {processingStats.expectedOutcomes.averageConfidence}%
                      </div>
                      <div className="text-sm text-slate-300">Average Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {processingStats.expectedOutcomes.geographicSegments.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-300">Geographic Segments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {processingStats.expectedOutcomes.marketCoverage}%
                      </div>
                      <div className="text-sm text-slate-300">Market Coverage</div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                {/* Competitive Advantage */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Competitive Advantage</h3>
                  <Alert className="bg-slate-700/50 border-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-slate-300">
                      <strong>World's Most Comprehensive:</strong> 3,800+ companies with institutional-grade 
                      geographic intelligence, covering 98% of US public market capitalization with evidence-based 
                      categorization. This creates an insurmountable competitive moat in corporate geographic intelligence.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}