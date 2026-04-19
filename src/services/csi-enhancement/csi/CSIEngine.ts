/**
 * CSI Engine
 * Calculates enhanced CSI scores with baseline drift
 */

import type { StructuredSignal } from '@/types/csi-enhancement/signals';
import type { EnhancedCSI, CSICalculationLog } from '@/types/csi-enhancement/drift';
import { DriftCalculator } from '../drift/DriftCalculator';
import { SignalStorage } from '../storage/SignalStorage';
import { CSIStorage } from './CSIStorage';
import { ExplanationGenerator } from '../explainability/ExplanationGenerator';
import { v4 as uuidv4 } from 'uuid';

export class CSIEngine {
  private driftCalculator: DriftCalculator;
  private signalStorage: SignalStorage;
  private csiStorage: CSIStorage;
  private explanationGenerator: ExplanationGenerator;

  constructor(
    signalStorage?: SignalStorage,
    csiStorage?: CSIStorage
  ) {
    this.driftCalculator = new DriftCalculator();
    this.signalStorage = signalStorage || new SignalStorage();
    this.csiStorage = csiStorage || new CSIStorage();
    this.explanationGenerator = new ExplanationGenerator();
  }

  /**
   * Calculate enhanced CSI for all countries
   */
  async calculateEnhancedCSI(
    currentDate: Date = new Date()
  ): Promise<EnhancedCSI[]> {
    const calculationRunId = uuidv4();
    const startTime = Date.now();

    console.log(`[CSI Engine] Starting calculation run: ${calculationRunId}`);

    try {
      // Start calculation log
      await this.csiStorage.startCalculationLog({
        calculationRunId,
        status: 'running',
        startedAt: new Date()
      });

      // Get qualified signals
      const signals = await this.signalStorage.findQualifiedSignals(10000);
      console.log(`[CSI Engine] Found ${signals.length} qualified signals`);

      // Calculate drifts for all country-vector pairs
      const drifts = await this.driftCalculator.calculateAllDrifts(signals, currentDate);
      console.log(`[CSI Engine] Calculated ${drifts.size} drifts`);

      // Get legacy CSI scores
      const legacyScores = await this.getLegacyCSIScores();

      // Calculate enhanced CSI for each drift
      const enhancedScores: EnhancedCSI[] = [];
      let totalDrift = 0;
      let maxDrift = 0;
      let minDrift = 0;

      for (const [key, driftResult] of drifts) {
        const [country, vector] = key.split(':');
        const legacyCSI = legacyScores.get(key) || 50; // Default to 50 if no legacy score

        const enhanced = this.calculateEnhanced(
          country,
          vector,
          legacyCSI,
          driftResult.cappedDrift,
          driftResult.contributions.map(c => c.signal),
          currentDate
        );

        enhancedScores.push(enhanced);

        // Track statistics
        totalDrift += driftResult.cappedDrift;
        maxDrift = Math.max(maxDrift, driftResult.cappedDrift);
        minDrift = Math.min(minDrift, driftResult.cappedDrift);

        // Save signal contributions
        await this.csiStorage.saveSignalContributions(
          enhanced.id!,
          driftResult.contributions
        );
      }

      // Save enhanced CSI scores
      await this.csiStorage.saveEnhancedCSI(enhancedScores);

      // Complete calculation log
      const durationMs = Date.now() - startTime;
      const avgDrift = enhancedScores.length > 0 ? totalDrift / enhancedScores.length : 0;

      await this.csiStorage.completeCalculationLog(calculationRunId, {
        countriesProcessed: new Set(enhancedScores.map(e => e.country)).size,
        vectorsProcessed: new Set(enhancedScores.map(e => e.vector)).size,
        totalCalculations: enhancedScores.length,
        avgDrift,
        maxDrift,
        minDrift,
        durationMs,
        signalsAnalyzed: signals.length,
        status: 'completed'
      });

      console.log(`[CSI Engine] Calculation complete:`);
      console.log(`  - Enhanced scores: ${enhancedScores.length}`);
      console.log(`  - Avg drift: ${avgDrift.toFixed(2)}`);
      console.log(`  - Duration: ${durationMs}ms`);

      return enhancedScores;
    } catch (error) {
      console.error('[CSI Engine] Calculation failed:', error);

      await this.csiStorage.completeCalculationLog(calculationRunId, {
        status: 'failed',
        errorMessage: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * Calculate enhanced CSI for specific country-vector
   */
  private calculateEnhanced(
    country: string,
    vector: string,
    legacyCSI: number,
    baselineDrift: number,
    signals: StructuredSignal[],
    currentDate: Date
  ): EnhancedCSI {
    // Calculate enhanced CSI
    let enhancedCSI = legacyCSI + baselineDrift;

    // Clamp to 0-100 range
    enhancedCSI = Math.max(0, Math.min(100, enhancedCSI));

    // Get top contributing signals
    const topSignals = signals
      .slice(0, 5)
      .map(s => s.signalId);

    // Generate explanation
    const explanation = this.explanationGenerator.generateExplanation(
      country,
      vector,
      legacyCSI,
      baselineDrift,
      signals.slice(0, 3)
    );

    // Calculate valid until (next calculation)
    const validUntil = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      id: uuidv4(),
      country,
      vector: vector as any,
      legacyCSI,
      baselineDrift,
      enhancedCSI,
      signalCount: signals.length,
      topSignals,
      explanation,
      calculatedAt: currentDate,
      validUntil,
      createdAt: new Date()
    };
  }

  /**
   * Get legacy CSI scores
   * In production, this would fetch from existing CSI system
   * For now, we'll use mock data
   */
  private async getLegacyCSIScores(): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    // Mock legacy CSI scores
    // In production, this would query the existing CSI database
    const countries = ['US', 'CN', 'RU', 'GB', 'DE', 'FR', 'JP', 'IN', 'BR', 'CA'];
    const vectors = ['SC1', 'SC2', 'SC3', 'SC4', 'SC5', 'SC6', 'SC7'];

    for (const country of countries) {
      for (const vector of vectors) {
        const key = `${country}:${vector}`;
        // Generate mock score between 30-70
        const score = 30 + Math.random() * 40;
        scores.set(key, score);
      }
    }

    return scores;
  }

  /**
   * Get enhanced CSI for specific country
   */
  async getEnhancedCSIForCountry(country: string): Promise<EnhancedCSI[]> {
    return this.csiStorage.getEnhancedCSIByCountry(country);
  }

  /**
   * Get enhanced CSI for specific vector
   */
  async getEnhancedCSIForVector(vector: string): Promise<EnhancedCSI[]> {
    return this.csiStorage.getEnhancedCSIByVector(vector);
  }

  /**
   * Get CSI comparison (legacy vs enhanced)
   */
  async getCSIComparison(): Promise<any[]> {
    return this.csiStorage.getCSIComparison();
  }

  /**
   * Get calculation history
   */
  async getCalculationHistory(limit: number = 20): Promise<CSICalculationLog[]> {
    return this.csiStorage.getCalculationHistory(limit);
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.signalStorage.close();
    await this.csiStorage.close();
  }
}