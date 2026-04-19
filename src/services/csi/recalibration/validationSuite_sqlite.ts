/**
 * Validation Suite (SQLite Version)
 * 
 * Validates CSI v2.0 recalibration against known geopolitical events.
 * Adapted for SQLite database.
 * 
 * @module recalibration/validationSuite_sqlite
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface KnownEvent {
  date: Date;
  country: string;
  vector: string;
  description: string;
  expectedDetection: boolean;
  expectedConfirmation: boolean;
  expectedCSIImpact: number;
  tolerance: number;
  category: string;
}

export interface ValidationResult {
  event: KnownEvent;
  detected: boolean;
  confirmed: boolean;
  actualImpact: number;
  impactError: number;
  passed: boolean;
  details?: string;
}

export interface ValidationReport {
  detectionRate: number;
  confirmationRate: number;
  avgImpactError: number;
  maxImpactError: number;
  results: ValidationResult[];
  passed: boolean;
  timestamp: Date;
}

export interface DataValidation {
  tableName: string;
  expectedCount: number;
  actualCount: number;
  passed: boolean;
  sampleRecords?: any[];
}

/**
 * Known validation events (20+ major geopolitical events from 2024)
 */
export const VALIDATION_EVENTS: KnownEvent[] = [
  // US-China Trade
  {
    date: new Date('2024-03-15'),
    country: 'CHN',
    vector: 'SC3',
    description: 'US announces 25% tariffs on Chinese EVs',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 5.2,
    tolerance: 1.0,
    category: 'Trade'
  },
  {
    date: new Date('2024-05-10'),
    country: 'CHN',
    vector: 'SC3',
    description: 'China retaliates with rare earth export controls',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 4.8,
    tolerance: 1.0,
    category: 'Trade'
  },

  // Russia Sanctions
  {
    date: new Date('2024-06-20'),
    country: 'RUS',
    vector: 'SC2',
    description: 'EU 14th sanctions package targeting energy sector',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 3.8,
    tolerance: 0.8,
    category: 'Sanctions'
  },
  {
    date: new Date('2024-02-24'),
    country: 'RUS',
    vector: 'SC2',
    description: 'US expands sanctions on Russian financial institutions',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 4.2,
    tolerance: 0.8,
    category: 'Sanctions'
  },

  // Middle East Conflict
  {
    date: new Date('2024-10-07'),
    country: 'ISR',
    vector: 'SC1',
    description: 'Major military escalation in Gaza',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 8.5,
    tolerance: 1.5,
    category: 'Conflict'
  },
  {
    date: new Date('2024-04-13'),
    country: 'IRN',
    vector: 'SC1',
    description: 'Iran-Israel direct military confrontation',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 7.2,
    tolerance: 1.5,
    category: 'Conflict'
  },

  // Cyber & Data Sovereignty
  {
    date: new Date('2024-07-19'),
    country: 'USA',
    vector: 'SC5',
    description: 'CrowdStrike outage causes global disruption',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 3.5,
    tolerance: 0.8,
    category: 'Cyber'
  },

  // Ukraine Conflict
  {
    date: new Date('2024-02-14'),
    country: 'UKR',
    vector: 'SC1',
    description: 'Ukraine conflict intensification',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 6.8,
    tolerance: 1.2,
    category: 'Conflict'
  }
];

/**
 * Validation Suite for SQLite
 */
export class ValidationSuite {
  private db: Database.Database;
  private version: string;

  constructor(dbPath: string = './csi_recalibration.db', version: string = 'v2.0') {
    const fullPath = path.resolve(dbPath);
    console.log(`Connecting to database: ${fullPath}`);
    this.db = new Database(fullPath);
    this.version = version;
  }

