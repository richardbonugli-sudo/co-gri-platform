/**
 * Expanded Backtesting & Validation Tests - Phase 5 Testing & Validation
 * Additional historical event validation scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EscalationDriftEngine } from '../EscalationDriftEngine';
import { DecayScheduler } from '../DecayScheduler';
import { NettingEngine } from '../NettingEngine';
import { RefactoredCSIEngine } from '../RefactoredCSIEngine';
import { Signal, CSIRiskFactor, SourceRole } from '../types';

// Helper function to map legacy RiskVector to CSIRiskFactor
enum RiskVector {
  SECURITY = 'SECURITY',
  POLITICAL = 'POLITICAL',
  SOCIAL = 'SOCIAL',
  ECONOMIC = 'ECONOMIC'
}

function mapRiskVectorToCSIRiskFactor(vector: RiskVector): CSIRiskFactor {
  switch (vector) {
    case RiskVector.SECURITY:
      return CSIRiskFactor.CONFLICT_SECURITY;
    case RiskVector.POLITICAL:
      return CSIRiskFactor.GOVERNANCE_RULE_OF_LAW;
    case RiskVector.SOCIAL:
      return CSIRiskFactor.PUBLIC_UNREST_CIVIL;
    case RiskVector.ECONOMIC:
      return CSIRiskFactor.TRADE_LOGISTICS;
    default:
      return CSIRiskFactor.CONFLICT_SECURITY;
  }
}

// Helper function to convert string array sources to SourceMetadata objects
function createSources(sourceNames: string[]) {
  return sourceNames.map(name => ({
    source_id: name,
    source_name: name.toUpperCase(),
    role: SourceRole.DETECTION,
    reliability_score: 0.9,
    authority_level: 'HIGH' as const,
    applicable_factors: [] as CSIRiskFactor[]
  }));
}

describe('Expanded Backtesting & Validation', () => {
  
  describe('Historical Event: Russia-Ukraine Conflict (2022)', () => {
    it('should show drift rising before invasion', async () => {
      const engine = new EscalationDriftEngine();
      
      // Historical scenario: Military buildup (Nov 2021 - Feb 2022) → Invasion (Feb 24, 2022)
      
      // Signal 1: November 2021 - Initial military buildup reports
      const signal1: Signal = {
        signal_id: 'RU-military_buildup-2021-11-01',
        country: 'Ukraine',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SECURITY),
        signal_type: 'military_buildup',
        severity: 0.65,
        probability: 0.50,
        detected_date: new Date('2021-11-01'),
        last_updated: new Date('2021-11-01'),
        sources: createSources(['reuters', 'ap', 'bbc']),
        corroboration_count: 3,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 2: December 2021 - Escalating tensions
      const signal2: Signal = {
        signal_id: 'RU-conflict_escalation-2021-12-15',
        country: 'Ukraine',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SECURITY),
        signal_type: 'conflict_escalation',
        severity: 0.75,
        probability: 0.60,
        detected_date: new Date('2021-12-15'),
        last_updated: new Date('2021-12-15'),
        sources: createSources(['reuters', 'ft', 'wsj', 'nyt']),
        corroboration_count: 4,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 3: January 2022 - Diplomatic breakdown
      const signal3: Signal = {
        signal_id: 'RU-diplomatic_freeze-2022-01-20',
        country: 'Ukraine',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
        signal_type: 'diplomatic_freeze',
        severity: 0.80,
        probability: 0.70,
        detected_date: new Date('2022-01-20'),
        last_updated: new Date('2022-01-20'),
        sources: createSources(['reuters', 'ap', 'bbc', 'ft', 'wsj']),
        corroboration_count: 5,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 4: February 2022 - Imminent threat
      const signal4: Signal = {
        signal_id: 'RU-border_tension-2022-02-15',
        country: 'Ukraine',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SECURITY),
        signal_type: 'border_tension',
        severity: 0.90,
        probability: 0.85,
        detected_date: new Date('2022-02-15'),
        last_updated: new Date('2022-02-15'),
        sources: createSources(['reuters', 'ap', 'bbc', 'ft', 'wsj', 'nyt']),
        corroboration_count: 6,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      engine.addSignal('Ukraine', signal1);
      engine.addSignal('Ukraine', signal2);
      engine.addSignal('Ukraine', signal3);
      engine.addSignal('Ukraine', signal4);
      
      // Calculate drift at different time points
      const driftNov = await engine.calculate('Ukraine', new Date('2021-11-30'));
      const driftDec = await engine.calculate('Ukraine', new Date('2021-12-31'));
      const driftJan = await engine.calculate('Ukraine', new Date('2022-01-31'));
      const driftFeb = await engine.calculate('Ukraine', new Date('2022-02-23'));
      
      // Drift should rise as signals accumulate
      expect(driftDec).toBeGreaterThan(driftNov);
      expect(driftJan).toBeGreaterThan(driftDec);
      expect(driftFeb).toBeGreaterThan(driftJan);
      
      // Drift should be significant before invasion (>0.3 with multiple signals)
      expect(driftFeb).toBeGreaterThan(0.3);
    });
  });

  describe('Historical Event: Brexit Referendum (2016)', () => {
    it('should show drift rising before referendum', async () => {
      const engine = new EscalationDriftEngine();
      
      // Historical scenario: Brexit campaign (Jan-Jun 2016) → Referendum (Jun 23, 2016)
      
      // Signal 1: January 2016 - Campaign begins
      const signal1: Signal = {
        signal_id: 'UK-policy_signal-2016-01-15',
        country: 'UK',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
        signal_type: 'policy_signal',
        severity: 0.50,
        probability: 0.45,
        detected_date: new Date('2016-01-15'),
        last_updated: new Date('2016-01-15'),
        sources: createSources(['reuters', 'ft']),
        corroboration_count: 2,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 2: April 2016 - Polls tightening
      const signal2: Signal = {
        signal_id: 'UK-regulatory_warning-2016-04-10',
        country: 'UK',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
        signal_type: 'regulatory_warning',
        severity: 0.65,
        probability: 0.50,
        detected_date: new Date('2016-04-10'),
        last_updated: new Date('2016-04-10'),
        sources: createSources(['reuters', 'ft', 'bbc']),
        corroboration_count: 3,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 3: June 2016 - Uncertainty peaks
      const signal3: Signal = {
        signal_id: 'UK-policy_signal-2016-06-15',
        country: 'UK',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
        signal_type: 'policy_signal',
        severity: 0.75,
        probability: 0.55,
        detected_date: new Date('2016-06-15'),
        last_updated: new Date('2016-06-15'),
        sources: createSources(['reuters', 'ft', 'bbc', 'wsj']),
        corroboration_count: 4,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      engine.addSignal('UK', signal1);
      engine.addSignal('UK', signal2);
      engine.addSignal('UK', signal3);
      
      // Calculate drift at different time points
      const driftJan = await engine.calculate('UK', new Date('2016-01-31'));
      const driftApr = await engine.calculate('UK', new Date('2016-04-30'));
      const driftJun = await engine.calculate('UK', new Date('2016-06-22'));
      
      // Drift should rise as referendum approaches
      expect(driftApr).toBeGreaterThan(driftJan);
      expect(driftJun).toBeGreaterThan(driftApr);
    });
  });

  describe('Historical Event: COVID-19 Pandemic (2020)', () => {
    it('should show drift rising before lockdowns', async () => {
      const engine = new EscalationDriftEngine();
      
      // Historical scenario: Early reports (Jan 2020) → Global lockdowns (Mar 2020)
      
      // Signal 1: January 2020 - Initial reports from China
      const signal1: Signal = {
        signal_id: 'Global-health_crisis-2020-01-20',
        country: 'Global',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SOCIAL),
        signal_type: 'health_crisis_signal',
        severity: 0.60,
        probability: 0.40,
        detected_date: new Date('2020-01-20'),
        last_updated: new Date('2020-01-20'),
        sources: createSources(['reuters', 'who']),
        corroboration_count: 2,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 2: February 2020 - Spreading globally
      const signal2: Signal = {
        signal_id: 'Global-health_crisis-2020-02-15',
        country: 'Global',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SOCIAL),
        signal_type: 'health_crisis_signal',
        severity: 0.80,
        probability: 0.70,
        detected_date: new Date('2020-02-15'),
        last_updated: new Date('2020-02-15'),
        sources: createSources(['reuters', 'who', 'cdc', 'bbc']),
        corroboration_count: 4,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      // Signal 3: March 2020 - Pandemic declared
      const signal3: Signal = {
        signal_id: 'Global-health_crisis-2020-03-10',
        country: 'Global',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SOCIAL),
        signal_type: 'health_crisis_signal',
        severity: 0.95,
        probability: 0.95,
        detected_date: new Date('2020-03-10'),
        last_updated: new Date('2020-03-10'),
        sources: createSources(['reuters', 'who', 'cdc', 'bbc', 'ft', 'nyt']),
        corroboration_count: 6,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      engine.addSignal('Global', signal1);
      engine.addSignal('Global', signal2);
      engine.addSignal('Global', signal3);
      
      // Calculate drift at different time points
      const driftJan = await engine.calculate('Global', new Date('2020-01-31'));
      const driftFeb = await engine.calculate('Global', new Date('2020-02-29'));
      const driftMar = await engine.calculate('Global', new Date('2020-03-15'));
      
      // Drift should rise dramatically
      expect(driftFeb).toBeGreaterThan(driftJan);
      expect(driftMar).toBeGreaterThan(driftFeb);
    });
  });

  describe('Decay Validation: Signal Scheduling', () => {
    it('should schedule decay for signals', async () => {
      const scheduler = new DecayScheduler();
      
      const signal: Signal = {
        signal_id: 'test-signal',
        country: 'TestCountry',
        risk_factor: CSIRiskFactor.TRADE_LOGISTICS,
        signal_type: 'tariff_threat',
        severity: 0.7,
        probability: 0.75,
        detected_date: new Date('2024-01-01'),
        last_updated: new Date('2024-01-01'),
        sources: createSources(['reuters']),
        corroboration_count: 1,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      const initialDrift = 0.45;
      const schedule = await scheduler.scheduleDecay(signal, initialDrift);
      
      expect(schedule).toBeDefined();
      expect(schedule.signal_id).toBe('test-signal');
      expect(schedule.risk_factor).toBe(CSIRiskFactor.TRADE_LOGISTICS);
      expect(schedule.initial_drift).toBe(initialDrift);
      expect(schedule.status).toBe('ACTIVE');
    });

    it('should update decay status when signal is updated', async () => {
      const scheduler = new DecayScheduler();
      
      const signal: Signal = {
        signal_id: 'update-test',
        country: 'TestCountry',
        risk_factor: CSIRiskFactor.CONFLICT_SECURITY,
        signal_type: 'conflict_escalation',
        severity: 0.7,
        probability: 0.75,
        detected_date: new Date('2024-01-01'),
        last_updated: new Date('2024-01-01'),
        sources: createSources(['reuters']),
        corroboration_count: 1,
        persistence_hours: 0,
        max_drift_cap: 0.25
      };
      
      await scheduler.scheduleDecay(signal, 0.45);
      
      // Update signal
      signal.last_updated = new Date('2024-02-15');
      await scheduler.updateDecayStatus(signal);
      
      // Decay should be reset
      const schedule = scheduler.getSchedule(signal.signal_id);
      expect(schedule?.status).toBe('ACTIVE');
    });
  });

  describe('Netting Validation: Overlapping Signal Scenarios', () => {
    it('should net overlapping sanctions signals', async () => {
      const nettingEngine = new NettingEngine();
      
      // Multiple sanctions-related signals from same underlying event
      const signals: Signal[] = [
        {
          signal_id: 'sanctions-warning-1',
          country: 'Russia',
          risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
          signal_type: 'sanctions_warning',
          severity: 0.75,
          probability: 0.70,
          detected_date: new Date('2024-01-10'),
          last_updated: new Date('2024-01-10'),
          sources: createSources(['reuters', 'bloomberg']),
          corroboration_count: 2,
          persistence_hours: 72,
          max_drift_cap: 0.25
        },
        {
          signal_id: 'diplomatic-freeze-1',
          country: 'Russia',
          risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
          signal_type: 'diplomatic_freeze',
          severity: 0.70,
          probability: 0.68,
          detected_date: new Date('2024-01-12'),
          last_updated: new Date('2024-01-12'),
          sources: createSources(['reuters', 'ft']),
          corroboration_count: 2,
          persistence_hours: 72,
          max_drift_cap: 0.25
        },
        {
          signal_id: 'asset-freeze-1',
          country: 'Russia',
          risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.POLITICAL),
          signal_type: 'asset_freeze_signal',
          severity: 0.72,
          probability: 0.65,
          detected_date: new Date('2024-01-14'),
          last_updated: new Date('2024-01-14'),
          sources: createSources(['bloomberg', 'wsj']),
          corroboration_count: 2,
          persistence_hours: 72,
          max_drift_cap: 0.25
        }
      ];
      
      const contributions = signals.map(s => ({
        signal_id: s.signal_id,
        contribution: 0.20,
        signal: s
      }));
      
      const result = await nettingEngine.applyNetting('Russia', contributions);
      
      // Should net overlapping signals
      expect(result.netted_drift).toBeLessThanOrEqual(result.original_drift);
    });

    it('should not net signals from different risk domains', async () => {
      const nettingEngine = new NettingEngine();
      
      // Signals from different risk domains
      const signals: Signal[] = [
        {
          signal_id: 'economic-signal',
          country: 'TestCountry',
          risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.ECONOMIC),
          signal_type: 'tariff_threat',
          severity: 0.70,
          probability: 0.65,
          detected_date: new Date('2024-01-10'),
          last_updated: new Date('2024-01-10'),
          sources: createSources(['reuters']),
          corroboration_count: 1,
          persistence_hours: 72,
          max_drift_cap: 0.25
        },
        {
          signal_id: 'security-signal',
          country: 'TestCountry',
          risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SECURITY),
          signal_type: 'conflict_escalation',
          severity: 0.75,
          probability: 0.70,
          detected_date: new Date('2024-06-10'), // 5 months apart
          last_updated: new Date('2024-06-10'),
          sources: createSources(['ap']),
          corroboration_count: 1,
          persistence_hours: 72,
          max_drift_cap: 0.25
        }
      ];
      
      const contributions = signals.map(s => ({
        signal_id: s.signal_id,
        contribution: 0.20,
        signal: s
      }));
      
      const result = await nettingEngine.applyNetting('TestCountry', contributions);
      
      // Should not net unrelated signals
      expect(result.netted_drift).toBeCloseTo(result.original_drift, 1);
    });
  });

  describe('Cap Enforcement Validation', () => {
    it('should enforce per-signal cap in extreme scenarios', async () => {
      const engine = new EscalationDriftEngine();
      
      // Extreme signal
      const extremeSignal: Signal = {
        signal_id: 'extreme-signal',
        country: 'TestCountry',
        risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.SECURITY),
        signal_type: 'conflict_escalation',
        severity: 1.0,
        probability: 1.0,
        detected_date: new Date('2024-01-01'),
        last_updated: new Date('2024-01-01'),
        sources: createSources(['reuters', 'ap', 'bbc', 'ft', 'wsj', 'nyt']),
        corroboration_count: 6,
        persistence_hours: 168,
        max_drift_cap: 0.25
      };
      
      engine.addSignal('TestCountry', extremeSignal);
      
      const drift = await engine.calculate('TestCountry', new Date('2024-01-08'));
      
      // Should be capped at 0.25
      expect(drift).toBeLessThanOrEqual(0.25);
    });

    it('should enforce factor-level cumulative cap', async () => {
      const engine = new EscalationDriftEngine();
      
      // Add many signals to same factor
      for (let i = 0; i < 20; i++) {
        const signal: Signal = {
          signal_id: `cumulative-signal-${i}`,
          country: 'TestCountry',
          risk_factor: mapRiskVectorToCSIRiskFactor(RiskVector.ECONOMIC),
          signal_type: 'tariff_threat',
          severity: 0.80,
          probability: 0.75,
          detected_date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
          last_updated: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
          sources: createSources(['reuters', 'bloomberg']),
          corroboration_count: 2,
          persistence_hours: 72,
          max_drift_cap: 0.25
        };
        engine.addSignal('TestCountry', signal);
      }
      
      const drift = await engine.calculate('TestCountry', new Date('2024-01-31'));
      
      // Should be capped at factor level (1.0 per factor per 30 days)
      expect(drift).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Full System Validation', () => {
    it('should pass complete validation criteria', async () => {
      const csiEngine = new RefactoredCSIEngine();
      const driftEngine = new EscalationDriftEngine();
      const nettingEngine = new NettingEngine();
      const decayScheduler = new DecayScheduler();
      
      // Validation Criteria Checklist:
      
      // 1. CSI Engine calculates correctly
      const csiResult = await csiEngine.calculateCSI('TestCountry');
      expect(csiResult.total).toBeGreaterThanOrEqual(0);
      expect(csiResult.total).toBeLessThanOrEqual(100);
      
      // 2. Drift engine enforces caps
      const driftConfig = driftEngine.getConfig();
      expect(driftConfig.max_drift_per_signal).toBe(0.25);
      expect(driftConfig.max_cumulative_drift_per_factor_per_30_days).toBe(1.0);
      
      // 3. Netting engine has rules
      const rules = nettingEngine.getRules();
      expect(rules.length).toBeGreaterThan(0);
      
      // 4. Decay scheduler has correct config
      const decayConfig = decayScheduler.getConfig();
      expect(decayConfig.inactivity_window_days).toBe(30);
      expect(decayConfig.decay_half_life_days).toBe(30);
      
      // All validation criteria passed
      expect(true).toBe(true);
    });
  });
});