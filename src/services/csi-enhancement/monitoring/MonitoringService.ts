/**
 * Monitoring Service
 * Provides real-time metrics and health monitoring
 */

import type { DataSourceHealth } from '@/types/csi-enhancement/signals';
import { SignalStorage } from '../storage/SignalStorage';
import type { IngestionMetrics } from '../ingestion/IngestionOrchestrator';

export interface SystemMetrics {
  // Ingestion Metrics
  signalsIngested: {
    last1Hour: number;
    last24Hours: number;
    last7Days: number;
  };

  // Source Health
  sourceStatus: DataSourceHealth[];

  // Qualification Metrics
  qualificationRate: {
    qualified: number;
    rejected: number;
    pending: number;
    qualificationRate: number;
  };

  // Geographic Coverage
  countryCoverage: {
    country: string;
    signalCount: number;
    qualifiedCount: number;
    lastSignal: Date;
  }[];

  // Vector Distribution
  vectorDistribution: {
    vector: string;
    signalCount: number;
    percentage: number;
  }[];

  // Performance Metrics
  performance: {
    avgIngestionLatency: number;
    avgProcessingTime: number;
    avgStorageLatency: number;
    systemUptime: number;
  };

  // Timestamp
  timestamp: Date;
}

export interface Alert {
  alertId: string;
  alertName: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private storage: SignalStorage;
  private metricsHistory: IngestionMetrics[] = [];
  private alerts: Alert[] = [];
  private startTime: Date = new Date();

  constructor(storage?: SignalStorage) {
    this.storage = storage || new SignalStorage();
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const stats = await this.storage.getStatistics();

    // Calculate time-based ingestion
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate qualification rate
    const qualificationRate = stats.totalSignals > 0
      ? (stats.qualifiedSignals / stats.totalSignals) * 100
      : 0;

    // Build country coverage
    const countryCoverage = Object.entries(stats.signalsByCountry).map(([country, count]) => ({
      country,
      signalCount: count,
      qualifiedCount: Math.floor(count * (qualificationRate / 100)),
      lastSignal: new Date()
    }));

    // Build vector distribution
    const totalVectorSignals = Object.values(stats.signalsByVector).reduce((a, b) => a + b, 0);
    const vectorDistribution = Object.entries(stats.signalsByVector).map(([vector, count]) => ({
      vector,
      signalCount: count,
      percentage: totalVectorSignals > 0 ? (count / totalVectorSignals) * 100 : 0
    }));

    // Calculate uptime
    const uptimeMs = now.getTime() - this.startTime.getTime();
    const uptimePercentage = 99.5; // Mock value

    return {
      signalsIngested: {
        last1Hour: Math.floor(stats.totalSignals * 0.01), // Mock
        last24Hours: Math.floor(stats.totalSignals * 0.1), // Mock
        last7Days: stats.totalSignals
      },
      sourceStatus: [], // Will be populated by data source clients
      qualificationRate: {
        qualified: stats.qualifiedSignals,
        rejected: stats.totalSignals - stats.qualifiedSignals,
        pending: 0,
        qualificationRate
      },
      countryCoverage: countryCoverage.slice(0, 20), // Top 20
      vectorDistribution,
      performance: {
        avgIngestionLatency: 2500, // Mock - 2.5 seconds
        avgProcessingTime: 1200, // Mock - 1.2 seconds
        avgStorageLatency: 45, // Mock - 45ms
        systemUptime: uptimePercentage
      },
      timestamp: now
    };
  }

  /**
   * Record ingestion metrics
   */
  recordIngestionMetrics(metrics: IngestionMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only last 100 runs
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }

    // Check for alerts
    this.checkAlerts(metrics);
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(metrics: IngestionMetrics): void {
    // Low ingestion rate
    if (metrics.signalsIngested < 50) {
      this.addAlert({
        alertId: `low-ingestion-${Date.now()}`,
        alertName: 'Low Ingestion Rate',
        severity: 'warning',
        message: `Only ${metrics.signalsIngested} signals ingested in last run`,
        timestamp: new Date(),
        metadata: { metrics }
      });
    }

    // High error rate
    const errorRate = metrics.errors / (metrics.signalsIngested || 1);
    if (errorRate > 0.05) {
      this.addAlert({
        alertId: `high-errors-${Date.now()}`,
        alertName: 'High Error Rate',
        severity: 'critical',
        message: `Error rate: ${(errorRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: { metrics }
      });
    }

    // Low qualification rate
    const qualificationRate = metrics.signalsQualified / (metrics.signalsParsed || 1);
    if (qualificationRate < 0.3) {
      this.addAlert({
        alertId: `low-qualification-${Date.now()}`,
        alertName: 'Low Qualification Rate',
        severity: 'info',
        message: `Qualification rate: ${(qualificationRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: { metrics }
      });
    }
  }

  /**
   * Add alert
   */
  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    console.log(`[Alert] ${alert.severity.toUpperCase()}: ${alert.alertName} - ${alert.message}`);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): Alert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 20): IngestionMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    message: string;
  }> {
    const checks: Record<string, boolean> = {};

    // Check database connection
    try {
      await this.storage.getStatistics();
      checks.database = true;
    } catch {
      checks.database = false;
    }

    // Check recent ingestion
    const recentMetrics = this.metricsHistory.slice(-1)[0];
    checks.ingestion = recentMetrics ? recentMetrics.signalsIngested > 0 : false;

    // Check error rate
    checks.errors = recentMetrics ? recentMetrics.errors < 5 : true;

    // Determine overall status
    const healthyCount = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;

    if (healthyCount === totalChecks) {
      status = 'healthy';
      message = 'All systems operational';
    } else if (healthyCount >= totalChecks / 2) {
      status = 'degraded';
      message = 'Some systems experiencing issues';
    } else {
      status = 'unhealthy';
      message = 'Multiple systems down';
    }

    return { status, checks, message };
  }
}