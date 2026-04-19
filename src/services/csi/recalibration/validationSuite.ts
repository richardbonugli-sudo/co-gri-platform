/**
 * Validation Suite
 * 
 * Validates CSI v2.0 recalibration against known geopolitical events.
 * Ensures detection rate >90%, confirmation accuracy, and CSI impact correctness.
 * 
 * @module recalibration/validationSuite
 */

import { Pool } from 'pg';

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

  // Currency & Capital Controls
  {
    date: new Date('2024-03-20'),
    country: 'TUR',
    vector: 'SC7',
    description: 'Turkey central bank emergency rate hike to 50%',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 6.5,
    tolerance: 1.2,
    category: 'Currency'
  },
  {
    date: new Date('2024-08-05'),
    country: 'ARG',
    vector: 'SC7',
    description: 'Argentina implements strict capital controls',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 5.8,
    tolerance: 1.0,
    category: 'Currency'
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
  {
    date: new Date('2024-09-12'),
    country: 'CHN',
    vector: 'SC5',
    description: 'China expands data localization requirements',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 4.2,
    tolerance: 0.8,
    category: 'Cyber'
  },

  // Public Unrest
  {
    date: new Date('2024-01-25'),
    country: 'FRA',
    vector: 'SC6',
    description: 'Nationwide farmers protests in France',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 3.2,
    tolerance: 0.8,
    category: 'Unrest'
  },
  {
    date: new Date('2024-11-05'),
    country: 'KEN',
    vector: 'SC6',
    description: 'Kenya protests against tax increases',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 4.5,
    tolerance: 1.0,
    category: 'Unrest'
  },

  // Governance & Rule of Law
  {
    date: new Date('2024-06-09'),
    country: 'IND',
    vector: 'SC4',
    description: 'India general election results',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 2.8,
    tolerance: 0.8,
    category: 'Governance'
  },
  {
    date: new Date('2024-11-05'),
    country: 'USA',
    vector: 'SC4',
    description: 'US presidential election',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 3.5,
    tolerance: 1.0,
    category: 'Governance'
  },

  // Additional Events
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
  },
  {
    date: new Date('2024-04-03'),
    country: 'TWN',
    vector: 'SC1',
    description: 'Taiwan earthquake and geopolitical tensions',
    expectedDetection: true,
    expectedConfirmation: false, // Natural disaster, not geopolitical
    expectedCSIImpact: 2.0,
    tolerance: 0.5,
    category: 'Conflict'
  },
  {
    date: new Date('2024-05-20'),
    country: 'IRN',
    vector: 'SC4',
    description: 'Iran president helicopter crash',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 5.5,
    tolerance: 1.0,
    category: 'Governance'
  },
  {
    date: new Date('2024-07-28'),
    country: 'VEN',
    vector: 'SC4',
    description: 'Venezuela disputed election results',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 6.2,
    tolerance: 1.2,
    category: 'Governance'
  },
  {
    date: new Date('2024-08-08'),
    country: 'BGD',
    vector: 'SC6',
    description: 'Bangladesh PM resigns amid protests',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 7.5,
    tolerance: 1.5,
    category: 'Unrest'
  },
  {
    date: new Date('2024-09-27'),
    country: 'LBN',
    vector: 'SC1',
    description: 'Lebanon-Israel border escalation',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 6.5,
    tolerance: 1.2,
    category: 'Conflict'
  },
  {
    date: new Date('2024-10-26'),
    country: 'GEO',
    vector: 'SC4',
    description: 'Georgia disputed parliamentary election',
    expectedDetection: true,
    expectedConfirmation: true,
    expectedCSIImpact: 4.8,
    tolerance: 1.0,
    category: 'Governance'
  }
];

/**
 * Validation Suite
 */
export class ValidationSuite {
  private pool: Pool;
  private version: string;

  constructor(version: string = 'v2.0') {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
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

    return {
      event,
      detected,
      confirmed,
      actualImpact,
      impactError,
      passed
    };
  }

  /**
   * Check if event was detected
   */
  private async checkDetection(event: KnownEvent): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM event_candidates
        WHERE 
          target_country = $1 AND
          vector_primary = $2 AND
          DATE(detected_at) BETWEEN $3 AND $4 AND
          version = $5
      `, [
        event.country,
        event.vector,
        new Date(event.date.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
        new Date(event.date.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after
        this.version
      ]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if event was confirmed
   */
  private async checkConfirmation(event: KnownEvent): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as count
        FROM event_candidates
        WHERE 
          target_country = $1 AND
          vector_primary = $2 AND
          lifecycle_state = 'CONFIRMED' AND
          DATE(confirmed_at) BETWEEN $3 AND $4 AND
          version = $5
      `, [
        event.country,
        event.vector,
        event.date,
        new Date(event.date.getTime() + 7 * 24 * 60 * 60 * 1000), // Within 7 days
        this.version
      ]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get CSI impact for event
   */
  private async getCSIImpact(event: KnownEvent): Promise<number> {
    try {
      const result = await this.pool.query(`
        SELECT event_csi_delta
        FROM csi_time_series
        WHERE 
          country = $1 AND
          date = $2 AND
          csi_version = $3
      `, [event.country, event.date, this.version]);

      return parseFloat(result.rows[0]?.event_csi_delta || '0');
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate detailed validation report
   */
  async generateReport(report: ValidationReport): Promise<string> {
    let markdown = `# CSI v2.0 Validation Report\n\n`;
    markdown += `**Generated:** ${report.timestamp.toISOString()}\n\n`;
    markdown += `## Summary\n\n`;
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

    return markdown;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}