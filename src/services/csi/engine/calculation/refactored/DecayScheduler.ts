/**
 * Decay Scheduler - Phase 3D Complete
 * Manages decay of escalation signals that don't materialize into events
 * 
 * Phase 3D Changes:
 * - Added risk_factor field to DecaySchedule for factor-scoped tracking
 * - Updated decay statistics to return per-factor breakdown
 * - Enhanced cleanup to support factor-scoped operations
 * - Added factor filtering capabilities
 * 
 * Key Concepts:
 * - Signals remain at full strength during "inactivity window" (30 days default)
 * - After inactivity window, signals decay exponentially
 * - Decay rate is slower than escalation rate (asymmetric)
 * - Signals are marked as expired when decayed below threshold
 * 
 * Factor Tracking Rationale:
 * - Enables per-factor audit trail for decay operations
 * - Supports factor-scoped validation and reporting
 * - Maintains consistency with factor-scoped drift and events
 * - Facilitates debugging and analysis by risk factor
 */

import { Signal, CSIRiskFactor } from './types';

export interface DecaySchedule {
  signal_id: string;
  country: string;
  risk_factor: CSIRiskFactor;  // Phase 3D: Track which factor this decay belongs to
  initial_drift: number;
  decay_start_date: Date;
  inactivity_window_days: number; // Default: 30
  decay_rate: number; // Slower than escalation rate
  current_value: number;
  status: 'ACTIVE' | 'DECAYING' | 'EXPIRED';
  last_updated: Date;
  signal_last_updated: Date; // Track when the signal was last updated
}

export interface DecayConfig {
  inactivity_window_days: number; // 30 days
  decay_rate_multiplier: number; // 0.5 (decay at half the escalation rate)
  decay_half_life_days: number; // 30 days
  expiration_threshold: number; // 0.01 (1% of initial value)
}

export class DecayScheduler {
  private schedules: Map<string, DecaySchedule> = new Map();
  private config: DecayConfig;

  constructor(config?: Partial<DecayConfig>) {
    this.config = {
      inactivity_window_days: 30,
      decay_rate_multiplier: 0.5,
      decay_half_life_days: 30,
      expiration_threshold: 0.01,
      ...config
    };
  }

  /**
   * Phase 3D: Schedule decay for a signal with factor tracking
   * Captures the signal's risk_factor for audit trail and factor-scoped operations
   */
  async scheduleDecay(signal: Signal, initialDrift: number): Promise<DecaySchedule> {
    const signalLastUpdated = signal.last_updated instanceof Date 
      ? signal.last_updated 
      : new Date(signal.last_updated);
    
    const decayStartDate = new Date(
      signalLastUpdated.getTime() + 
      this.config.inactivity_window_days * 24 * 60 * 60 * 1000
    );

    const schedule: DecaySchedule = {
      signal_id: signal.signal_id,
      country: signal.country,
      risk_factor: signal.risk_factor,  // Phase 3D: Capture signal's risk factor
      initial_drift: initialDrift,
      decay_start_date: decayStartDate,
      inactivity_window_days: this.config.inactivity_window_days,
      decay_rate: this.config.decay_rate_multiplier,
      current_value: initialDrift,
      status: 'ACTIVE',
      last_updated: new Date(),
      signal_last_updated: signalLastUpdated
    };
    
    this.schedules.set(signal.signal_id, schedule);
    return schedule;
  }

  /**
   * Update decay status based on signal activity
   * If signal is updated, reset the decay timer
   */
  async updateDecayStatus(signal: Signal, currentTime?: Date): Promise<void> {
    const now = currentTime || new Date();
    const signalLastUpdated = signal.last_updated instanceof Date 
      ? signal.last_updated 
      : new Date(signal.last_updated);
    
    const schedule = this.schedules.get(signal.signal_id);
    if (!schedule) {
      // Create new schedule if doesn't exist
      await this.scheduleDecay(signal, 0);
      return;
    }
    
    // Check if signal was updated (reset decay timer)
    if (signalLastUpdated.getTime() > schedule.signal_last_updated.getTime()) {
      // Signal was updated, reset to ACTIVE
      schedule.status = 'ACTIVE';
      schedule.signal_last_updated = signalLastUpdated;
      schedule.decay_start_date = new Date(
        signalLastUpdated.getTime() + 
        this.config.inactivity_window_days * 24 * 60 * 60 * 1000
      );
      schedule.last_updated = now;
      schedule.current_value = schedule.initial_drift;
      return;
    }
    
    // Check if we're past the decay start date
    if (now >= schedule.decay_start_date && schedule.status === 'ACTIVE') {
      schedule.status = 'DECAYING';
      schedule.last_updated = now;
    }
  }