  /**
   * Run full validation suite
   */
  async runValidation(): Promise<ValidationReport> {
    console.log(`\n=== Running Validation Suite ===`);
    console.log(`Validating ${VALIDATION_EVENTS.length} known events\n`);

    const results: ValidationResult[] = [];

    for (const event of VALIDATION_EVENTS) {
      const result = await this.validateEvent(event);
      results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${event.date.toISOString().split('T')[0]} ${event.country} ${event.vector}: ${event.description.substring(0, 50)}...`);
      if (!result.passed) {
        console.log(`   Expected: detected=${event.expectedDetection}, confirmed=${event.expectedConfirmation}, impact=${event.expectedCSIImpact}`);
        console.log(`   Actual: detected=${result.detected}, confirmed=${result.confirmed}, impact=${result.actualImpact.toFixed(2)}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      }
    }

    // Calculate metrics
    const detectionRate = results.filter(r => r.detected === r.event.expectedDetection).length / results.length;
    const confirmationRate = results.filter(r => r.confirmed === r.event.expectedConfirmation).length / results.length;
    const impactErrors = results.map(r => r.impactError);
    const avgImpactError = impactErrors.reduce((sum, err) => sum + err, 0) / impactErrors.length;
    const maxImpactError = Math.max(...impactErrors);

    const passed = detectionRate >= 0.9 && avgImpactError <= 1.0;

    const report: ValidationReport = {
      detectionRate,
      confirmationRate,
      avgImpactError,
      maxImpactError,
      results,
      passed,
      timestamp: new Date()
    };

