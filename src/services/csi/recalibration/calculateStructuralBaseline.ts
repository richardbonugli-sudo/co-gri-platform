/**
 * Structural Baseline Calculator
 * 
 * Calculates the static baseline CSI for all countries as of a cut date (January 1, 2024)
 * based on slow-moving structural indicators.
 * 
 * Components:
 * - Governance (World Bank WGI) - 20%
 * - Rule of Law (World Justice Project) - 15%
 * - Democracy (Freedom House + V-Dem) - 15%
 * - Sanctions (Standing regimes) - 15%
 * - Capital Controls (IMF AREAER) - 10%
 * - Conflict History (UCDP, ACLED) - 15%
 * - Cyber Sovereignty (Freedom on the Net) - 10%
 * 
 * @module recalibration/calculateStructuralBaseline
 */

import { Pool } from 'pg';

export interface StructuralBaselineComponents {
  governance: number;        // World Bank WGI (0-100)
  ruleOfLaw: number;         // World Justice Project (0-100)
  democracy: number;         // Freedom House + V-Dem (0-100)
  sanctions: number;         // Standing sanctions regimes (0-100)
  capitalControls: number;   // IMF AREAER (0-100)
  conflictHistory: number;   // UCDP, ACLED baselines (0-100)
  cyberSovereignty: number;  // Freedom on the Net (0-100)
}

export interface StructuralBaseline {
  country: string;
  cutDate: Date;
  components: StructuralBaselineComponents;
  baselineCSI: number;
  version: string;
  metadata?: {
    dataQuality: string;
    lastUpdated: Date;
    sources: string[];
  };
}

export interface BaselineCalculationStats {
  totalCountries: number;
  successfulCalculations: number;
  failedCalculations: number;
  averageBaselineCSI: number;
  minBaselineCSI: number;
  maxBaselineCSI: number;
  duration: number;
}

/**
 * Structural Baseline Calculator
 */
export class StructuralBaselineCalculator {
  private pool: Pool;
  private cutDate: Date;
  private version: string;

  // Component weights (must sum to 1.0)
  private readonly WEIGHTS = {
    governance: 0.20,
    ruleOfLaw: 0.15,
    democracy: 0.15,
    sanctions: 0.15,
    capitalControls: 0.10,
    conflictHistory: 0.15,
    cyberSovereignty: 0.10
  };

  constructor(cutDate: Date = new Date('2024-01-01'), version: string = 'v2.0') {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.cutDate = cutDate;
    this.version = version;
  }

  /**
   * Calculate baseline for all countries
   */
  async calculateAllCountries(): Promise<StructuralBaseline[]> {
    const startTime = Date.now();
    console.log(`Calculating structural baselines for cut date: ${this.cutDate.toISOString().split('T')[0]}`);

    const countries = await this.getCountryList();
    console.log(`Found ${countries.length} countries to process`);

    const baselines: StructuralBaseline[] = [];
    const errors: string[] = [];

    for (const country of countries) {
      try {
        const baseline = await this.calculateCountryBaseline(country);
        baselines.push(baseline);

        // Store in database
        await this.storeBaseline(baseline);

        if (baselines.length % 20 === 0) {
          console.log(`  Progress: ${baselines.length}/${countries.length} countries processed`);
        }
      } catch (error) {
        console.error(`Failed to calculate baseline for ${country}:`, error);
        errors.push(country);
      }
    }

    const duration = Date.now() - startTime;

    // Calculate statistics
    const stats: BaselineCalculationStats = {
      totalCountries: countries.length,
      successfulCalculations: baselines.length,
      failedCalculations: errors.length,
      averageBaselineCSI: baselines.reduce((sum, b) => sum + b.baselineCSI, 0) / baselines.length,
      minBaselineCSI: Math.min(...baselines.map(b => b.baselineCSI)),
      maxBaselineCSI: Math.max(...baselines.map(b => b.baselineCSI)),
      duration
    };

    console.log('\nBaseline Calculation Summary:');
    console.log(`  Total Countries: ${stats.totalCountries}`);
    console.log(`  Successful: ${stats.successfulCalculations}`);
    console.log(`  Failed: ${stats.failedCalculations}`);
    console.log(`  Average Baseline CSI: ${stats.averageBaselineCSI.toFixed(2)}`);
    console.log(`  Range: ${stats.minBaselineCSI.toFixed(2)} - ${stats.maxBaselineCSI.toFixed(2)}`);
    console.log(`  Duration: ${(stats.duration / 1000).toFixed(2)}s`);

    if (errors.length > 0) {
      console.log(`  Failed countries: ${errors.join(', ')}`);
    }

    return baselines;
  }

