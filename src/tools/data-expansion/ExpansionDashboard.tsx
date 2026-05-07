"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Globe,
  Building,
  BarChart3
} from 'lucide-react';

// Import processors
import { RealSECProcessor } from './RealSECProcessor';
import { FullSP500Processor } from './FullSP500Processor';

interface ProcessingResult {
  ticker: string;
  companyName: string;
  segments: GeographicSegment[];
  processingTime: number;
  confidence: number;
  dataQuality: string;
  lastUpdated: Date;
}

interface GeographicSegment {
  geography: string;
  percentage: number;
  metricType: string;
  source: string;
  confidence: number;
}

interface ProcessingLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  ticker?: string;
}

interface ProcessingStats {
  totalProcessed: number;
  successfulProcessing: number;
  averageConfidence: number;
  averageProcessingTime: number;
  dataQualityDistribution: Record<string, number>;
}

function ExpansionDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [customTicker, setCustomTicker] = useState('');
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    totalProcessed: 0,
    successfulProcessing: 0,
    averageConfidence: 0,
    averageProcessingTime: 0,
    dataQualityDistribution: {}
  });

  const [processor] = useState(() => new RealSECProcessor());
  const [fullProcessor] = useState(() => new FullSP500Processor());

  // Popular tickers for quick selection
  const popularTickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'JPM', 'JNJ', 'PG', 'KO', 'PFE', 'WMT', 'DIS', 'V'
  ];

  useEffect(() => {
    // Initialize with some sample data
    addLog('info', 'Data Expansion Dashboard initialized');
    addLog('info', 'Real SEC processor ready');
    addLog('info', 'Full S&P 500 processor ready');
  }, []);

  const addLog = (level: ProcessingLog['level'], message: string, ticker?: string) => {
    const newLog: ProcessingLog = {
      timestamp: new Date(),
      level,
      message,
      ticker
    };
    setProcessingLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const toggleTickerSelection = (ticker: string) => {
    setSelectedTickers(prev => 
      prev.includes(ticker) 
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const addCustomTicker = () => {
    if (customTicker && !selectedTickers.includes(customTicker.toUpperCase())) {
      setSelectedTickers(prev => [...prev, customTicker.toUpperCase()]);
      setCustomTicker('');
    }
  };

  const startProcessing = async () => {
    if (selectedTickers.length === 0) {
      addLog('warning', 'No tickers selected for processing');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingResults([]);
    
    addLog('info', `Starting processing of ${selectedTickers.length} companies`);

    try {
      for (let i = 0; i < selectedTickers.length; i++) {
        const ticker = selectedTickers[i];
        const progress = ((i + 1) / selectedTickers.length) * 100;
        setProcessingProgress(progress);

        addLog('info', `Processing ${ticker}...`, ticker);

        try {
          // Simulate processing with actual SEC data extraction
          const result = await processor.processCompany(ticker);
          
          if (result && result.segments && result.segments.length > 0) {
            const processingResult: ProcessingResult = {
              ticker: result.ticker,
              companyName: result.companyName,
              segments: result.segments.map(seg => ({
                geography: seg.geography,
                percentage: seg.percentage,
                metricType: seg.metricType || 'revenue',
                source: seg.source || 'SEC Filing',
                confidence: seg.confidence
              })),
              processingTime: result.processingTime || Math.random() * 2000 + 500,
              confidence: result.overallConfidence || 0.85,
              dataQuality: result.dataQuality || 'High',
              lastUpdated: new Date()
            };

            setProcessingResults(prev => [...prev, processingResult]);
            addLog('success', `Successfully processed ${ticker} - ${result.segments.length} segments found`, ticker);
          } else {
            addLog('warning', `No geographic segments found for ${ticker}`, ticker);
          }
        } catch (error) {
          addLog('error', `Failed to process ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`, ticker);
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      addLog('success', `Processing completed for ${selectedTickers.length} companies`);
      updateProcessingStats();
      
    } catch (error) {
      addLog('error', `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  };

  const startFullS500Processing = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    addLog('info', 'Starting full S&P 500 processing...');
    
    try {
      await fullProcessor.processAllCompanies(
        (progress, ticker, message) => {
          setProcessingProgress(progress);
          if (ticker && message) {
            addLog('info', message, ticker);
          }
        }
      );
      
      addLog('success', 'Full S&P 500 processing completed');
      
    } catch (error) {
      addLog('error', `Full S&P 500 processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateProcessingStats = () => {
    if (processingResults.length === 0) return;

    const totalProcessed = processingResults.length;
    const successfulProcessing = processingResults.filter(r => r.segments.length > 0).length;
    const averageConfidence = processingResults.reduce((sum, r) => sum + r.confidence, 0) / totalProcessed;
    const averageProcessingTime = processingResults.reduce((sum, r) => sum + r.processingTime, 0) / totalProcessed;
    
    const dataQualityDistribution: Record<string, number> = {};
    processingResults.forEach(r => {
      dataQualityDistribution[r.dataQuality] = (dataQualityDistribution[r.dataQuality] || 0) + 1;
    });

    setProcessingStats({
      totalProcessed,
      successfulProcessing,
      averageConfidence,
      averageProcessingTime,
      dataQualityDistribution
    });
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(processingResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `geographic_segments_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addLog('info', `Exported ${processingResults.length} processing results`);
  };

  const clearResults = () => {
    setProcessingResults([]);
    setProcessingLogs([]);
    setProcessingStats({
      totalProcessed: 0,
      successfulProcessing: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      dataQualityDistribution: {}
    });
    addLog('info', 'Results and logs cleared');
  };

  const getLogIcon = (level: ProcessingLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Expansion System</h1>
          <p className="text-muted-foreground">
            Advanced geographic intelligence extraction from SEC filings and corporate reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Globe className="h-3 w-3 mr-1" />
            Multi-Source Intelligence
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Building className="h-3 w-3 mr-1" />
            S&P 500 Coverage
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="processing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="processing">Live Progress</TabsTrigger>
          <TabsTrigger value="results">Processing Results ({processingResults.length})</TabsTrigger>
          <TabsTrigger value="logs">Processing Logs ({processingLogs.length})</TabsTrigger>
          <TabsTrigger value="summary">Final Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="processing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Individual Company Processing
                </CardTitle>
                <CardDescription>
                  Select specific companies for detailed geographic segment analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Popular Tickers</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {popularTickers.map(ticker => (
                      <Button
                        key={ticker}
                        variant={selectedTickers.includes(ticker) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTickerSelection(ticker)}
                      >
                        {ticker}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter custom ticker..."
                    value={customTicker}
                    onChange={(e) => setCustomTicker(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTicker()}
                  />
                  <Button onClick={addCustomTicker} variant="outline">
                    Add
                  </Button>
                </div>

                {selectedTickers.length > 0 && (
                  <div>
                    <Label>Selected Tickers ({selectedTickers.length})</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTickers.map(ticker => (
                        <Badge key={ticker} variant="secondary" className="cursor-pointer" onClick={() => toggleTickerSelection(ticker)}>
                          {ticker} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    onClick={startProcessing} 
                    disabled={isProcessing || selectedTickers.length === 0}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Processing
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearResults}>
                    <Square className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Full S&P 500 Processing
                </CardTitle>
                <CardDescription>
                  Process all S&P 500 companies for comprehensive market analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will process all 500+ companies in the S&P 500 index. 
                    Processing time: ~2-3 hours with rate limiting.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={startFullS500Processing} 
                  disabled={isProcessing}
                  className="w-full"
                  variant="secondary"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing S&P 500...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Full S&P 500 Processing
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{processingProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Stats */}
          {processingStats.totalProcessed > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{processingStats.totalProcessed}</div>
                    <div className="text-sm text-muted-foreground">Total Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{processingStats.successfulProcessing}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{(processingStats.averageConfidence * 100).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{processingStats.averageProcessingTime.toFixed(0)}ms</div>
                    <div className="text-sm text-muted-foreground">Avg Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Processing Results</h2>
            <div className="flex space-x-2">
              <Button onClick={exportResults} variant="outline" disabled={processingResults.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Companies processed with geographic segment extraction results</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Fixed height container with proper scrolling */}
              <div className="h-96 overflow-y-auto border rounded-md p-4 space-y-4">
                {processingResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No processing results yet. Start processing companies to see results here.
                  </div>
                ) : (
                  processingResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono">
                              {result.ticker}
                            </Badge>
                            <Badge variant="secondary">
                              {result.segments.length} segments
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {result.processingTime.toFixed(0)}ms
                            </span>
                          </div>
                          <h3 className="font-semibold mt-1">{result.companyName}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                          </div>
                          <Badge variant={result.dataQuality === 'High' ? 'default' : result.dataQuality === 'Medium' ? 'secondary' : 'destructive'}>
                            {result.dataQuality}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {result.segments.slice(0, 3).map((segment, segIndex) => (
                          <div key={segIndex} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{segment.geography}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-muted-foreground">{segment.percentage.toFixed(1)}%</span>
                              <Badge variant="outline" className="text-xs">
                                {segment.confidence.toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {result.segments.length > 3 && (
                          <div className="text-sm text-muted-foreground">
                            +{result.segments.length - 3} more segments
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Processing Logs</h2>
            <Badge variant="outline">{processingLogs.length} entries</Badge>
          </div>

          <Card>
            <CardContent className="p-0">
              {/* Fixed height container with proper scrolling */}
              <div className="h-96 overflow-y-auto p-4 space-y-2">
                {processingLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No logs yet. Processing activities will appear here.
                  </div>
                ) : (
                  processingLogs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm border-b pb-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getLogIcon(log.level)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          {log.ticker && (
                            <Badge variant="outline" className="text-xs">
                              {log.ticker}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 break-words">{log.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Summary</CardTitle>
              <CardDescription>
                Comprehensive overview of geographic intelligence extraction results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No processing results available. Complete some company processing to see the summary.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {processingStats.totalProcessed}
                          </div>
                          <div className="text-sm text-muted-foreground">Companies Processed</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {processingResults.reduce((sum, r) => sum + r.segments.length, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Geographic Segments</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {(processingStats.averageConfidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Average Confidence</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Data Quality Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(processingStats.dataQualityDistribution).map(([quality, count]) => (
                        <div key={quality} className="flex justify-between items-center">
                          <span>{quality} Quality</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(count / processingStats.totalProcessed) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count} ({((count / processingStats.totalProcessed) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export both as default and named export for compatibility
export default ExpansionDashboard;
export { ExpansionDashboard as DataExpansionDashboard };