#!/usr/bin/env node
/**
 * CSI Enhancement Phase 2 CLI
 * Command-line interface for enhanced CSI operations
 */

import { CSIEngine } from './csi/CSIEngine';
import { BacktestingEngine } from './backtesting/BacktestingEngine';
import { CSIRouter } from './api/CSIRouter';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'calculate':
      await calculateCSI();
      break;
    case 'compare':
      await compareCSI();
      break;
    case 'backtest':
      await runBacktest();
      break;
    case 'explain':
      await explainCSI();
      break;
    case 'stats':
      await showStatistics();
      break;
    default:
      showHelp();
  }
}

async function calculateCSI() {
  console.log('🚀 Calculating Enhanced CSI...\n');

  const engine = new CSIEngine();
  const startTime = Date.now();

  try {
    const scores = await engine.calculateEnhancedCSI();
    const duration = Date.now() - startTime;

    console.log('✅ Calculation Complete:');
    console.log(`   Scores Calculated: ${scores.length}`);
    console.log(`   Countries: ${new Set(scores.map(s => s.country)).size}`);
    console.log(`   Vectors: ${new Set(scores.map(s => s.vector)).size}`);
    console.log(`   Duration: ${duration}ms\n`);

    // Show top drifts
    const topDrifts = scores
      .sort((a, b) => Math.abs(b.baselineDrift) - Math.abs(a.baselineDrift))
      .slice(0, 10);

    console.log('Top 10 Drifts:');
    topDrifts.forEach((score, i) => {
      const direction = score.baselineDrift > 0 ? '↑' : '↓';
      console.log(`   ${i + 1}. ${score.country} ${score.vector}: ${direction} ${Math.abs(score.baselineDrift).toFixed(1)} points`);
    });

    await engine.close();
  } catch (error) {
    console.error('❌ Calculation failed:', error);
    process.exit(1);
  }
}

async function compareCSI() {
  console.log('📊 Comparing Legacy vs Enhanced CSI...\n');

  const router = new CSIRouter();

  try {
    const result = await router.getComparison();

    if (!result.success) {
      console.error('❌ Comparison failed:', result.error);
      process.exit(1);
    }

    const comparison = result.data;

    console.log(`Found ${comparison.length} country-vector pairs\n`);

    // Group by divergence level
    const significant = comparison.filter((c: any) => c.divergenceLevel === 'significant');
    const moderate = comparison.filter((c: any) => c.divergenceLevel === 'moderate');
    const minor = comparison.filter((c: any) => c.divergenceLevel === 'minor');

    console.log('Divergence Summary:');
    console.log(`   Significant (>5 points): ${significant.length}`);
    console.log(`   Moderate (2-5 points): ${moderate.length}`);
    console.log(`   Minor (<2 points): ${minor.length}\n`);

    // Show significant divergences
    if (significant.length > 0) {
      console.log('Significant Divergences:');
      significant.slice(0, 10).forEach((c: any) => {
        const direction = c.baselineDrift > 0 ? '↑' : '↓';
        console.log(`   ${c.country} ${c.vector}: Legacy ${c.legacyCSI.toFixed(1)} → Enhanced ${c.enhancedCSI.toFixed(1)} (${direction} ${Math.abs(c.baselineDrift).toFixed(1)})`);
      });
    }

    await router.close();
  } catch (error) {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
  }
}

async function runBacktest() {
  console.log('🔬 Running Backtest...\n');

  const engine = new BacktestingEngine();

  try {
    // Default: backtest last 90 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    console.log(`Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);

    const result = await engine.runBacktest(startDate, endDate);

    console.log('📊 Backtest Results:\n');

    console.log('Metrics:');
    console.log(`   Countries: ${result.metrics.totalCountries}`);
    console.log(`   Vectors: ${result.metrics.totalVectors}`);
    console.log(`   Calculations: ${result.metrics.totalCalculations}`);
    console.log(`   Avg Drift: ${result.metrics.avgDrift.toFixed(2)} points\n`);

    console.log('Performance:');
    console.log(`   Legacy Accuracy: ${(result.performance.legacyAccuracy * 100).toFixed(1)}%`);
    console.log(`   Enhanced Accuracy: ${(result.performance.enhancedAccuracy * 100).toFixed(1)}%`);
    console.log(`   Improvement: +${(result.performance.improvement * 100).toFixed(1)} percentage points`);
    console.log(`   Improvement %: +${result.performance.improvementPercentage.toFixed(1)}%\n`);

    console.log('Example Predictions:');
    result.examples.forEach((ex, i) => {
      console.log(`   ${i + 1}. ${ex.country} ${ex.vector}:`);
      console.log(`      Legacy: ${ex.legacyCSI.toFixed(1)} (error: ${ex.legacyError.toFixed(1)})`);
      console.log(`      Enhanced: ${ex.enhancedCSI.toFixed(1)} (error: ${ex.enhancedError.toFixed(1)})`);
      console.log(`      Actual: ${ex.actualOutcome.toFixed(1)}`);
    });

    // Generate report
    const report = engine.generateReport(result);
    console.log('\n📄 Full report saved to backtest_report.md');

    const fs = require('fs');
    fs.writeFileSync('backtest_report.md', report);

    await engine.close();
  } catch (error) {
    console.error('❌ Backtest failed:', error);
    process.exit(1);
  }
}