  /**
   * Calculate decayed value for a signal at a given time
   * Uses exponential decay: value(t) = initial_value × e^(-λt)
   */
  async calculateDecayedValue(signalId: string, currentTime: Date): Promise<number> {
    const schedule = this.schedules.get(signalId);
    if (!schedule) return 0;
    
    // Update status based on current time
    const daysSinceSignalUpdate = this.getDaysSince(schedule.signal_last_updated, currentTime);
    
    // If within inactivity window, return full value
    if (daysSinceSignalUpdate < this.config.inactivity_window_days) {
      schedule.status = 'ACTIVE';
      return schedule.initial_drift;
    }
    
    // If already expired, return 0
    if (schedule.status === 'EXPIRED') {
      return 0;
    }
    
    // Transition to DECAYING if needed
    if (schedule.status === 'ACTIVE') {
      schedule.status = 'DECAYING';
    }
    
    // Calculate decay
    const daysSinceDecayStart = Math.max(0, daysSinceSignalUpdate - this.config.inactivity_window_days);
    
    // Exponential decay formula: value = initial × e^(-λt)
    // λ = ln(2) / half_life (for half-life based decay)
    const lambda = Math.log(2) / this.config.decay_half_life_days;
    const decayFactor = Math.exp(-lambda * daysSinceDecayStart * schedule.decay_rate);
    
    const decayedValue = schedule.initial_drift * decayFactor;
    
    // Check if below expiration threshold
    if (decayedValue < schedule.initial_drift * this.config.expiration_threshold) {
      schedule.status = 'EXPIRED';
      schedule.current_value = 0;
      return 0;
    }
    
    schedule.current_value = decayedValue;
    schedule.last_updated = currentTime;
    
    return decayedValue;
  }

  /**
   * Get all active decay schedules for a country
   */
  async getActiveDecays(country: string): Promise<DecaySchedule[]> {
    return Array.from(this.schedules.values()).filter(s =>
      s.country === country &&
      (s.status === 'ACTIVE' || s.status === 'DECAYING')
    );
  }

  /**
   * Phase 3D: Get active decay schedules for a country and factor
   * Enables factor-scoped decay queries for audit and validation
   */
  async getActiveDecaysByFactor(country: string, factor: CSIRiskFactor): Promise<DecaySchedule[]> {
    return Array.from(this.schedules.values()).filter(s =>
      s.country === country &&
      s.risk_factor === factor &&
      (s.status === 'ACTIVE' || s.status === 'DECAYING')
    );
  }

  /**
   * Get decay schedule for a specific signal
   */
  getSchedule(signalId: string): DecaySchedule | undefined {
    return this.schedules.get(signalId);
  }

  /**
   * Check if a signal is in decay phase
   */
  isDecaying(signalId: string): boolean {
    const schedule = this.schedules.get(signalId);
    return schedule?.status === 'DECAYING' || false;
  }

  /**
   * Check if a signal has expired
   */
  isExpired(signalId: string): boolean {
    const schedule = this.schedules.get(signalId);
    return schedule?.status === 'EXPIRED' || false;
  }

  /**
   * Force expire a signal (e.g., when confirmed as event)
   */
  expireSignal(signalId: string): void {
    const schedule = this.schedules.get(signalId);
    if (schedule) {
      schedule.status = 'EXPIRED';
      schedule.current_value = 0;
      schedule.last_updated = new Date();
    }
  }

  /**
   * Get decay progress (0-1, where 1 is fully decayed)
   */
  getDecayProgress(signalId: string, currentTime: Date): number {
    const schedule = this.schedules.get(signalId);
    if (!schedule) return 1;
    
    if (schedule.status === 'ACTIVE') return 0;
    if (schedule.status === 'EXPIRED') return 1;
    
    // Calculate current value synchronously for progress
    const daysSinceSignalUpdate = this.getDaysSince(schedule.signal_last_updated, currentTime);
    
    if (daysSinceSignalUpdate < this.config.inactivity_window_days) {
      return 0;
    }
    
    const daysSinceDecayStart = daysSinceSignalUpdate - this.config.inactivity_window_days;
    const lambda = Math.log(2) / this.config.decay_half_life_days;
    const decayFactor = Math.exp(-lambda * daysSinceDecayStart * schedule.decay_rate);
    
    return 1 - decayFactor;
  }

