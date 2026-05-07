/**
 * Baseline Manager - Manages baseline CSI values
 * 
 * Handles baseline CSI storage, updates, and drift validation.
 * Enforces rate limits to prevent rapid baseline changes.
 */

import type {
  BaselineCSI,
  VectorContribution,
  DriftRecord,
  RateLimitValidation,
  VectorCode
} from '@/types/csi.types';

// Vector weights from COGRI methodology
const VECTOR_WEIGHTS: Record<VectorCode, number> = {
  'SC1': 0.20,  // Sanctions/Export Controls
  'SC2': 0.15,  // Trade/Tariff Barriers
  'SC3': 0.18,  // Supply Chain Disruption
  'SC4': 0.22,  // Kinetic Conflict
  'SC5': 0.10,  // Capital Controls
  'SC6': 0.10,  // Political Instability
  'SC7': 0.05   // Cyber/Tech Restrictions
};

class BaselineManager {
  private baselines: Map<string, BaselineCSI> = new Map();
  private readonly MAX_DRIFT_30_DAYS = 1.0;
  private readonly MAX_SINGLE_UPDATE = 0.25;
  private readonly ROLLING_WINDOW_DAYS = 30;

  /**
   * Get baseline CSI for a country
   */
  getBaselineCSI(country: string): BaselineCSI | undefined {
    return this.baselines.get(country);
  }

  /**
   * Set baseline CSI (used during initialization)
   */
  setBaselineCSI(baseline: BaselineCSI): void {
    this.baselines.set(baseline.country, baseline);
  }

  /**
   * Update baseline CSI with validation
   */
  updateBaselineCSI(
    country: string,
    newValue: number,
    reason: string,
    updatedBy: string
  ): BaselineCSI {
    const existing = this.baselines.get(country);
    if (!existing) {
      throw new Error(`No baseline found for ${country}`);
    }

    const delta = newValue - existing.baseline_value;
    const validation = this.validateBaselineDrift(country, delta);

    if (!validation.valid) {
      throw new Error(`Baseline update rejected: ${validation.error_message}`);
    }

    const now = new Date().toISOString();
    const driftRecord: DriftRecord = {
      timestamp: now,
      previous_value: existing.baseline_value,
      new_value: newValue,
      delta,
      reason,
      updated_by: updatedBy
    };

    existing.baseline_value = newValue;
    existing.last_updated = now;
    existing.drift_history.push(driftRecord);
    existing.validation_status = 'VALID';

    console.log(`[Baseline Manager] 📊 Updated ${country} baseline: ${existing.baseline_value.toFixed(2)} → ${newValue.toFixed(2)} (Δ${delta.toFixed(2)})`);

    return existing;
  }

  /**
   * Validate baseline drift against rate limits
   */
  validateBaselineDrift(country: string, proposedDelta: number): RateLimitValidation {
    const existing = this.baselines.get(country);
    if (!existing) {
      return {
        valid: false,
        current_drift: 0,
        proposed_drift: proposedDelta,
        rolling_window_drift: 0,
        max_allowed: this.MAX_DRIFT_30_DAYS,
        error_message: `No baseline found for ${country}`
      };
    }

    // Check single update limit
    if (Math.abs(proposedDelta) > this.MAX_SINGLE_UPDATE) {
      return {
        valid: false,
        current_drift: 0,
        proposed_drift: proposedDelta,
        rolling_window_drift: 0,
        max_allowed: this.MAX_SINGLE_UPDATE,
        error_message: `Single update exceeds limit: ${Math.abs(proposedDelta).toFixed(2)} > ${this.MAX_SINGLE_UPDATE}`
      };
    }

    // Calculate rolling 30-day drift
    const rollingDrift = this.calculateRollingDrift(existing);
    const newRollingDrift = rollingDrift + proposedDelta;

    if (Math.abs(newRollingDrift) > this.MAX_DRIFT_30_DAYS) {
      return {
        valid: false,
        current_drift: rollingDrift,
        proposed_drift: proposedDelta,
        rolling_window_drift: newRollingDrift,
        max_allowed: this.MAX_DRIFT_30_DAYS,
        error_message: `30-day rolling drift exceeds limit: ${Math.abs(newRollingDrift).toFixed(2)} > ${this.MAX_DRIFT_30_DAYS}`
      };
    }

    return {
      valid: true,
      current_drift: rollingDrift,
      proposed_drift: proposedDelta,
      rolling_window_drift: newRollingDrift,
      max_allowed: this.MAX_DRIFT_30_DAYS
    };
  }

  /**
   * Calculate rolling 30-day drift
   */
  private calculateRollingDrift(baseline: BaselineCSI): number {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - this.ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    return baseline.drift_history
      .filter(record => new Date(record.timestamp) >= thirtyDaysAgo)
      .reduce((sum, record) => sum + record.delta, 0);
  }

  /**
   * Create baseline from current CSI value
   */
  createBaseline(country: string, currentCSI: number): BaselineCSI {
    const now = new Date().toISOString();

    // Distribute CSI across vectors proportionally
    const vectorContributions: VectorContribution[] = Object.entries(VECTOR_WEIGHTS).map(
      ([code, weight]) => ({
        vector_code: code as VectorCode,
        contribution: currentCSI * weight,
        weight
      })
    );

    const baseline: BaselineCSI = {
      country,
      baseline_value: currentCSI,
      vector_contributions: vectorContributions,
      last_updated: now,
      drift_history: [],
      validation_status: 'VALID'
    };

    this.baselines.set(country, baseline);
    console.log(`[Baseline Manager] 🆕 Created baseline for ${country}: ${currentCSI.toFixed(2)}`);

    return baseline;
  }

  /**
   * Get all baselines
   */
  getAllBaselines(): BaselineCSI[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Get baseline count
   */
  getBaselineCount(): number {
    return this.baselines.size;
  }

  /**
   * Clear all baselines (for testing)
   */
  clear(): void {
    this.baselines.clear();
    console.log('[Baseline Manager] 🧹 Cleared all baselines');
  }
}

// Singleton instance
export const baselineManager = new BaselineManager();