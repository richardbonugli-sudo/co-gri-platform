#!/usr/bin/env node
/**
 * CSI Enhancement Phase 2 Scheduler
 * Runs both Phase 1 (ingestion) and Phase 2 (CSI calculation)
 */

import { IngestionOrchestrator } from './ingestion/IngestionOrchestrator';
import { CSIEngine } from './csi/CSIEngine';
import { MonitoringService } from './monitoring/MonitoringService';
import { config } from './config';

class Phase2Scheduler {
  private ingestionOrchestrator: IngestionOrchestrator;
  private csiEngine: CSIEngine;
  private monitoring: MonitoringService;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.ingestionOrchestrator = new IngestionOrchestrator();
    this.csiEngine = new CSIEngine();
    this.monitoring = new MonitoringService();
  }

  /**
   * Start scheduled operations
   */
  async start(): Promise<void> {
    console.log('🚀 CSI Enhancement Phase 2 Scheduler Starting...');
    console.log(`   Ingestion Interval: ${config.ingestion.intervalMinutes} minutes`);
    console.log(`   CSI Calculation: Daily at midnight`);
    console.log(`   Environment: ${config.system.nodeEnv}`);
    console.log('');

    // Initialize clients
    await this.ingestionOrchestrator.initializeDefaultClients();

    // Run initial operations
    await this.runIngestion();
    await this.runCSICalculation();

    // Schedule recurring ingestion (every 15 minutes)
    const ingestionIntervalMs = config.ingestion.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.runIngestion().catch(error => {
        console.error('❌ Scheduled ingestion failed:', error);
      });
    }, ingestionIntervalMs);

    // Schedule daily CSI calculation (at midnight)
    this.scheduleDailyCSICalculation();

    console.log('✅ Phase 2 Scheduler started successfully');
  }

  /**
   * Run Phase 1 ingestion
   */
  private async runIngestion(): Promise<void> {
    const startTime = new Date();
    console.log(`\n⏰ [${startTime.toISOString()}] Starting Phase 1 ingestion...`);

    try {
      const metrics = await this.ingestionOrchestrator.runIngestion();
      
      this.monitoring.recordIngestionMetrics(metrics);

      console.log('✅ Phase 1 ingestion complete:');
      console.log(`   Signals Ingested: ${metrics.signalsIngested}`);
      console.log(`   Signals Qualified: ${metrics.signalsQualified}`);
      console.log(`   Duration: ${metrics.duration}ms`);
    } catch (error) {
      console.error('❌ Phase 1 ingestion failed:', error);
    }
  }

  /**
   * Run Phase 2 CSI calculation
   */
  private async runCSICalculation(): Promise<void> {
    const startTime = new Date();
    console.log(`\n⏰ [${startTime.toISOString()}] Starting Phase 2 CSI calculation...`);

    try {
      const scores = await this.csiEngine.calculateEnhancedCSI();

      console.log('✅ Phase 2 CSI calculation complete:');
      console.log(`   Scores Calculated: ${scores.length}`);
      console.log(`   Countries: ${new Set(scores.map(s => s.country)).size}`);
      console.log(`   Vectors: ${new Set(scores.map(s => s.vector)).size}`);

      // Show top drifts
      const topDrifts = scores
        .sort((a, b) => Math.abs(b.baselineDrift) - Math.abs(a.baselineDrift))
        .slice(0, 5);

      console.log('\n   Top 5 Drifts:');
      topDrifts.forEach((score, i) => {
        const direction = score.baselineDrift > 0 ? '↑' : '↓';
        console.log(`   ${i + 1}. ${score.country} ${score.vector}: ${direction} ${Math.abs(score.baselineDrift).toFixed(1)} points`);
      });
    } catch (error) {
      console.error('❌ Phase 2 CSI calculation failed:', error);
    }
  }

  /**
   * Schedule daily CSI calculation
   */
  private scheduleDailyCSICalculation(): void {
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Schedule first calculation at midnight
    setTimeout(() => {
      this.runCSICalculation();

      // Then schedule daily
      setInterval(() => {
        this.runCSICalculation();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log(`   Next CSI calculation in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  }

  /**
   * Stop scheduler
   */
  async stop(): Promise<void> {
    console.log('\n🛑 Stopping Phase 2 scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    await this.ingestionOrchestrator.close();
    await this.csiEngine.close();
    
    console.log('✅ Phase 2 scheduler stopped');
  }
}

// Handle process signals
const scheduler = new Phase2Scheduler();

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
  console.error('❌ Failed to start Phase 2 scheduler:', error);
  process.exit(1);
});