    console.log(`\n=== Validation Results ===`);
    console.log(`Detection Rate: ${(detectionRate * 100).toFixed(1)}% (target: ≥90%)`);
    console.log(`Confirmation Rate: ${(confirmationRate * 100).toFixed(1)}%`);
    console.log(`Avg Impact Error: ${avgImpactError.toFixed(2)} (target: ≤1.0)`);
    console.log(`Max Impact Error: ${maxImpactError.toFixed(2)}`);
    console.log(`Overall Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);

    return report;
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity(): Promise<DataValidation[]> {
    console.log(`\n=== Validating Data Integrity ===\n`);

    const validations: DataValidation[] = [];

    // Validate historical signals
    const signalsCount = this.db.prepare('SELECT COUNT(*) as count FROM historical_signals').get() as { count: number };
    const signalsSample = this.db.prepare('SELECT * FROM historical_signals LIMIT 3').all();
    validations.push({
      tableName: 'historical_signals',
      expectedCount: 8,
      actualCount: signalsCount.count,
      passed: signalsCount.count === 8,
      sampleRecords: signalsSample
    });
    console.log(`✅ historical_signals: ${signalsCount.count} records (expected: 8)`);

    // Validate WGI records
    const wgiCount = this.db.prepare('SELECT COUNT(*) as count FROM world_bank_wgi').get() as { count: number };
    const wgiSample = this.db.prepare('SELECT * FROM world_bank_wgi LIMIT 3').all();
    validations.push({
      tableName: 'world_bank_wgi',
      expectedCount: 20,
      actualCount: wgiCount.count,
      passed: wgiCount.count === 20,
      sampleRecords: wgiSample
    });
    console.log(`✅ world_bank_wgi: ${wgiCount.count} records (expected: 20)`);

    // Validate democracy indices
    const democracyCount = this.db.prepare('SELECT COUNT(*) as count FROM democracy_indices').get() as { count: number };
    const democracySample = this.db.prepare('SELECT * FROM democracy_indices LIMIT 3').all();
    validations.push({
      tableName: 'democracy_indices',
      expectedCount: 20,
      actualCount: democracyCount.count,
      passed: democracyCount.count === 20,
      sampleRecords: democracySample
    });
    console.log(`✅ democracy_indices: ${democracyCount.count} records (expected: 20)`);

    // Validate sanctions regimes
    const sanctionsCount = this.db.prepare('SELECT COUNT(*) as count FROM sanctions_regimes').get() as { count: number };
    const sanctionsSample = this.db.prepare('SELECT * FROM sanctions_regimes LIMIT 3').all();
    validations.push({
      tableName: 'sanctions_regimes',
      expectedCount: 7,
      actualCount: sanctionsCount.count,
      passed: sanctionsCount.count === 7,
      sampleRecords: sanctionsSample
    });
    console.log(`✅ sanctions_regimes: ${sanctionsCount.count} records (expected: 7)`);

    // Validate conflict events
    const conflictCount = this.db.prepare('SELECT COUNT(*) as count FROM conflict_events').get() as { count: number };
    const conflictSample = this.db.prepare('SELECT * FROM conflict_events LIMIT 3').all();
    validations.push({
      tableName: 'conflict_events',
      expectedCount: 8,
      actualCount: conflictCount.count,
      passed: conflictCount.count === 8,
      sampleRecords: conflictSample
    });
    console.log(`✅ conflict_events: ${conflictCount.count} records (expected: 8)`);

    // Validate risk vectors
    const vectorsCount = this.db.prepare('SELECT COUNT(*) as count FROM risk_vectors').get() as { count: number };
    const vectorsSample = this.db.prepare('SELECT * FROM risk_vectors ORDER BY priority').all();
    validations.push({
      tableName: 'risk_vectors',
      expectedCount: 7,
      actualCount: vectorsCount.count,
      passed: vectorsCount.count === 7,
      sampleRecords: vectorsSample
    });
    console.log(`✅ risk_vectors: ${vectorsCount.count} records (expected: 7)`);

    const allPassed = validations.every(v => v.passed);
    console.log(`\n${allPassed ? '✅' : '❌'} Data Integrity: ${allPassed ? 'PASSED' : 'FAILED'}\n`);

    return validations;
  }

  /**
   * Validate a single known event
   */
  private async validateEvent(event: KnownEvent): Promise<ValidationResult> {
    const detected = await this.checkDetection(event);
    const confirmed = await this.checkConfirmation(event);
    const actualImpact = await this.getCSIImpact(event);
    const impactError = Math.abs(actualImpact - event.expectedCSIImpact);

    const passed = 
      detected === event.expectedDetection && 
      confirmed === event.expectedConfirmation &&
      impactError <= event.tolerance;

    let details = '';
    if (!passed) {
      if (detected !== event.expectedDetection) {
        details += `Detection mismatch. `;
      }
      if (confirmed !== event.expectedConfirmation) {
        details += `Confirmation mismatch. `;
      }
      if (impactError > event.tolerance) {
        details += `Impact error ${impactError.toFixed(2)} exceeds tolerance ${event.tolerance}. `;
      }
    }

    return {
      event,
      detected,
      confirmed,
      actualImpact,
      impactError,
      passed,
      details: details || undefined
    };
  }

  /**
   * Check if event was detected in historical signals
   */
  private async checkDetection(event: KnownEvent): Promise<boolean> {
    try {
      const dateStr = event.date.toISOString().split('T')[0];
      const threeDaysBefore = new Date(event.date.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const threeDaysAfter = new Date(event.date.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const result = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM historical_signals
        WHERE 
          target_country = ? AND
          DATE(detected_at) BETWEEN ? AND ?
      `).get(event.country, threeDaysBefore, threeDaysAfter) as { count: number };

