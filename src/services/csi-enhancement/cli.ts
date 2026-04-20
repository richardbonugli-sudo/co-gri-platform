#!/usr/bin/env node
/**
 * CSI Enhancement CLI
 * Command-line interface for running ingestion and monitoring
 */

import { IngestionOrchestrator } from './ingestion/IngestionOrchestrator';
import { MonitoringService } from './monitoring/MonitoringService';
import { SignalStorage } from './storage/SignalStorage';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'ingest':
      await runIngestion();
      break;
    case 'monitor':
      await showMonitoring();
      break;
    case 'stats':
      await showStatistics();
      break;
    case 'health':
      await checkHealth();
      break;
    default:
      showHelp();
  }
}

async function runIngestion() {
  console.log('🚀 Starting CSI Enhancement Ingestion...\n');

  const orchestrator = new IngestionOrchestrator();
  await orchestrator.initializeDefaultClients();

  const metrics = await orchestrator.runIngestion();

  console.log('\n📊 Ingestion Complete:');
  console.log(`   Signals Ingested: ${metrics.signalsIngested}`);
  console.log(`   Signals Parsed: ${metrics.signalsParsed}`);
  console.log(`   Signals Qualified: ${metrics.signalsQualified}`);
  console.log(`   Signals Rejected: ${metrics.signalsRejected}`);
  console.log(`   Errors: ${metrics.errors}`);
  console.log(`   Duration: ${metrics.duration}ms`);

  await orchestrator.close();
}

async function showMonitoring() {
  console.log('📈 CSI Enhancement System Metrics\n');

  const monitoring = new MonitoringService();
  const metrics = await monitoring.getSystemMetrics();

  console.log('Ingestion (Last 24 Hours):');
  console.log(`   Total: ${metrics.signalsIngested.last24Hours}`);
  console.log(`   Qualified: ${metrics.qualificationRate.qualified}`);
  console.log(`   Qualification Rate: ${metrics.qualificationRate.qualificationRate.toFixed(1)}%\n`);

  console.log('Geographic Coverage (Top 10):');
  metrics.countryCoverage.slice(0, 10).forEach(country => {
    console.log(`   ${country.country}: ${country.signalCount} signals`);
  });

  console.log('\nVector Distribution:');
  metrics.vectorDistribution.forEach(vector => {
    console.log(`   ${vector.vector}: ${vector.signalCount} signals (${vector.percentage.toFixed(1)}%)`);
  });

  console.log('\nPerformance:');
  console.log(`   Avg Ingestion Latency: ${metrics.performance.avgIngestionLatency}ms`);
  console.log(`   Avg Processing Time: ${metrics.performance.avgProcessingTime}ms`);
  console.log(`   Avg Storage Latency: ${metrics.performance.avgStorageLatency}ms`);
  console.log(`   System Uptime: ${metrics.performance.systemUptime.toFixed(2)}%`);

  const alerts = monitoring.getRecentAlerts(5);
  if (alerts.length > 0) {
    console.log('\n⚠️  Recent Alerts:');
    alerts.forEach(alert => {
      console.log(`   [${alert.severity.toUpperCase()}] ${alert.alertName}: ${alert.message}`);
    });
  }
}

async function showStatistics() {
  console.log('📊 Database Statistics\n');

  const storage = new SignalStorage();
  const stats = await storage.getStatistics();

  console.log(`Total Signals: ${stats.totalSignals}`);
  console.log(`Qualified Signals: ${stats.qualifiedSignals}`);
  console.log(`Qualification Rate: ${((stats.qualifiedSignals / stats.totalSignals) * 100).toFixed(1)}%\n`);

  console.log('Signals by Country (Top 10):');
  const topCountries = Object.entries(stats.signalsByCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  topCountries.forEach(([country, count]) => {
    console.log(`   ${country}: ${count}`);
  });

  console.log('\nSignals by Vector:');
  Object.entries(stats.signalsByVector).forEach(([vector, count]) => {
    console.log(`   ${vector}: ${count}`);
  });

  await storage.close();
}

async function checkHealth() {
  console.log('🏥 Health Check\n');

  const monitoring = new MonitoringService();
  const health = await monitoring.getHealthStatus();

  console.log(`Status: ${health.status.toUpperCase()}`);
  console.log(`Message: ${health.message}\n`);

  console.log('Checks:');
  Object.entries(health.checks).forEach(([check, status]) => {
    const icon = status ? '✅' : '❌';
    console.log(`   ${icon} ${check}`);
  });
}

function showHelp() {
  console.log(`
CSI Enhancement CLI

Usage:
  npm run csi-enhancement <command>

Commands:
  ingest    Run signal ingestion from all sources
  monitor   Show real-time system metrics
  stats     Show database statistics
  health    Check system health

Examples:
  npm run csi-enhancement ingest
  npm run csi-enhancement monitor
  npm run csi-enhancement stats
  npm run csi-enhancement health
  `);
}

// Run CLI
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});