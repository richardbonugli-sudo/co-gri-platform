/**
 * CSI API Router
 * REST API endpoints for Phase 2
 */

import { CSIEngine } from '../csi/CSIEngine';
import { BacktestingEngine } from '../backtesting/BacktestingEngine';
import { SignalStorage } from '../storage/SignalStorage';

export class CSIRouter {
  private csiEngine: CSIEngine;
  private backtestingEngine: BacktestingEngine;
  private signalStorage: SignalStorage;

  constructor() {
    this.signalStorage = new SignalStorage();
    this.csiEngine = new CSIEngine(this.signalStorage);
    this.backtestingEngine = new BacktestingEngine(this.signalStorage);
  }

  /**
   * GET /api/csi-enhancement/enhanced-csi
   * Get all enhanced CSI scores
   */
  async getEnhancedCSI(params?: {
    country?: string;
    vector?: string;
  }): Promise<any> {
    try {
      if (params?.country) {
        return await this.csiEngine.getEnhancedCSIForCountry(params.country);
      }

      if (params?.vector) {
        return await this.csiEngine.getEnhancedCSIForVector(params.vector);
      }

      // Get all latest scores
      const storage = this.csiEngine['csiStorage'];
      const query = 'SELECT * FROM latest_enhanced_csi ORDER BY country, vector';
      const result = await storage['pool'].query(query);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * GET /api/csi-enhancement/comparison
   * Get CSI comparison (legacy vs enhanced)
   */
  async getComparison(): Promise<any> {
    try {
      const comparison = await this.csiEngine.getCSIComparison();

      return {
        success: true,
        data: comparison,
        count: comparison.length
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * GET /api/csi-enhancement/explanation/:country/:vector
   * Get detailed explanation for specific country-vector
   */
  async getExplanation(country: string, vector: string): Promise<any> {
    try {
      const storage = this.csiEngine['csiStorage'];
      const query = `
        SELECT * FROM get_enhanced_csi_with_contributions($1, $2)
      `;
      const result = await storage['pool'].query(query, [country, vector]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'No data found for this country-vector pair'
        };
      }

      return {
        success: true,
        data: {
          country: result.rows[0].country,
          vector: result.rows[0].vector,
          legacyCSI: parseFloat(result.rows[0].legacy_csi),
          baselineDrift: parseFloat(result.rows[0].baseline_drift),
          enhancedCSI: parseFloat(result.rows[0].enhanced_csi),
          contributions: result.rows.map((row: any) => ({
            signalId: row.signal_id,
            headline: row.signal_headline,
            impactScore: parseFloat(row.impact_score),
            decayFactor: parseFloat(row.decay_factor),
            contribution: parseFloat(row.contribution)
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * POST /api/csi-enhancement/calculate
   * Trigger CSI calculation
   */
  async calculateCSI(): Promise<any> {
    try {
      const startTime = Date.now();
      const scores = await this.csiEngine.calculateEnhancedCSI();
      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          scoresCalculated: scores.length,
          durationMs: duration,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * GET /api/csi-enhancement/statistics
   * Get system statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const storage = this.csiEngine['csiStorage'];
      const query = 'SELECT * FROM enhanced_csi_stats';
      const result = await storage['pool'].query(query);

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * GET /api/csi-enhancement/drift-by-vector
   * Get drift statistics by vector
   */
  async getDriftByVector(): Promise<any> {
    try {
      const storage = this.csiEngine['csiStorage'];
      const query = 'SELECT * FROM drift_by_vector';
      const result = await storage['pool'].query(query);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * GET /api/csi-enhancement/drift-by-country
   * Get drift statistics by country
   */
  async getDriftByCountry(): Promise<any> {
    try {
      const storage = this.csiEngine['csiStorage'];
      const query = 'SELECT * FROM drift_by_country LIMIT 50';
      const result = await storage['pool'].query(query);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * GET /api/csi-enhancement/calculation-history
   * Get calculation run history
   */
  async getCalculationHistory(limit: number = 20): Promise<any> {
    try {
      const history = await this.csiEngine.getCalculationHistory(limit);

      return {
        success: true,
        data: history,
        count: history.length
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * POST /api/csi-enhancement/backtest
   * Run backtest
   */
  async runBacktest(params: {
    startDate: string;
    endDate: string;
  }): Promise<any> {
    try {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      const result = await this.backtestingEngine.runBacktest(startDate, endDate);
      const report = this.backtestingEngine.generateReport(result);

      return {
        success: true,
        data: result,
        report
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.csiEngine.close();
    await this.backtestingEngine.close();
  }
}