  /**
   * Calculate baseline for a single country
   */
  async calculateCountryBaseline(country: string): Promise<StructuralBaseline> {
    // Fetch slow-moving indicators as of cut date
    const components: StructuralBaselineComponents = {
      governance: await this.fetchGovernanceScore(country, this.cutDate),
      ruleOfLaw: await this.fetchRuleOfLawScore(country, this.cutDate),
      democracy: await this.fetchDemocracyScore(country, this.cutDate),
      sanctions: await this.fetchSanctionsScore(country, this.cutDate),
      capitalControls: await this.fetchCapitalControlsScore(country, this.cutDate),
      conflictHistory: await this.fetchConflictScore(country, this.cutDate),
      cyberSovereignty: await this.fetchCyberScore(country, this.cutDate)
    };

    // Calculate weighted average
    const baselineCSI = this.calculateWeightedAverage(components);

    return {
      country,
      cutDate: this.cutDate,
      components,
      baselineCSI,
      version: this.version,
      metadata: {
        dataQuality: this.assessDataQuality(components),
        lastUpdated: new Date(),
        sources: [
          'World Bank WGI',
          'World Justice Project',
          'Freedom House',
          'V-Dem',
          'OFAC/EU/UN Sanctions',
          'IMF AREAER',
          'UCDP',
          'ACLED',
          'Freedom on the Net'
        ]
      }
    };
  }

  /**
   * Calculate weighted average of components
   */
  private calculateWeightedAverage(components: StructuralBaselineComponents): number {
    return (
      components.governance * this.WEIGHTS.governance +
      components.ruleOfLaw * this.WEIGHTS.ruleOfLaw +
      components.democracy * this.WEIGHTS.democracy +
      components.sanctions * this.WEIGHTS.sanctions +
      components.capitalControls * this.WEIGHTS.capitalControls +
      components.conflictHistory * this.WEIGHTS.conflictHistory +
      components.cyberSovereignty * this.WEIGHTS.cyberSovereignty
    );
  }

  /**
   * Fetch governance score (World Bank WGI)
   */
  private async fetchGovernanceScore(country: string, cutDate: Date): Promise<number> {
    // Query World Bank Worldwide Governance Indicators
    // Composite of: Voice & Accountability, Political Stability, Government Effectiveness,
    // Regulatory Quality, Rule of Law, Control of Corruption
    // Returns normalized score 0-100 (higher = better governance = lower risk)

    try {
      const result = await this.pool.query(`
        SELECT governance_score
        FROM world_bank_wgi
        WHERE country_code = $1 AND year = EXTRACT(YEAR FROM $2::date)
        LIMIT 1
      `, [country, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].governance_score;
      }
    } catch (error) {
      console.warn(`WGI data not found for ${country}, using default`);
    }

    // Default: moderate governance (50)
    return 50;
  }

  /**
   * Fetch rule of law score (World Justice Project)
   */
  private async fetchRuleOfLawScore(country: string, cutDate: Date): Promise<number> {
    try {
      const result = await this.pool.query(`
        SELECT rule_of_law_score
        FROM wjp_rule_of_law
        WHERE country_code = $1 AND year = EXTRACT(YEAR FROM $2::date)
        LIMIT 1
      `, [country, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].rule_of_law_score;
      }
    } catch (error) {
      console.warn(`WJP data not found for ${country}, using default`);
    }

    return 50;
  }