  /**
   * Get estimated time until expiration
   */
  getTimeUntilExpiration(signalId: string): number | null {
    const schedule = this.schedules.get(signalId);
    if (!schedule) return null;
    
    if (schedule.status === 'EXPIRED') return 0;
    if (schedule.status === 'ACTIVE') {
      // Time until decay starts
      const now = new Date();
      return Math.max(0, schedule.decay_start_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    }
    
    // Calculate time until value drops below threshold
    // value = initial × e^(-λt) = initial × threshold
    // e^(-λt) = threshold
    // -λt = ln(threshold)
    // t = -ln(threshold) / λ
    
    const lambda = Math.log(2) / this.config.decay_half_life_days;
    const effectiveLambda = lambda * schedule.decay_rate;
    const daysToExpiration = -Math.log(this.config.expiration_threshold) / effectiveLambda;
    
    const daysSinceDecayStart = this.getDaysSince(schedule.decay_start_date);
    const remainingDays = Math.max(0, daysToExpiration - daysSinceDecayStart);
    
    return remainingDays;
  }

  /**
   * Phase 3D: Cleanup expired schedules with optional factor filtering
   * Supports factor-scoped cleanup for targeted maintenance
   */
  async cleanupExpiredSchedules(retentionDays: number = 7, factor?: CSIRiskFactor): Promise<number> {
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    for (const [signalId, schedule] of this.schedules.entries()) {
      // Skip if factor filter doesn't match
      if (factor && schedule.risk_factor !== factor) {
        continue;
      }

      // Only cleanup EXPIRED schedules
      if (schedule.status !== 'EXPIRED') {
        continue;
      }

      // Check if schedule has been expired longer than retention period
      const timeSinceUpdate = now - schedule.last_updated.getTime();
      if (timeSinceUpdate >= retentionMs) {
        this.schedules.delete(signalId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Phase 3D: Get decay statistics for a country with per-factor breakdown
   * Enables factor-scoped audit trail and validation
   * 
   * Rationale for Factor Breakdown:
   * - Each CSI risk factor has independent decay dynamics
   * - Factor-level statistics enable targeted monitoring
   * - Supports validation of factor-scoped operations
   * - Facilitates debugging and performance analysis per factor
   */
  getDecayStats(country: string): {
    total_schedules: number;
    active_count: number;
    decaying_count: number;
    expired_count: number;
    avg_decay_progress: number;
    total_decayed_value: number;
    by_factor: Record<CSIRiskFactor, {
      total: number;
      active: number;
      decaying: number;
      expired: number;
      total_decayed_value: number;
    }>;
  } {
    const countrySchedules = Array.from(this.schedules.values()).filter(s => s.country === country);
    
    const activeCount = countrySchedules.filter(s => s.status === 'ACTIVE').length;
    const decayingCount = countrySchedules.filter(s => s.status === 'DECAYING').length;
    const expiredCount = countrySchedules.filter(s => s.status === 'EXPIRED').length;
    
    const currentTime = new Date();
    let totalProgress = 0;
    let totalDecayedValue = 0;
    
    // Phase 3D: Initialize per-factor statistics
    const byFactor: Record<CSIRiskFactor, {
      total: number;
      active: number;
      decaying: number;
      expired: number;
      total_decayed_value: number;
    }> = {} as any;
    
    for (const factor of Object.values(CSIRiskFactor)) {
      byFactor[factor] = {
        total: 0,
        active: 0,
        decaying: 0,
        expired: 0,
        total_decayed_value: 0
      };
    }
    
    for (const schedule of countrySchedules) {
      const progress = this.getDecayProgress(schedule.signal_id, currentTime);
      totalProgress += progress;
      
      const decayedAmount = schedule.initial_drift - schedule.current_value;
      totalDecayedValue += decayedAmount;
      
      // Phase 3D: Update per-factor statistics
      const factor = schedule.risk_factor;
      byFactor[factor].total++;
      byFactor[factor].total_decayed_value += decayedAmount;
      
      if (schedule.status === 'ACTIVE') {
        byFactor[factor].active++;
      } else if (schedule.status === 'DECAYING') {
        byFactor[factor].decaying++;
      } else if (schedule.status === 'EXPIRED') {
        byFactor[factor].expired++;
      }
    }
    
    return {
      total_schedules: countrySchedules.length,
      active_count: activeCount,
      decaying_count: decayingCount,
      expired_count: expiredCount,
      avg_decay_progress: countrySchedules.length > 0 ? totalProgress / countrySchedules.length : 0,
      total_decayed_value: totalDecayedValue,
      by_factor: byFactor  // Phase 3D: Per-factor breakdown
    };
  }

  /**
   * Phase 3D: Get decay statistics for a specific factor
   * Enables targeted factor-level monitoring and analysis
   */
  getDecayStatsByFactor(country: string, factor: CSIRiskFactor): {
    total_schedules: number;
    active_count: number;
    decaying_count: number;
    expired_count: number;
    avg_decay_progress: number;
    total_decayed_value: number;
  } {
    const factorSchedules = Array.from(this.schedules.values()).filter(
      s => s.country === country && s.risk_factor === factor
    );
    
    const activeCount = factorSchedules.filter(s => s.status === 'ACTIVE').length;
    const decayingCount = factorSchedules.filter(s => s.status === 'DECAYING').length;
    const expiredCount = factorSchedules.filter(s => s.status === 'EXPIRED').length;
    
    const currentTime = new Date();
    let totalProgress = 0;
    let totalDecayedValue = 0;
    
    for (const schedule of factorSchedules) {
      const progress = this.getDecayProgress(schedule.signal_id, currentTime);
      totalProgress += progress;
      
      const decayedAmount = schedule.initial_drift - schedule.current_value;
      totalDecayedValue += decayedAmount;
    }
    
    return {
      total_schedules: factorSchedules.length,
      active_count: activeCount,
      decaying_count: decayingCount,
      expired_count: expiredCount,
      avg_decay_progress: factorSchedules.length > 0 ? totalProgress / factorSchedules.length : 0,
      total_decayed_value: totalDecayedValue
    };
  }

  /**
   * Get all schedules (for debugging/admin)
   */
  getAllSchedules(): DecaySchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Phase 3D: Get all schedules for a specific factor
   * Supports factor-scoped debugging and analysis
   */
  getSchedulesByFactor(factor: CSIRiskFactor): DecaySchedule[] {
    return Array.from(this.schedules.values()).filter(s => s.risk_factor === factor);
  }

  /**
   * Reset a schedule (restart from active state)
   */
  resetSchedule(signalId: string, newInitialDrift?: number): void {
    const schedule = this.schedules.get(signalId);
    if (!schedule) return;
    
    if (newInitialDrift !== undefined) {
      schedule.initial_drift = newInitialDrift;
    }
    
    const now = new Date();
    schedule.status = 'ACTIVE';
    schedule.current_value = schedule.initial_drift;
    schedule.signal_last_updated = now;
    schedule.decay_start_date = new Date(
      now.getTime() + this.config.inactivity_window_days * 24 * 60 * 60 * 1000
    );
    schedule.last_updated = now;
  }

  /**
   * Helper: Get days since a date
   */
  private getDaysSince(date: Date, currentTime?: Date): number {
    const now = currentTime || new Date();
    return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Get configuration
   */
  getConfig(): DecayConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<DecayConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Phase 3D: Get health metrics with per-factor breakdown
   * Enables comprehensive monitoring of decay operations by factor
   */
  getHealthMetrics(): {
    total_schedules: number;
    active_schedules: number;
    decaying_schedules: number;
    expired_schedules: number;
    avg_current_value: number;
    by_factor: Record<CSIRiskFactor, {
      total: number;
      active: number;
      decaying: number;
      expired: number;
    }>;
  } {
    const allSchedules = Array.from(this.schedules.values());
    
    const activeCount = allSchedules.filter(s => s.status === 'ACTIVE').length;
    const decayingCount = allSchedules.filter(s => s.status === 'DECAYING').length;
    const expiredCount = allSchedules.filter(s => s.status === 'EXPIRED').length;
    
    const totalValue = allSchedules.reduce((sum, s) => sum + s.current_value, 0);
    const avgValue = allSchedules.length > 0 ? totalValue / allSchedules.length : 0;
    
    // Phase 3D: Per-factor breakdown in health metrics
    const byFactor: Record<CSIRiskFactor, {
      total: number;
      active: number;
      decaying: number;
      expired: number;
    }> = {} as any;
    
    for (const factor of Object.values(CSIRiskFactor)) {
      byFactor[factor] = {
        total: 0,
        active: 0,
        decaying: 0,
        expired: 0
      };
    }
    
    for (const schedule of allSchedules) {
      const factor = schedule.risk_factor;
      byFactor[factor].total++;
      
      if (schedule.status === 'ACTIVE') {
        byFactor[factor].active++;
      } else if (schedule.status === 'DECAYING') {
        byFactor[factor].decaying++;
      } else if (schedule.status === 'EXPIRED') {
        byFactor[factor].expired++;
      }
    }
    
    return {
      total_schedules: allSchedules.length,
      active_schedules: activeCount,
      decaying_schedules: decayingCount,
      expired_schedules: expiredCount,
      avg_current_value: avgValue,
      by_factor: byFactor  // Phase 3D: Per-factor breakdown
    };
  }
}

// Singleton instance
export const decayScheduler = new DecayScheduler();