async function explainCSI() {
  const country = process.argv[3];
  const vector = process.argv[4];

  if (!country || !vector) {
    console.error('Usage: npm run csi:explain <country> <vector>');
    console.error('Example: npm run csi:explain US SC1');
    process.exit(1);
  }

  console.log(`📖 Explaining ${country} ${vector} CSI...\n`);

  const router = new CSIRouter();

  try {
    const result = await router.getExplanation(country, vector);

    if (!result.success) {
      console.error('❌ Explanation failed:', result.error);
      process.exit(1);
    }

    const data = result.data;

    console.log('Score Summary:');
    console.log(`   Legacy CSI: ${data.legacyCSI.toFixed(1)}`);
    console.log(`   Baseline Drift: ${data.baselineDrift >= 0 ? '+' : ''}${data.baselineDrift.toFixed(1)}`);
    console.log(`   Enhanced CSI: ${data.enhancedCSI.toFixed(1)}\n`);

    console.log('Contributing Signals:');
    data.contributions.forEach((contrib: any, i: number) => {
      if (contrib.signalId) {
        console.log(`   ${i + 1}. ${contrib.headline || 'Signal ' + contrib.signalId}`);
        console.log(`      Impact: ${contrib.impactScore.toFixed(2)}`);
        console.log(`      Decay: ${(contrib.decayFactor * 100).toFixed(1)}%`);
        console.log(`      Contribution: ${contrib.contribution >= 0 ? '+' : ''}${contrib.contribution.toFixed(2)}`);
      }
    });

    await router.close();
  } catch (error) {
    console.error('❌ Explanation failed:', error);
    process.exit(1);
  }
}

async function showStatistics() {
  console.log('📈 Enhanced CSI Statistics\n');

  const router = new CSIRouter();

  try {
    const statsResult = await router.getStatistics();
    const vectorResult = await router.getDriftByVector();
    const countryResult = await router.getDriftByCountry();

    if (!statsResult.success) {
      console.error('❌ Failed to get statistics:', statsResult.error);
      process.exit(1);
    }

    const stats = statsResult.data;

    console.log('Overall Statistics:');
    console.log(`   Total Countries: ${stats.total_countries}`);
    console.log(`   Total Vectors: ${stats.total_vectors}`);
    console.log(`   Total Scores: ${stats.total_scores}`);
    console.log(`   Avg Drift: ${parseFloat(stats.avg_drift).toFixed(2)} points`);
    console.log(`   Max Drift: ${parseFloat(stats.max_drift).toFixed(2)} points`);
    console.log(`   Min Drift: ${parseFloat(stats.min_drift).toFixed(2)} points`);
    console.log(`   Avg Signals/Score: ${parseFloat(stats.avg_signal_count).toFixed(1)}\n`);

    console.log('Drift by Vector:');
    vectorResult.data.forEach((v: any) => {
      console.log(`   ${v.vector}: avg ${parseFloat(v.avg_drift).toFixed(2)}, max ${parseFloat(v.max_drift).toFixed(2)}, countries ${v.country_count}`);
    });

    console.log('\nTop 10 Countries by Drift:');
    countryResult.data.slice(0, 10).forEach((c: any, i: number) => {
      console.log(`   ${i + 1}. ${c.country}: avg ${parseFloat(c.avg_drift).toFixed(2)}, max ${parseFloat(c.max_drift).toFixed(2)}`);
    });

    await router.close();
  } catch (error) {
    console.error('❌ Statistics failed:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
CSI Enhancement Phase 2 CLI

Usage:
  npm run csi:calculate    Calculate enhanced CSI for all countries
  npm run csi:compare      Compare legacy vs enhanced CSI
  npm run csi:backtest     Run historical validation
  npm run csi:explain      Get detailed explanation for country-vector
  npm run csi:stats        Show system statistics

Examples:
  npm run csi:calculate
  npm run csi:compare
  npm run csi:backtest
  npm run csi:explain US SC1
  npm run csi:stats
  `);
}

// Run CLI
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});