  /**
   * Fetch democracy score (Freedom House + V-Dem average)
   */
  private async fetchDemocracyScore(country: string, cutDate: Date): Promise<number> {
    try {
      const result = await this.pool.query(`
        SELECT 
          (freedom_house_score + vdem_score) / 2 as democracy_score
        FROM democracy_indices
        WHERE country_code = $1 AND year = EXTRACT(YEAR FROM $2::date)
        LIMIT 1
      `, [country, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].democracy_score;
      }
    } catch (error) {
      console.warn(`Democracy data not found for ${country}, using default`);
    }

    return 50;
  }

  /**
   * Fetch sanctions regime score
   */
  private async fetchSanctionsScore(country: string, cutDate: Date): Promise<number> {
    // Check if country is under sanctions from OFAC, EU, UN, etc.
    // Returns 0-100 (0 = no sanctions, 100 = comprehensive sanctions)

    try {
      const result = await this.pool.query(`
        SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            WHEN MAX(severity) = 'comprehensive' THEN 100
            WHEN MAX(severity) = 'sectoral' THEN 60
            ELSE 30
          END as sanctions_score
        FROM sanctions_regimes
        WHERE 
          target_country = $1 AND
          effective_date <= $2 AND
          (expiry_date IS NULL OR expiry_date > $2)
      `, [country, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].sanctions_score;
      }
    } catch (error) {
      console.warn(`Sanctions data not found for ${country}, using default`);
    }

    return 0; // No sanctions by default
  }

  /**
   * Fetch capital controls score (IMF AREAER)
   */
  private async fetchCapitalControlsScore(country: string, cutDate: Date): Promise<number> {
    // IMF Annual Report on Exchange Arrangements and Exchange Restrictions
    // Returns 0-100 (0 = open capital account, 100 = strict controls)

    try {
      const result = await this.pool.query(`
        SELECT capital_controls_index
        FROM imf_areaer
        WHERE country_code = $1 AND year = EXTRACT(YEAR FROM $2::date)
        LIMIT 1
      `, [country, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].capital_controls_index;
      }
    } catch (error) {
      console.warn(`AREAER data not found for ${country}, using default`);
    }

    return 20; // Moderate controls by default
  }

  /**
   * Fetch conflict history score (UCDP, ACLED)
   */
  private async fetchConflictScore(country: string, cutDate: Date): Promise<number> {
    // Based on conflict intensity over past 5 years
    // Returns 0-100 (0 = no conflict, 100 = active war)

    try {
      const fiveYearsAgo = new Date(cutDate);
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      const result = await this.pool.query(`
        SELECT 
          CASE 
            WHEN MAX(intensity) >= 1000 THEN 100  -- War (>1000 deaths/year)
            WHEN MAX(intensity) >= 100 THEN 60    -- Armed conflict (100-1000 deaths)
            WHEN MAX(intensity) >= 25 THEN 30     -- Minor conflict (25-100 deaths)
            ELSE 10                                -- Low-level violence
          END as conflict_score
        FROM conflict_events
        WHERE 
          country_code = $1 AND
          event_date BETWEEN $2 AND $3
      `, [country, fiveYearsAgo, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].conflict_score;
      }
    } catch (error) {
      console.warn(`Conflict data not found for ${country}, using default`);
    }

    return 10; // Low-level baseline
  }