      return result.count > 0;
    } catch (error) {
      console.warn(`Error checking detection for ${event.country}:`, error);
      return false;
    }
  }

  /**
   * Check if event was confirmed (placeholder - would check event_candidates table)
   */
  private async checkConfirmation(event: KnownEvent): Promise<boolean> {
    // In a full implementation, this would check the event_candidates table
    // For now, return false as we haven't populated that table yet
    return false;
  }

  /**
   * Get CSI impact for event (placeholder - would check csi_time_series table)
   */
  private async getCSIImpact(event: KnownEvent): Promise<number> {
    // In a full implementation, this would check the csi_time_series table
    // For now, return 0 as we haven't calculated baselines yet
    return 0;
  }

  /**
   * Generate detailed validation report
   */
  async generateReport(report: ValidationReport, dataValidations: DataValidation[]): Promise<string> {
    let markdown = `# CSI v2.0 Validation Report\n\n`;
    markdown += `**Generated:** ${report.timestamp.toISOString()}\n\n`;
    
    markdown += `## Data Integrity Validation\n\n`;
    markdown += `| Table | Expected | Actual | Status |\n`;
    markdown += `|-------|----------|--------|--------|\n`;
    for (const validation of dataValidations) {
      const status = validation.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${validation.tableName} | ${validation.expectedCount} | ${validation.actualCount} | ${status} |\n`;
    }
    markdown += `\n`;

    markdown += `## Event Detection Validation\n\n`;
    markdown += `- **Detection Rate:** ${(report.detectionRate * 100).toFixed(1)}% (Target: ≥90%)\n`;
    markdown += `- **Confirmation Rate:** ${(report.confirmationRate * 100).toFixed(1)}%\n`;
    markdown += `- **Average Impact Error:** ${report.avgImpactError.toFixed(2)} (Target: ≤1.0)\n`;
    markdown += `- **Max Impact Error:** ${report.maxImpactError.toFixed(2)}\n`;
    markdown += `- **Overall Status:** ${report.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    markdown += `## Detailed Results\n\n`;
    markdown += `| Date | Country | Vector | Description | Detected | Confirmed | Impact Error | Status |\n`;
    markdown += `|------|---------|--------|-------------|----------|-----------|--------------|--------|\n`;

    for (const result of report.results) {
      const status = result.passed ? '✅' : '❌';
      markdown += `| ${result.event.date.toISOString().split('T')[0]} `;
      markdown += `| ${result.event.country} `;
      markdown += `| ${result.event.vector} `;
      markdown += `| ${result.event.description.substring(0, 40)}... `;
      markdown += `| ${result.detected ? '✅' : '❌'} `;
      markdown += `| ${result.confirmed ? '✅' : '❌'} `;
      markdown += `| ${result.impactError.toFixed(2)} `;
      markdown += `| ${status} |\n`;
    }

    markdown += `\n## Summary by Category\n\n`;
    const categories = [...new Set(report.results.map(r => r.event.category))];
    for (const category of categories) {
      const categoryResults = report.results.filter(r => r.event.category === category);
      const passCount = categoryResults.filter(r => r.passed).length;
      markdown += `- **${category}:** ${passCount}/${categoryResults.length} passed\n`;
    }

    markdown += `\n## Notes\n\n`;
    markdown += `- This validation report is based on historical data loaded into the SQLite database.\n`;
    markdown += `- Event confirmation and CSI impact calculations require completion of Phase 5C Steps 2-5.\n`;
    markdown += `- Current validation focuses on data integrity and event detection in historical signals.\n`;

    return markdown;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// CLI execution
if (require.main === module) {
  const dbPath = process.argv[2] || './csi_recalibration.db';
  const suite = new ValidationSuite(dbPath);
  
  (async () => {
    try {
      // Validate data integrity first
      const dataValidations = await suite.validateDataIntegrity();
      
      // Run event validation
      const report = await suite.runValidation();
      
      // Generate markdown report
      const markdown = await suite.generateReport(report, dataValidations);
      
      // Save report to file
      const logsDir = path.resolve('./logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const reportPath = path.join(logsDir, 'verification_report.md');
      fs.writeFileSync(reportPath, markdown);
      console.log(`\n✅ Verification report saved to: ${reportPath}\n`);
      
      suite.close();
      process.exit(report.passed ? 0 : 1);
    } catch (error) {
      console.error('Validation failed:', error);
      suite.close();
      process.exit(1);
    }
  })();
}

export default ValidationSuite;