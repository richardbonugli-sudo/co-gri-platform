"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, 
  Globe, 
  Building, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Filter,
  Search,
  Map,
  PieChart,
  Activity,
  Users,
  DollarSign,
  Percent,
  Calendar,
  Bell,
  Settings,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Import services
import { unifiedDatabaseIntegrator, UnifiedCompanyRecord } from '../services/UnifiedDatabaseIntegrator';
import { realTimeUpdateSystem, UpdateAlert, MonitoringStats } from '../services/RealTimeUpdateSystem';

interface PortfolioAnalytics {
  totalCompanies: number;
  totalMarketCap: number;
  geographicDistribution: Record<string, number>;
  sectorDistribution: Record<string, number>;
  qualityDistribution: Record<string, number>;
  riskMetrics: {
    concentrationRisk: number;
    geographicDiversification: number;
    dataQualityScore: number;
    confidenceScore: number;
  };
}

interface GeographicRisk {
  geography: string;
  exposure: number;
  riskScore: number;
  riskFactors: string[];
  companies: number;
  marketCap: number;
}

interface SectorAnalysis {
  sector: string;
  companies: number;
  marketCap: number;
  averageConfidence: number;
  topGeographies: Array<{ geography: string; percentage: number }>;
  riskProfile: 'low' | 'medium' | 'high';
}