  /**
   * Fetch cyber sovereignty score (Freedom on the Net)
   */
  private async fetchCyberScore(country: string, cutDate: Date): Promise<number> {
    // Freedom House "Freedom on the Net" index
    // Returns 0-100 (0 = free internet, 100 = no internet freedom)

    try {
      const result = await this.pool.query(`
        SELECT internet_freedom_score
        FROM freedom_on_the_net
        WHERE country_code = $1 AND year = EXTRACT(YEAR FROM $2::date)
        LIMIT 1
      `, [country, cutDate]);

      if (result.rows.length > 0) {
        return result.rows[0].internet_freedom_score;
      }
    } catch (error) {
      console.warn(`Internet freedom data not found for ${country}, using default`);
    }

    return 30; // Moderate restrictions by default
  }

  /**
   * Get list of all countries (ISO 3-letter codes)
   */
  private async getCountryList(): Promise<string[]> {
    try {
      const result = await this.pool.query(`
        SELECT DISTINCT country_code 
        FROM countries 
        WHERE active = true
        ORDER BY country_code
      `);
      return result.rows.map(row => row.country_code);
    } catch (error) {
      console.warn('Countries table not found, using default list');
      // Return G20 + major economies as fallback
      return [
        'USA', 'CHN', 'JPN', 'DEU', 'GBR', 'FRA', 'IND', 'ITA', 'BRA', 'CAN',
        'RUS', 'KOR', 'AUS', 'ESP', 'MEX', 'IDN', 'NLD', 'SAU', 'TUR', 'CHE'
      ];
    }
  }

  /**
   * Store baseline in database
   */
  private async storeBaseline(baseline: StructuralBaseline): Promise<void> {
    try {
      await this.pool.query(`
        INSERT INTO structural_baselines (
          country, cut_date, components, baseline_csi, version, 
          locked, data_quality, sources, created_at
        ) VALUES ($1, $2, $3, $4, $5, false, $6, $7, NOW())
        ON CONFLICT (country, cut_date, version) 
        DO UPDATE SET 
          components = EXCLUDED.components,
          baseline_csi = EXCLUDED.baseline_csi,
          data_quality = EXCLUDED.data_quality,
          sources = EXCLUDED.sources,
          updated_at = NOW()
      `, [
        baseline.country,
        baseline.cutDate,
        JSON.stringify(baseline.components),
        baseline.baselineCSI,
        baseline.version,
        baseline.metadata?.dataQuality || 'medium',
        JSON.stringify(baseline.metadata?.sources || [])
      ]);
    } catch (error) {
      console.error(`Failed to store baseline for ${baseline.country}:`, error);
      throw error;
    }
  }

  /**
   * Lock baseline (prevent further modifications)
   */
  async lockBaseline(): Promise<void> {
    console.log(`Locking baselines for version ${this.version}...`);

    await this.pool.query(`
      UPDATE structural_baselines
      SET locked = true, locked_at = NOW()
      WHERE cut_date = $1 AND version = $2 AND locked = false
    `, [this.cutDate, this.version]);

    const result = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM structural_baselines
      WHERE cut_date = $1 AND version = $2 AND locked = true
    `, [this.cutDate, this.version]);

    console.log(`✅ Locked ${result.rows[0].count} baselines`);
  }

  /**
   * Assess data quality based on component availability
   */
  private assessDataQuality(components: StructuralBaselineComponents): string {
    const values = Object.values(components);
    const defaultCount = values.filter(v => v === 50 || v === 0 || v === 10 || v === 20 || v === 30).length;

    if (defaultCount === 0) return 'high';
    if (defaultCount <= 2) return 'medium';
    return 'low';
  }

  /**
   * Get baseline for a specific country
   */
  async getBaseline(country: string): Promise<StructuralBaseline | null> {
    const result = await this.pool.query(`
      SELECT * FROM structural_baselines
      WHERE country = $1 AND cut_date = $2 AND version = $3
    `, [country, this.cutDate, this.version]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      country: row.country,
      cutDate: row.cut_date,
      components: row.components,
      baselineCSI: parseFloat(row.baseline_csi),
      version: row.version,
      metadata: {
        dataQuality: row.data_quality,
        lastUpdated: row.updated_at || row.created_at,
        sources: row.sources
      }
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}