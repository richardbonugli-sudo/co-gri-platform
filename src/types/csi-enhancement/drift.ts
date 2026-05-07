/**
 * Drift Type Definitions for Phase 2
 * Baseline Drift Engine
 */

import type { StructuredSignal } from './signals';

/**
 * Enhanced CSI score with drift
 */
export interface EnhancedCSI {
  id?: string;
  country: string;
  vector: 'SC1' | 'SC2' | 'SC3' | 'SC4' | 'SC5' | 'SC6' | 'SC7';
  
  // Scores
  legacyCSI: number;        // Original CSI (0-100)
  baselineDrift: number;    // Calculated drift (±10)
  enhancedCSI: number;      // Final score (0-100)
  
  // Metadata
  signalCount: number;
  topSignals: string[];     // Signal IDs
  explanation: string;
  
  // Timestamps
  calculatedAt: Date;
  validUntil: Date;
  createdAt?: Date;
}

/**
 * Signal contribution to drift
 */
export interface SignalContribution {
  signalId: string;
  signal: StructuredSignal;
  impactScore: number;
  decayFactor: number;
  contribution: number;
}

/**
 * Drift calculation result
 */
export interface DriftCalculationResult {
  country: string;
  vector: string;
  drift: number;
  contributions: SignalContribution[];
  totalImpact: number;
  cappedDrift: number;
}

/**
 * CSI calculation log
 */
export interface CSICalculationLog {
  id?: string;
  calculationRunId: string;
  
  // Statistics
  countriesProcessed: number;
  vectorsProcessed: number;
  totalCalculations: number;
  avgDrift: number;
  maxDrift: number;
  minDrift: number;
  
  // Performance
  durationMs: number;
  signalsAnalyzed: number;
  
  // Status
  status: 'running' | 'completed' | 'failed';
  errorMessage?: string;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
}

/**
 * CSI comparison (legacy vs enhanced)
 */
export interface CSIComparison {
  country: string;
  vector: string;
  legacyCSI: number;
  enhancedCSI: number;
  baselineDrift: number;
  difference: number;
  divergenceLevel: 'minor' | 'moderate' | 'significant';
  calculatedAt: Date;
}

/**
 * Drift configuration
 */
export interface DriftConfig {
  halfLifeDays: number;        // Default: 90 (3 months)
  maxDrift: number;             // Default: 10
  vectorWeights: Record<string, number>;
  severityMultipliers: Record<string, number>;
}

/**
 * Vector weights for impact calculation
 */
export const VECTOR_WEIGHTS: Record<string, number> = {
  SC1: 3.0,  // Sanctions & Trade Restrictions
  SC2: 2.5,  // Capital Controls & FX Restrictions
  SC3: 4.0,  // Nationalization & Expropriation
  SC4: 5.0,  // Conflict & Security
  SC5: 2.0,  // Political Instability
  SC6: 1.5,  // Regulatory & Legal
  SC7: 2.0   // Cyber & Technology
};

/**
 * Severity multipliers
 */
export const SEVERITY_MULTIPLIERS: Record<string, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.5,
  critical: 2.0
};

/**
 * Default drift configuration
 */
export const DEFAULT_DRIFT_CONFIG: DriftConfig = {
  halfLifeDays: 90,
  maxDrift: 10,
  vectorWeights: VECTOR_WEIGHTS,
  severityMultipliers: SEVERITY_MULTIPLIERS
};