export default function AdvancedAnalyticsDashboard() {
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [geographicRisks, setGeographicRisks] = useState<GeographicRisk[]>([]);
  const [sectorAnalysis, setSectorAnalysis] = useState<SectorAnalysis[]>([]);
  const [alerts, setAlerts] = useState<UpdateAlert[]>([]);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDashboard();
    
    // Set up real-time updates
    realTimeUpdateSystem.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    realTimeUpdateSystem.onStatsUpdate((stats) => {
      setMonitoringStats(stats);
    });

    // Refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      refreshAnalytics();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const initializeDashboard = async () => {
    setIsLoading(true);
    
    try {
      await calculatePortfolioAnalytics();
      await calculateGeographicRisks();
      await calculateSectorAnalysis();
      await loadAlerts();
      await loadMonitoringStats();
      
      console.log('✅ Advanced Analytics Dashboard initialized');
    } catch (error) {
      console.error('❌ Failed to initialize dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    try {
      await calculatePortfolioAnalytics();
      await calculateGeographicRisks();
      await calculateSectorAnalysis();
    } catch (error) {
      console.error('❌ Failed to refresh analytics:', error);
    }
  };

  const calculatePortfolioAnalytics = async () => {
    const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
    const companyArray = Array.from(companies.values());

    const totalMarketCap = companyArray.reduce((sum, c) => sum + c.marketCap, 0);
    
    // Geographic distribution
    const geographicDistribution: Record<string, number> = {};
    companyArray.forEach(company => {
      Object.entries(company.geographicSegments).forEach(([geo, segment]) => {
        const weightedPercentage = (segment.percentage * company.marketCap) / totalMarketCap;
        geographicDistribution[geo] = (geographicDistribution[geo] || 0) + weightedPercentage;
      });
    });

    // Sector distribution
    const sectorDistribution: Record<string, number> = {};
    companyArray.forEach(company => {
      const weight = company.marketCap / totalMarketCap;
      sectorDistribution[company.sector] = (sectorDistribution[company.sector] || 0) + weight;
    });

    // Quality distribution
    const qualityDistribution: Record<string, number> = {};
    companyArray.forEach(company => {
      qualityDistribution[company.dataQuality] = (qualityDistribution[company.dataQuality] || 0) + 1;
    });

    // Risk metrics
    const concentrationRisk = calculateConcentrationRisk(geographicDistribution);
    const geographicDiversification = calculateDiversificationScore(geographicDistribution);
    const dataQualityScore = calculateDataQualityScore(companyArray);
    const confidenceScore = companyArray.reduce((sum, c) => sum + c.overallConfidence, 0) / companyArray.length;

    setPortfolioAnalytics({
      totalCompanies: companyArray.length,
      totalMarketCap,
      geographicDistribution,
      sectorDistribution,
      qualityDistribution,
      riskMetrics: {
        concentrationRisk,
        geographicDiversification,
        dataQualityScore,
        confidenceScore
      }
    });
  };

  const calculateGeographicRisks = async () => {
    const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
    const companyArray = Array.from(companies.values());
    const totalMarketCap = companyArray.reduce((sum, c) => sum + c.marketCap, 0);

    const geographicData: Record<string, { exposure: number; companies: Set<string>; marketCap: number }> = {};

    // Aggregate geographic data
    companyArray.forEach(company => {
      Object.entries(company.geographicSegments).forEach(([geo, segment]) => {
        if (!geographicData[geo]) {
          geographicData[geo] = { exposure: 0, companies: new Set(), marketCap: 0 };
        }
        
        const weightedPercentage = (segment.percentage * company.marketCap) / totalMarketCap;
        geographicData[geo].exposure += weightedPercentage;
        geographicData[geo].companies.add(company.ticker);
        geographicData[geo].marketCap += (company.marketCap * segment.percentage / 100);
      });
    });

    // Calculate risks for each geography
    const risks: GeographicRisk[] = Object.entries(geographicData).map(([geo, data]) => {
      const riskScore = calculateGeographicRiskScore(geo, data.exposure);
      const riskFactors = getGeographicRiskFactors(geo);

      return {
        geography: geo,
        exposure: data.exposure,
        riskScore,
        riskFactors,
        companies: data.companies.size,
        marketCap: data.marketCap
      };
    }).sort((a, b) => b.exposure - a.exposure);

    setGeographicRisks(risks);
  };

  const calculateSectorAnalysis = async () => {
    const companies = unifiedDatabaseIntegrator.getUnifiedRecords();
    const companyArray = Array.from(companies.values());

    const sectorData: Record<string, { 
      companies: UnifiedCompanyRecord[]; 
      marketCap: number;
      geographicExposure: Record<string, number>;
    }> = {};

    // Group by sector
    companyArray.forEach(company => {
      if (!sectorData[company.sector]) {
        sectorData[company.sector] = { 
          companies: [], 
          marketCap: 0,
          geographicExposure: {}
        };
      }
      
      sectorData[company.sector].companies.push(company);
      sectorData[company.sector].marketCap += company.marketCap;

      // Aggregate geographic exposure
      Object.entries(company.geographicSegments).forEach(([geo, segment]) => {
        const weighted = segment.percentage * company.marketCap;
        sectorData[company.sector].geographicExposure[geo] = 
          (sectorData[company.sector].geographicExposure[geo] || 0) + weighted;
      });
    });

    // Calculate sector analysis
    const analysis: SectorAnalysis[] = Object.entries(sectorData).map(([sector, data]) => {
      const averageConfidence = data.companies.reduce((sum, c) => sum + c.overallConfidence, 0) / data.companies.length;
      
      // Normalize geographic exposure and get top geographies
      const totalWeight = data.marketCap;
      const normalizedExposure = Object.entries(data.geographicExposure).map(([geo, weight]) => ({
        geography: geo,
        percentage: (weight / totalWeight) * 100
      })).sort((a, b) => b.percentage - a.percentage).slice(0, 5);

      const riskProfile = calculateSectorRiskProfile(sector, normalizedExposure);

      return {
        sector,
        companies: data.companies.length,
        marketCap: data.marketCap,
        averageConfidence,
        topGeographies: normalizedExposure,
        riskProfile
      };
    }).sort((a, b) => b.marketCap - a.marketCap);

    setSectorAnalysis(analysis);
  };

  const loadAlerts = async () => {
    const activeAlerts = realTimeUpdateSystem.getActiveAlerts();
    setAlerts(activeAlerts);
  };

  const loadMonitoringStats = async () => {
    const stats = realTimeUpdateSystem.getMonitoringStats();
    setMonitoringStats(stats);
  };

  // Utility functions
  const calculateConcentrationRisk = (distribution: Record<string, number>): number => {
    const values = Object.values(distribution);
    const herfindahl = values.reduce((sum, val) => sum + (val * val), 0);
    return Math.min(herfindahl * 100, 100); // Normalize to 0-100
  };

  const calculateDiversificationScore = (distribution: Record<string, number>): number => {
    const geographyCount = Object.keys(distribution).length;
    const maxConcentration = Math.max(...Object.values(distribution));
    return Math.max(0, 100 - maxConcentration * 2 + geographyCount * 2);
  };

  const calculateDataQualityScore = (companies: UnifiedCompanyRecord[]): number => {
    const qualityScores = { 'A+': 100, 'A': 90, 'B+': 80, 'B': 70, 'C+': 60, 'C': 50, 'D': 30 };
    const totalScore = companies.reduce((sum, c) => sum + qualityScores[c.dataQuality], 0);
    return totalScore / companies.length;
  };

  const calculateGeographicRiskScore = (geography: string, exposure: number): number => {
    // Simplified risk scoring based on geography and exposure
    const baseRisk = getBaseGeographicRisk(geography);
    const exposureMultiplier = Math.min(exposure / 20, 2); // Cap at 2x for 20%+ exposure
    return Math.min(baseRisk * exposureMultiplier, 100);
  };

  const getBaseGeographicRisk = (geography: string): number => {
    const riskMappings: Record<string, number> = {
      'China': 70,
      'Russia': 90,
      'Middle East': 60,
      'Latin America': 50,
      'Europe': 20,
      'United States': 10,
      'Canada': 15,
      'Japan': 25,
      'Australia': 20
    };
    return riskMappings[geography] || 40; // Default medium risk
  };

  const getGeographicRiskFactors = (geography: string): string[] => {
    const riskFactors: Record<string, string[]> = {
      'China': ['Regulatory changes', 'Trade tensions', 'Currency volatility'],
      'Russia': ['Sanctions risk', 'Political instability', 'Currency risk'],
      'Middle East': ['Geopolitical tensions', 'Oil price volatility', 'Regulatory risk'],
      'Europe': ['Economic uncertainty', 'Regulatory compliance', 'Brexit impact'],
      'United States': ['Market saturation', 'Regulatory changes'],
      'Latin America': ['Currency volatility', 'Political risk', 'Economic instability']
    };
    return riskFactors[geography] || ['Market risk', 'Currency risk'];
  };

  const calculateSectorRiskProfile = (sector: string, geographies: Array<{ geography: string; percentage: number }>): 'low' | 'medium' | 'high' => {
    const highRiskGeographies = ['China', 'Russia', 'Middle East'];
    const highRiskExposure = geographies
      .filter(g => highRiskGeographies.includes(g.geography))
      .reduce((sum, g) => sum + g.percentage, 0);

    if (highRiskExposure > 30) return 'high';
    if (highRiskExposure > 15) return 'medium';
    return 'low';
  };

  const formatMarketCap = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  const getRiskColor = (riskScore: number): string => {
    if (riskScore >= 70) return 'text-red-500';
    if (riskScore >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBadgeColor = (riskProfile: string): string => {
    switch (riskProfile) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading Advanced Analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <BarChart3 className="h-10 w-10 text-purple-400" />
            Advanced Analytics Dashboard
          </h1>
          <p className="text-xl text-slate-300">
            Portfolio-Level Geographic Intelligence & Risk Assessment
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <Globe className="h-4 w-4 mr-1" />
              {portfolioAnalytics?.totalCompanies || 0} Companies
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <DollarSign className="h-4 w-4 mr-1" />
              {portfolioAnalytics ? formatMarketCap(portfolioAnalytics.totalMarketCap) : '$0'}
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Target className="h-4 w-4 mr-1" />
              {portfolioAnalytics ? (portfolioAnalytics.riskMetrics.confidenceScore * 100).toFixed(1) : 0}% Confidence
            </Badge>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Concentration Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRiskColor(portfolioAnalytics?.riskMetrics.concentrationRisk || 0)}`}>
                {portfolioAnalytics?.riskMetrics.concentrationRisk.toFixed(1) || 0}
              </div>
              <p className="text-xs text-slate-400">Risk score (0-100)</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Diversification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {portfolioAnalytics?.riskMetrics.geographicDiversification.toFixed(1) || 0}
              </div>
              <p className="text-xs text-slate-400">Diversification score</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {portfolioAnalytics?.riskMetrics.dataQualityScore.toFixed(1) || 0}
              </div>
              <p className="text-xs text-slate-400">Quality score (0-100)</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{alerts.length}</div>
              <p className="text-xs text-slate-400">Unacknowledged alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-slate-700">
              Portfolio Overview
            </TabsTrigger>
            <TabsTrigger value="geographic" className="data-[state=active]:bg-slate-700">
              Geographic Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="sector" className="data-[state=active]:bg-slate-700">
              Sector Analysis
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-slate-700">
              Real-time Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-slate-700">
              System Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Geographic Distribution */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Geographic Distribution</CardTitle>
                  <CardDescription className="text-slate-300">
                    Market cap weighted exposure by geography
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioAnalytics && Object.entries(portfolioAnalytics.geographicDistribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([geo, percentage]) => (
                        <div key={geo} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">{geo}</span>
                            <span className="text-slate-400">{percentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sector Distribution */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Sector Distribution</CardTitle>
                  <CardDescription className="text-slate-300">
                    Market cap weighted exposure by sector
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioAnalytics && Object.entries(portfolioAnalytics.sectorDistribution)
                      .sort(([,a], [,b]) => b - a)
                      .map(([sector, weight]) => (
                        <div key={sector} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">{sector}</span>
                            <span className="text-slate-400">{(weight * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={weight * 100} className="h-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geographic">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Geographic Risk Analysis</CardTitle>
                <CardDescription className="text-slate-300">
                  Risk assessment by geographic exposure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-3">
                    {geographicRisks.map((risk) => (
                      <div key={risk.geography} className="border border-slate-600 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{risk.geography}</h3>
                            <p className="text-sm text-slate-400">
                              {risk.companies} companies • {formatMarketCap(risk.marketCap)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getRiskColor(risk.riskScore)}`}>
                              {risk.riskScore.toFixed(0)}
                            </div>
                            <div className="text-xs text-slate-400">Risk Score</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-slate-300">
                            Exposure: {risk.exposure.toFixed(1)}%
                          </div>
                          <Progress value={risk.exposure} className="h-2 w-32" />
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {risk.riskFactors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sector">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sector Analysis</CardTitle>
                <CardDescription className="text-slate-300">
                  Geographic exposure and risk by sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-4">
                    {sectorAnalysis.map((sector) => (
                      <div key={sector.sector} className="border border-slate-600 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white">{sector.sector}</h3>
                            <p className="text-sm text-slate-400">
                              {sector.companies} companies • {formatMarketCap(sector.marketCap)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskBadgeColor(sector.riskProfile)}>
                              {sector.riskProfile.toUpperCase()} RISK
                            </Badge>
                            <div className="text-right">
                              <div className="text-sm font-medium text-white">
                                {(sector.averageConfidence * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-slate-400">Confidence</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Top Geographic Exposures</h4>
                          <div className="space-y-1">
                            {sector.topGeographies.slice(0, 3).map((geo) => (
                              <div key={geo.geography} className="flex justify-between text-xs">
                                <span className="text-slate-400">{geo.geography}</span>
                                <span className="text-slate-300">{geo.percentage.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Real-time Alerts
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Active alerts requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No active alerts</p>
                        <p className="text-sm">All systems operating normally</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.alertId} className="border border-slate-600 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                alert.severity === 'critical' ? 'bg-red-500' :
                                alert.severity === 'high' ? 'bg-orange-500' :
                                alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                              }>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {alert.ticker}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400">
                              {alert.timestamp.toLocaleString()}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-white">{alert.message}</h4>
                            <p className="text-sm text-slate-300">{alert.companyName}</p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 capitalize">
                              {alert.alertType.replace('_', ' ')}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => realTimeUpdateSystem.acknowledgeAlert(alert.alertId, 'User')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Acknowledge
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* System Health */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                  <CardDescription className="text-slate-300">
                    Real-time monitoring system status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {monitoringStats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          monitoringStats.systemHealth === 'healthy' ? 'text-green-500' :
                          monitoringStats.systemHealth === 'warning' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {monitoringStats.systemHealth.toUpperCase()}
                        </div>
                        <div className="text-sm text-slate-300">System Status</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {monitoringStats.totalCompaniesMonitored}
                        </div>
                        <div className="text-sm text-slate-300">Companies Monitored</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {monitoringStats.eventsProcessedToday}
                        </div>
                        <div className="text-sm text-slate-300">Events Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {monitoringStats.averageProcessingTime.toFixed(0)}ms
                        </div>
                        <div className="text-sm text-slate-300">Avg Processing Time</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export and Actions */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Analytics Actions</CardTitle>
                  <CardDescription className="text-slate-300">
                    Export data and manage analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4 mr-2" />
                      Export Portfolio Report
                    </Button>
                    <Button variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Risk Assessment
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Alerts
                    </Button>
                    <Button variant="outline" onClick={refreshAnalytics}>
                      <Activity className="h-4 w-4 mr-2" />
                      Refresh Analytics
                    </Button>
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