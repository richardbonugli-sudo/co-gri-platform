/**
 * Backtesting Dashboard Component
 * 
 * Comprehensive visualization of backtesting results, accuracy metrics,
 * calibration recommendations, and model performance analysis.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Download,
  BarChart3,
  Zap
} from 'lucide-react';
import { backtestingEngine, type BacktestSummary, type AccuracyMetrics } from '@/services/csi/backtestingEngine';
import { calibrationService, type CalibrationConfig } from '@/services/csi/calibrationService';
import { modelAccuracyTracker, type RollingMetrics } from '@/services/csi/modelAccuracyTracker';

interface BacktestingDashboardProps {
  onCalibrationApply?: (configId: string) => void;
}

export const BacktestingDashboard: React.FC<BacktestingDashboardProps> = ({
  onCalibrationApply
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [rollingMetrics, setRollingMetrics] = useState<{
    '7D': RollingMetrics;
    '30D': RollingMetrics;
    '90D': RollingMetrics;
  } | null>(null);
  const [configurations, setConfigurations] = useState<CalibrationConfig[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Run backtest
  const runBacktest = useCallback(async () => {
    setIsLoading(true);
    try {
      // Initialize baseline if needed
      calibrationService.initializeBaseline();
      
      // Get results
      const result = backtestingEngine.getLastSummary();
      setSummary(result);
      
      // Record results in accuracy tracker
      const backtestResults = backtestingEngine.getResults();
      modelAccuracyTracker.recordBatch(backtestResults);
      
      // Get rolling metrics
      setRollingMetrics({
        '7D': modelAccuracyTracker.getRollingMetrics('7D'),
        '30D': modelAccuracyTracker.getRollingMetrics('30D'),
        '90D': modelAccuracyTracker.getRollingMetrics('90D')
      });
      
      // Get configurations
      setConfigurations(calibrationService.getConfigurations());
    } catch (error) {
      console.error('[Backtesting Dashboard] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run on mount
  useEffect(() => {
    runBacktest();
  }, [runBacktest]);

  // Generate optimized configuration
  const handleOptimize = useCallback(() => {
    if (!summary) return;
    
    const newConfig = calibrationService.optimizeWeights(summary.calibrationRecommendations);
    setConfigurations(calibrationService.getConfigurations());
    
    console.log('[Backtesting Dashboard] Created optimized config:', newConfig.id);
  }, [summary]);

  // Apply configuration
  const handleApplyConfig = useCallback((configId: string) => {
    calibrationService.applyCalibration(configId);
    setConfigurations(calibrationService.getConfigurations());
    onCalibrationApply?.(configId);
    
    // Re-run backtest with new config
    runBacktest();
  }, [onCalibrationApply, runBacktest]);

  // Prepare chart data
  const prepareScatterData = () => {
    if (!summary) return [];
    
    return backtestingEngine.getEventComparison().map(item => ({
      predicted: item.predicted,
      actual: item.actual,
      event: item.event.substring(0, 30) + '...',
      date: item.date.toLocaleDateString()
    }));
  };

  const prepareCategoryData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.byCategory).map(([category, metrics]) => ({
      category,
      mae: metrics.mae,
      directionalAccuracy: metrics.directionalAccuracy,
      eventCount: metrics.eventCount,
      bias: metrics.bias
    }));
  };

  const prepareTimelineData = () => {
    if (!summary) return [];
    
    return backtestingEngine.getResults()
      .sort((a, b) => a.event.date.getTime() - b.event.date.getTime())
      .map(result => ({
        date: result.event.date.toLocaleDateString(),
        predicted: result.modelPrediction.deltaCSI,
        actual: result.actual.deltaCSI,
        error: result.absoluteError
      }));
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }, inverse = false) => {
    if (inverse) {
      if (value <= thresholds.good) return 'text-green-400';
      if (value <= thresholds.warning) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (value >= thresholds.good) return 'text-green-400';
      if (value >= thresholds.warning) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConfidenceBadge = (metrics: AccuracyMetrics) => {
    if (metrics.correlation > 0.8 && metrics.directionalAccuracy > 80) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500">High Confidence</Badge>;
    } else if (metrics.correlation > 0.6 && metrics.directionalAccuracy > 65) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Medium Confidence</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500">Low Confidence</Badge>;
  };

  return (
    <Card className="bg-[#0d1512] border-[#0d5f5f]/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#7fa89f]" />
            <CardTitle className="text-white text-lg font-semibold">
              Model Validation & Calibration
            </CardTitle>
            {summary && getConfidenceBadge(summary.metrics)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runBacktest}
              disabled={isLoading}
              className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Run Backtest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOptimize}
              disabled={!summary || isLoading}
              className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
            >
              <Settings className="h-4 w-4 mr-1" />
              Optimize
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0a0f0d] border border-[#0d5f5f]/30 mb-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#0d5f5f] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="accuracy" className="data-[state=active]:bg-[#0d5f5f] data-[state=active]:text-white">
              Accuracy
            </TabsTrigger>
            <TabsTrigger value="calibration" className="data-[state=active]:bg-[#0d5f5f] data-[state=active]:text-white">
              Calibration
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-[#0d5f5f] data-[state=active]:text-white">
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {summary ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">MAE</div>
                    <div className={`text-xl font-bold ${getMetricColor(summary.metrics.mae, { good: 2, warning: 3.5 }, true)}`}>
                      {summary.metrics.mae.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Mean Absolute Error</div>
                  </div>
                  <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Correlation</div>
                    <div className={`text-xl font-bold ${getMetricColor(summary.metrics.correlation, { good: 0.8, warning: 0.6 })}`}>
                      {summary.metrics.correlation.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500">Pearson r</div>
                  </div>
                  <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Direction</div>
                    <div className={`text-xl font-bold ${getMetricColor(summary.metrics.directionalAccuracy, { good: 80, warning: 65 })}`}>
                      {summary.metrics.directionalAccuracy.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Correct Direction</div>
                  </div>
                  <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Events</div>
                    <div className="text-xl font-bold text-white">
                      {summary.processedEvents}
                    </div>
                    <div className="text-xs text-gray-500">Backtested</div>
                  </div>
                </div>

                {/* Predicted vs Actual Scatter */}
                <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Predicted vs Actual ΔCSI</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2e2a" />
                      <XAxis 
                        dataKey="actual" 
                        type="number" 
                        name="Actual" 
                        stroke="#7fa89f"
                        fontSize={10}
                        label={{ value: 'Actual ΔCSI', position: 'bottom', fill: '#7fa89f', fontSize: 10 }}
                      />
                      <YAxis 
                        dataKey="predicted" 
                        type="number" 
                        name="Predicted" 
                        stroke="#7fa89f"
                        fontSize={10}
                        label={{ value: 'Predicted ΔCSI', angle: -90, position: 'left', fill: '#7fa89f', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1512', border: '1px solid #0d5f5f' }}
                        labelStyle={{ color: '#7fa89f' }}
                      />
                      <ReferenceLine 
                        segment={[{ x: -20, y: -20 }, { x: 20, y: 20 }]} 
                        stroke="#0d5f5f" 
                        strokeDasharray="5 5"
                      />
                      <Scatter 
                        data={prepareScatterData()} 
                        fill="#4ade80"
                        fillOpacity={0.6}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Points on the diagonal line indicate perfect predictions
                  </p>
                </div>

                {/* Rolling Metrics */}
                {rollingMetrics && (
                  <div className="grid grid-cols-3 gap-3">
                    {(['7D', '30D', '90D'] as const).map(window => {
                      const metrics = rollingMetrics[window];
                      return (
                        <div key={window} className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{window} Rolling</span>
                            {getTrendIcon(metrics.trend)}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">MAE</span>
                              <span className={getMetricColor(metrics.mae, { good: 2, warning: 3.5 }, true)}>
                                {metrics.mae.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Direction</span>
                              <span className={getMetricColor(metrics.directionalAccuracy, { good: 80, warning: 65 })}>
                                {metrics.directionalAccuracy.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Events</span>
                              <span className="text-white">{metrics.eventCount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Click "Run Backtest" to analyze model performance</p>
              </div>
            )}
          </TabsContent>

          {/* Accuracy Tab */}
          <TabsContent value="accuracy" className="space-y-4">
            {summary ? (
              <>
                {/* Category Performance */}
                <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Performance by Category</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={prepareCategoryData()} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2e2a" />
                      <XAxis dataKey="category" stroke="#7fa89f" fontSize={10} />
                      <YAxis stroke="#7fa89f" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1512', border: '1px solid #0d5f5f' }}
                        labelStyle={{ color: '#7fa89f' }}
                      />
                      <Legend />
                      <Bar dataKey="mae" name="MAE" fill="#f59e0b" />
                      <Bar dataKey="directionalAccuracy" name="Direction %" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Metrics Table */}
                <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Detailed Accuracy Metrics</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#0d5f5f]/30">
                          <th className="text-left py-2 text-gray-400">Metric</th>
                          <th className="text-right py-2 text-gray-400">Value</th>
                          <th className="text-right py-2 text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#0d5f5f]/20">
                          <td className="py-2 text-white">Mean Absolute Error (MAE)</td>
                          <td className="py-2 text-right text-white">{summary.metrics.mae.toFixed(3)}</td>
                          <td className="py-2 text-right">
                            {summary.metrics.mae < 2 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : summary.metrics.mae < 3.5 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-[#0d5f5f]/20">
                          <td className="py-2 text-white">Root Mean Square Error (RMSE)</td>
                          <td className="py-2 text-right text-white">{summary.metrics.rmse.toFixed(3)}</td>
                          <td className="py-2 text-right">
                            {summary.metrics.rmse < 2.5 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : summary.metrics.rmse < 4 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-[#0d5f5f]/20">
                          <td className="py-2 text-white">Correlation Coefficient</td>
                          <td className="py-2 text-right text-white">{summary.metrics.correlation.toFixed(3)}</td>
                          <td className="py-2 text-right">
                            {summary.metrics.correlation > 0.8 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : summary.metrics.correlation > 0.6 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-[#0d5f5f]/20">
                          <td className="py-2 text-white">R-Squared (R²)</td>
                          <td className="py-2 text-right text-white">{summary.metrics.r2.toFixed(3)}</td>
                          <td className="py-2 text-right">
                            {summary.metrics.r2 > 0.64 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : summary.metrics.r2 > 0.36 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-[#0d5f5f]/20">
                          <td className="py-2 text-white">Directional Accuracy</td>
                          <td className="py-2 text-right text-white">{summary.metrics.directionalAccuracy.toFixed(1)}%</td>
                          <td className="py-2 text-right">
                            {summary.metrics.directionalAccuracy > 80 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : summary.metrics.directionalAccuracy > 65 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-[#0d5f5f]/20">
                          <td className="py-2 text-white">Magnitude Accuracy</td>
                          <td className="py-2 text-right text-white">{summary.metrics.magnitudeAccuracy.toFixed(1)}%</td>
                          <td className="py-2 text-right">
                            {summary.metrics.magnitudeAccuracy > 70 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : summary.metrics.magnitudeAccuracy > 50 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-white">Prediction Bias</td>
                          <td className="py-2 text-right text-white">{summary.metrics.bias > 0 ? '+' : ''}{summary.metrics.bias.toFixed(3)}</td>
                          <td className="py-2 text-right">
                            {Math.abs(summary.metrics.bias) < 1 ? (
                              <CheckCircle className="h-4 w-4 text-green-400 inline" />
                            ) : Math.abs(summary.metrics.bias) < 2 ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-400 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 inline" />
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Run backtest to view accuracy metrics</p>
              </div>
            )}
          </TabsContent>

          {/* Calibration Tab */}
          <TabsContent value="calibration" className="space-y-4">
            {summary ? (
              <>
                {/* Recommendations */}
                {summary.calibrationRecommendations.length > 0 && (
                  <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      Calibration Recommendations
                    </h4>
                    <div className="space-y-2">
                      {summary.calibrationRecommendations.map((rec, idx) => (
                        <div key={idx} className="bg-[#0d1512] border border-[#0d5f5f]/20 rounded p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge className="text-xs bg-[#0d5f5f]/30 text-[#7fa89f] mb-1">
                                {rec.type.replace('_', ' ')}
                              </Badge>
                              <p className="text-sm text-white">{rec.target}</p>
                              <p className="text-xs text-gray-400 mt-1">{rec.reasoning}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Current → Recommended</div>
                              <div className="text-sm text-white">
                                {rec.currentValue.toFixed(3)} → {rec.recommendedValue.toFixed(3)}
                              </div>
                              <div className="text-xs text-green-400">
                                +{rec.expectedImprovement.toFixed(2)} improvement
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Configurations */}
                <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#7fa89f]" />
                    Configurations
                  </h4>
                  <div className="space-y-2">
                    {configurations.map(config => (
                      <div 
                        key={config.id} 
                        className={`bg-[#0d1512] border rounded p-3 ${
                          config.isActive 
                            ? 'border-green-500/50' 
                            : 'border-[#0d5f5f]/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{config.name}</span>
                              {config.isActive && (
                                <Badge className="text-xs bg-green-500/20 text-green-400">Active</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{config.description}</p>
                          </div>
                          {!config.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyConfig(config.id)}
                              className="border-[#0d5f5f] text-[#7fa89f] hover:bg-[#0d5f5f] hover:text-white"
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Run backtest to view calibration options</p>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            {summary ? (
              <div className="bg-[#0a0f0d] border border-[#0d5f5f]/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Prediction Timeline</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareTimelineData()} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2e2a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#7fa89f" 
                      fontSize={9}
                      interval="preserveStartEnd"
                    />
                    <YAxis stroke="#7fa89f" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1512', border: '1px solid #0d5f5f' }}
                      labelStyle={{ color: '#7fa89f' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      name="Predicted ΔCSI"
                      stroke="#4ade80" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      name="Actual ΔCSI"
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="error" 
                      name="Error"
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Run backtest to view timeline</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BacktestingDashboard;