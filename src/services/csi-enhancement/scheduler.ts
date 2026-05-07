#!/usr/bin/env node
/**
 * CSI Enhancement Scheduler
 * Runs ingestion on a schedule
 */

import { IngestionOrchestrator } from './ingestion/IngestionOrchestrator';
import { MonitoringService } from './monitoring/MonitoringService';
import { config } from './config';

class Scheduler {
  private orchestrator: IngestionOrchestrator;
  private monitoring: MonitoringService;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.orchestrator = new IngestionOrchestrator();
    this.monitoring = new MonitoringService();
  }

  /**
   * Start scheduled ingestion
   */
  async start(): Promise<void> {
    console.log('🚀 CSI Enhancement Scheduler Starting...');
    console.log(`   Interval: ${config.ingestion.intervalMinutes} minutes`);
    console.log(`   Environment: ${config.system.nodeEnv}`);
    console.log('');

    // Initialize clients
    await this.orchestrator.initializeDefaultClients();

    // Run initial ingestion
    await this.runIngestion();

    // Schedule recurring ingestion
    const intervalMs = config.ingestion.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runIngestion().catch(error => {
        console.error('❌ Scheduled ingestion failed:', error);
      });
    }, intervalMs);

    console.log('✅ Scheduler started successfully');
    console.log(`   Next run in ${config.ingestion.intervalMinutes} minutes`);
  }

  /**
   * Run ingestion
   */
  private async runIngestion(): Promise<void> {
    const startTime = new Date();
    console.log(`\n⏰ [${startTime.toISOString()}] Starting scheduled ingestion...`);

    try {
      const metrics = await this.orchestrator.runIngestion();
      
      // Record metrics
      this.monitoring.recordIngestionMetrics(metrics);

      // Log summary
      console.log('✅ Ingestion complete:');
      console.log(`   Signals Ingested: ${metrics.signalsIngested}`);
      console.log(`   Signals Qualified: ${metrics.signalsQualified}`);
      console.log(`   Qualification Rate: ${((metrics.signalsQualified / metrics.signalsParsed) * 100).toFixed(1)}%`);
      console.log(`   Duration: ${metrics.duration}ms`);

      // Check for alerts
      const alerts = this.monitoring.getRecentAlerts(5);
      if (alerts.length > 0) {
        console.log('\n⚠️  Recent Alerts:');
        alerts.forEach(alert => {
          console.log(`   [${alert.severity.toUpperCase()}] ${alert.alertName}`);
        });
      }
    } catch (error) {
      console.error('❌ Ingestion failed:', error);
      
      // Send alert
      if (config.monitoring.slackWebhook) {
        await this.sendSlackAlert('Ingestion Failed', error as Error);
      }
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(title: string, error: Error): Promise<void> {
    if (!config.monitoring.slackWebhook) return;

    try {
      await fetch(config.monitoring.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 CSI Enhancement Alert: ${title}`,
          attachments: [{
            color: 'danger',
            fields: [{
              title: 'Error',
              value: error.message,
              short: false
            }, {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }]
          }]
        })
      });
    } catch (err) {
      console.error('Failed to send Slack alert:', err);
    }
  }

  /**
   * Stop scheduler
   */
  async stop(): Promise<void> {
    console.log('\n🛑 Stopping scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    await this.orchestrator.close();
    console.log('✅ Scheduler stopped');
  }
}

// Handle process signals
const scheduler = new Scheduler();

process.on('SIGTERM', async () => {
  await scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await scheduler.stop();
  process.exit(0);
});

// Start scheduler
scheduler.start().catch(error => {
  console.error('❌ Failed to start scheduler:', error);
  process.exit(1);
});