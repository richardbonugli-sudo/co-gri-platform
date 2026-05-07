/**
 * Monitoring and Metrics for CSI Ingestion Pipeline
 * 
 * Tracks ingestion health, performance, and data quality
 * Integrates with Prometheus for metrics collection
 * 
 * @module ingestion/infrastructure/monitoring
 */

export interface IngestionMetrics {
  sourceId: string;
  timestamp: Date;
  itemsFetched: number;
  itemsProcessed: number;
  itemsStored: number;
  errors: number;
  duration: number;
  latency: number;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  uptime: number;
  errorRate: number;
  message?: string;
}

export interface AlertConfig {
  name: string;
  condition: (metrics: IngestionMetrics) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

/**
 * Monitoring Service for CSI Ingestion
 */
export class MonitoringService {
  private metrics: Map<string, IngestionMetrics[]>;
  private healthChecks: Map<string, HealthCheck>;
  private alerts: AlertConfig[];
  private readonly MAX_METRICS_HISTORY = 1000;

  constructor() {
    this.metrics = new Map();
    this.healthChecks = new Map();
    this.alerts = this.initializeAlerts();
  }

  /**
   * Initialize alert configurations
   */
  private initializeAlerts(): AlertConfig[] {
    return [
      {
        name: 'high_error_rate',
        condition: (m) => m.errors / Math.max(m.itemsFetched, 1) > 0.1,
        severity: 'warning',
        message: 'Error rate exceeds 10%'
      },
      {
        name: 'no_data_fetched',
        condition: (m) => m.itemsFetched === 0,
        severity: 'critical',
        message: 'No data fetched from source'
      },
      {
        name: 'high_latency',
        condition: (m) => m.latency > 60000, // 60 seconds
        severity: 'warning',
        message: 'Ingestion latency exceeds 60 seconds'
      },
      {
        name: 'low_processing_rate',
        condition: (m) => m.itemsProcessed / Math.max(m.itemsFetched, 1) < 0.5,
        severity: 'warning',
        message: 'Processing rate below 50%'
      }
    ];
  }

  /**
   * Record ingestion metrics
   */
  recordMetrics(metrics: IngestionMetrics): void {
    const sourceMetrics = this.metrics.get(metrics.sourceId) || [];
    sourceMetrics.push(metrics);

    // Keep only recent history
    if (sourceMetrics.length > this.MAX_METRICS_HISTORY) {
      sourceMetrics.shift();
    }

    this.metrics.set(metrics.sourceId, sourceMetrics);

    // Check for alerts
    this.checkAlerts(metrics);

    // Update health check
    this.updateHealthCheck(metrics);
  }

