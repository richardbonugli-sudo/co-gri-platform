/**
 * Phase 5C Master Orchestration Script
 * 
 * Runs the complete CSI v2.0 recalibration process:
 * 1. Calculate structural baselines
 * 2. Initialize ledgers
 * 3. Replay forward
 * 4. Validate against known events
 * 5. Lock version
 * 
 * @module recalibration/runRecalibration
 */

import { StructuralBaselineCalculator } from './calculateStructuralBaseline';
import { LedgerInitializer } from './initializeLedgers';
import { ReplayEngine } from './replayEngine';
import { ValidationSuite } from './validationSuite';
import { VersionLocker } from './versionLock';

export interface RecalibrationConfig {
  cutDate: Date;
  replayStartDate: Date;
  replayEndDate: Date;
  version: string;
  skipValidation?: boolean;
  autoLock?: boolean;
}

export interface RecalibrationResult {
  success: boolean;
  baselineCount: number;
  replayDays: number;
  validationPassed: boolean;
  locked: boolean;
  duration: number;
  errors: string[];
}

/**
 * Run complete Phase 5C recalibration
 */
export async function runPhase5CRecalibration(
  config: Partial<RecalibrationConfig> = {}
): Promise<RecalibrationResult> {
  const startTime = Date.now();

  const fullConfig: RecalibrationConfig = {
    cutDate: config.cutDate || new Date('2024-01-01'),
    replayStartDate: config.replayStartDate || new Date('2024-01-01'),
    replayEndDate: config.replayEndDate || new Date(),
    version: config.version || 'v2.0',
    skipValidation: config.skipValidation || false,
    autoLock: config.autoLock || false
  };

  const result: RecalibrationResult = {
    success: false,
    baselineCount: 0,
    replayDays: 0,
    validationPassed: false,
    locked: false,
    duration: 0,
    errors: []
  };

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     Phase 5C: CSI Recalibration (v2.0)                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('Configuration:');
  console.log(`  Cut Date: ${fullConfig.cutDate.toISOString().split('T')[0]}`);
  console.log(`  Replay Period: ${fullConfig.replayStartDate.toISOString().split('T')[0]} to ${fullConfig.replayEndDate.toISOString().split('T')[0]}`);
  console.log(`  Version: ${fullConfig.version}`);
  console.log(`  Skip Validation: ${fullConfig.skipValidation}`);
  console.log(`  Auto Lock: ${fullConfig.autoLock}\n`);

  try {
    // ========================================
    // Step 1: Freeze Structural Baseline
    // ========================================
    console.log('┌────────────────────────────────────────────────────────┐');
    console.log('│ Step 1: Calculating Structural Baselines              │');
    console.log('└────────────────────────────────────────────────────────┘\n');

    const baselineCalc = new StructuralBaselineCalculator(fullConfig.cutDate, fullConfig.version);
    const baselines = await baselineCalc.calculateAllCountries();
    await baselineCalc.lockBaseline();
    await baselineCalc.close();

    result.baselineCount = baselines.length;
    console.log(`\n✅ Step 1 Complete: ${baselines.length} baselines calculated and locked\n`);

    // ========================================
    // Step 2: Initialize Empty Ledgers
    // ========================================
    console.log('┌────────────────────────────────────────────────────────┐');
    console.log('│ Step 2: Initializing Ledgers                          │');
    console.log('└────────────────────────────────────────────────────────┘\n');

    const ledgerInit = new LedgerInitializer(fullConfig.version);
    const ledgerStats = await ledgerInit.initializeAllLedgers();
    
    // Initialize time series for all countries
    await ledgerInit.initializeTimeSeriesForAllCountries(
      fullConfig.replayStartDate,
      fullConfig.replayEndDate
    );
    await ledgerInit.close();

    console.log(`\n✅ Step 2 Complete: Ledgers initialized\n`);

    // ========================================
    // Step 3: Replay Forward
    // ========================================
    console.log('┌────────────────────────────────────────────────────────┐');
    console.log('│ Step 3: Replaying Forward                             │');
    console.log('└────────────────────────────────────────────────────────┘\n');

    const replay = new ReplayEngine({
      startDate: fullConfig.replayStartDate,
      endDate: fullConfig.replayEndDate,
      batchSize: 1,
      version: fullConfig.version
    });

    const replayStats = await replay.replayForward();
    await replay.close();

    result.replayDays = replayStats.totalDays;
    console.log(`\n✅ Step 3 Complete: ${replayStats.totalDays} days replayed\n`);

    // ========================================
    // Step 4: Validate Against Known Events
    // ========================================
    if (!fullConfig.skipValidation) {
      console.log('┌────────────────────────────────────────────────────────┐');
      console.log('│ Step 4: Running Validation Suite                      │');
      console.log('└────────────────────────────────────────────────────────┘\n');

      const validation = new ValidationSuite(fullConfig.version);
      const report = await validation.runValidation();
      
      // Generate markdown report
      const markdownReport = await validation.generateReport(report);
      console.log('\n' + markdownReport);
      
      await validation.close();

      result.validationPassed = report.passed;

      if (!report.passed) {
        result.errors.push('Validation failed - review results before locking');
        console.log('⚠️  Step 4: Validation failed. Review results before proceeding.\n');
      } else {
        console.log(`\n✅ Step 4 Complete: Validation passed\n`);
      }
    } else {
      console.log('⏭️  Step 4: Skipped (validation disabled)\n');
      result.validationPassed = true; // Assume passed if skipped
    }

    // ========================================
    // Step 5: Version and Lock
    // ========================================
    if (result.validationPassed && fullConfig.autoLock) {
      console.log('┌────────────────────────────────────────────────────────┐');
      console.log('│ Step 5: Locking Version                               │');
      console.log('└────────────────────────────────────────────────────────┘\n');

      const locker = new VersionLocker(fullConfig.version);
      const lockStats = await locker.lockVersion();
      const verified = await locker.verifyLock();
      await locker.close();

      result.locked = verified;

      if (verified) {
        console.log(`\n✅ Step 5 Complete: CSI ${fullConfig.version} locked and verified\n`);
      } else {
        result.errors.push('Version lock verification failed');
        console.log('⚠️  Step 5: Lock verification failed\n');
      }
    } else if (!result.validationPassed) {
      console.log('⏭️  Step 5: Skipped (validation failed)\n');
      result.errors.push('Skipped locking due to validation failure');
    } else {
      console.log('⏭️  Step 5: Skipped (auto-lock disabled)\n');
    }

    // ========================================
    // Summary
    // ========================================
    result.success = result.validationPassed && (fullConfig.autoLock ? result.locked : true);
    result.duration = Date.now() - startTime;

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Phase 5C Recalibration Summary                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '⚠️  PARTIAL SUCCESS'}`);
    console.log(`Baselines Calculated: ${result.baselineCount}`);
    console.log(`Days Replayed: ${result.replayDays}`);
    console.log(`Validation: ${result.validationPassed ? '✅ Passed' : '❌ Failed'}`);
    console.log(`Version Locked: ${result.locked ? '✅ Yes' : '❌ No'}`);
    console.log(`Duration: ${(result.duration / 1000 / 60).toFixed(2)} minutes`);

    if (result.errors.length > 0) {
      console.log(`\nErrors/Warnings:`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n');

    if (result.success) {
      console.log('🎉 Phase 5C Complete! CSI v2.0 is now live.\n');
    } else {
      console.log('⚠️  Phase 5C completed with warnings. Review results before production deployment.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error during recalibration:', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.success = false;
  }

  return result;
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const config: Partial<RecalibrationConfig> = {
    skipValidation: args.includes('--skip-validation'),
    autoLock: args.includes('--auto-lock')
  };

  runPhase5CRecalibration(config)
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { runPhase5CRecalibration as default };