  /**
   * Check alert conditions
   */
  private checkAlerts(metrics: IngestionMetrics): void {
    for (const alert of this.alerts) {
      if (alert.condition(metrics)) {
        this.triggerAlert(alert, metrics);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: AlertConfig, metrics: IngestionMetrics): void {
    console.warn(`[${alert.severity.toUpperCase()}] ${alert.name}: ${alert.message}`);
    console.warn(`Source: ${metrics.sourceId}, Timestamp: ${metrics.timestamp.toISOString()}`);
    console.warn(`Metrics:`, metrics);

    // In production: send to alerting system (PagerDuty, Slack, etc.)
  }

  /**
   * Update health check status
   */
  private updateHealthCheck(metrics: IngestionMetrics): void {
    const errorRate = metrics.errors / Math.max(metrics.itemsFetched, 1);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (errorRate > 0.2 || metrics.itemsFetched === 0) {
      status = 'unhealthy';
    } else if (errorRate > 0.1 || metrics.latency > 60000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const healthCheck: HealthCheck = {
      service: metrics.sourceId,
      status,
      lastCheck: metrics.timestamp,
      uptime: this.calculateUptime(metrics.sourceId),
      errorRate,
      message: status === 'healthy' ? 'Operating normally' : 
               status === 'degraded' ? 'Performance degraded' : 
               'Service unhealthy'
    };

    this.healthChecks.set(metrics.sourceId, healthCheck);
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(sourceId: string): number {
    const sourceMetrics = this.metrics.get(sourceId) || [];
    if (sourceMetrics.length === 0) return 100;

    const healthyCount = sourceMetrics.filter(m => {
      const errorRate = m.errors / Math.max(m.itemsFetched, 1);
      return errorRate < 0.1 && m.itemsFetched > 0;
    }).length;

    return (healthyCount / sourceMetrics.length) * 100;
  }

  /**
   * Get metrics for a source
   */
  getMetrics(sourceId: string, limit?: number): IngestionMetrics[] {
    const metrics = this.metrics.get(sourceId) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(sourceId: string, windowMinutes: number = 60): {
    totalFetched: number;
    totalProcessed: number;
    totalErrors: number;
    avgDuration: number;
    avgLatency: number;
    errorRate: number;
  } {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentMetrics = (this.metrics.get(sourceId) || [])
      .filter(m => m.timestamp >= cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalFetched: 0,
        totalProcessed: 0,
        totalErrors: 0,
        avgDuration: 0,
        avgLatency: 0,
        errorRate: 0
      };
    }

    const totalFetched = recentMetrics.reduce((sum, m) => sum + m.itemsFetched, 0);
    const totalProcessed = recentMetrics.reduce((sum, m) => sum + m.itemsProcessed, 0);
    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errors, 0);
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
    const errorRate = totalErrors / Math.max(totalFetched, 1);

    return {
      totalFetched,
      totalProcessed,
      totalErrors,
      avgDuration,
      avgLatency,
      errorRate
    };
  }

  /**
   * Get health check for a service
   */
  getHealthCheck(serviceId: string): HealthCheck | undefined {
    return this.healthChecks.get(serviceId);
  }

  /**
   * Get all health checks
   */
  getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalServices: number;
  } {
    const checks = this.getAllHealthChecks();
    const healthyServices = checks.filter(c => c.status === 'healthy').length;
    const degradedServices = checks.filter(c => c.status === 'degraded').length;
    const unhealthyServices = checks.filter(c => c.status === 'unhealthy').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices > 0 || healthyServices === 0) {
      status = 'unhealthy';
    } else if (degradedServices > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      healthyServices,
      degradedServices,
      unhealthyServices,
      totalServices: checks.length
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    // Add metrics for each source
    for (const [sourceId, metrics] of this.metrics) {
      const latest = metrics[metrics.length - 1];
      if (!latest) continue;

      lines.push(`# HELP csi_ingestion_items_fetched Number of items fetched`);
      lines.push(`# TYPE csi_ingestion_items_fetched gauge`);
      lines.push(`csi_ingestion_items_fetched{source="${sourceId}"} ${latest.itemsFetched}`);

      lines.push(`# HELP csi_ingestion_items_processed Number of items processed`);
      lines.push(`# TYPE csi_ingestion_items_processed gauge`);
      lines.push(`csi_ingestion_items_processed{source="${sourceId}"} ${latest.itemsProcessed}`);

      lines.push(`# HELP csi_ingestion_errors Number of errors`);
      lines.push(`# TYPE csi_ingestion_errors gauge`);
      lines.push(`csi_ingestion_errors{source="${sourceId}"} ${latest.errors}`);

      lines.push(`# HELP csi_ingestion_duration_ms Ingestion duration in milliseconds`);
      lines.push(`# TYPE csi_ingestion_duration_ms gauge`);
      lines.push(`csi_ingestion_duration_ms{source="${sourceId}"} ${latest.duration}`);

      lines.push(`# HELP csi_ingestion_latency_ms Ingestion latency in milliseconds`);
      lines.push(`# TYPE csi_ingestion_latency_ms gauge`);
      lines.push(`csi_ingestion_latency_ms{source="${sourceId}"} ${latest.latency}`);
    }

    // Add health check metrics
    for (const [serviceId, check] of this.healthChecks) {
      const statusValue = check.status === 'healthy' ? 1 : check.status === 'degraded' ? 0.5 : 0;
      
      lines.push(`# HELP csi_service_health Service health status (1=healthy, 0.5=degraded, 0=unhealthy)`);
      lines.push(`# TYPE csi_service_health gauge`);
      lines.push(`csi_service_health{service="${serviceId}"} ${statusValue}`);

      lines.push(`# HELP csi_service_uptime Service uptime percentage`);
      lines.push(`# TYPE csi_service_uptime gauge`);
      lines.push(`csi_service_uptime{service="${serviceId}"} ${check.uptime}`);
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();