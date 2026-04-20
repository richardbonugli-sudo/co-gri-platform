/**
 * Baseline Calculator
 * Calculates historical baseline scores from authoritative sources
 */

import { RiskVector, HistoricalBaseline, SourceTier } from '../types';
import { sourceRegistry } from '../sources/SourceRegistry';

export class BaselineCalculator {
  private baselines: Map<string, Map<RiskVector, HistoricalBaseline>> = new Map();

  /**
   * Calculate baseline for country/vector
   */
  async calculateBaseline(
    country: string,
    vector: RiskVector,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalBaseline> {
    // Get authoritative sources for this vector
    const sources = sourceRegistry.getAuthoritativeSources(vector);

    if (sources.length === 0) {
      throw new Error(`No authoritative sources found for vector ${vector}`);
    }

    // Collect data points from sources
    const dataPoints: HistoricalBaseline['dataPoints'] = [];

    // Simulate data collection (in production, fetch from actual sources)
    for (const source of sources) {
      const points = await this.fetchSourceData(source.sourceId, country, startDate, endDate);
      dataPoints.push(...points);
    }

    if (dataPoints.length === 0) {
      throw new Error(`No data available for ${country} ${vector}`);
    }

    // Calculate composite baseline using weighted average
    const baselineScore = this.calculateCompositeScore(dataPoints, sources);

    // Calculate statistics
    const scores = dataPoints.map(p => p.score);
    const statistics = {
      mean: this.calculateMean(scores),
      median: this.calculateMedian(scores),
      stdDev: this.calculateStdDev(scores),
      min: Math.min(...scores),
      max: Math.max(...scores)
    };

    const baseline: HistoricalBaseline = {
      country,
      vector,
      period: { start: startDate, end: endDate },
      baselineScore,
      dataPoints,
      statistics,
      lastCalculated: new Date()
    };

    // Cache baseline
    if (!this.baselines.has(country)) {
      this.baselines.set(country, new Map());
    }
    this.baselines.get(country)!.set(vector, baseline);

    return baseline;
  }

  /**
   * Fetch data from source (simulated)
   */
  private async fetchSourceData(
    sourceId: string,
    country: string,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalBaseline['dataPoints']> {
    // In production, this would fetch from actual APIs
    // For now, generate synthetic baseline data
    
    const dataPoints: HistoricalBaseline['dataPoints'] = [];
    const source = sourceRegistry.getSource(sourceId);
    
    if (!source) return dataPoints;

    // Generate quarterly data points
    const currentDate = new Date(startDate);
    const baseScore = 50 + Math.random() * 20; // 50-70 range

    while (currentDate <= endDate) {
      dataPoints.push({
        date: new Date(currentDate),
        score: baseScore + (Math.random() - 0.5) * 10, // ±5 variation
        source: sourceId
      });

      // Move to next quarter
      currentDate.setMonth(currentDate.getMonth() + 3);
    }

    return dataPoints;
  }

  /**
   * Calculate composite score from multiple sources
   * Uses weighted average based on source reliability
   */
  private calculateCompositeScore(
    dataPoints: HistoricalBaseline['dataPoints'],
    sources: any[]
  ): number {
    // Group by source
    const sourceScores = new Map<string, number[]>();
    
    for (const point of dataPoints) {
      if (!sourceScores.has(point.source)) {
        sourceScores.set(point.source, []);
      }
      sourceScores.get(point.source)!.push(point.score);
    }

    // Calculate weighted average
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [sourceId, scores] of sourceScores.entries()) {
      const source = sourceRegistry.getSource(sourceId);
      if (!source) continue;

      const avgScore = this.calculateMean(scores);
      const weight = source.reliabilityScore;

      weightedSum += avgScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50; // Default to 50 if no data
  }

  /**
   * Get cached baseline
   */
  getBaseline(country: string, vector: RiskVector): HistoricalBaseline | undefined {
    return this.baselines.get(country)?.get(vector);
  }

  /**
   * Get or calculate baseline
   */
  async getOrCalculateBaseline(
    country: string,
    vector: RiskVector
  ): Promise<HistoricalBaseline> {
    const cached = this.getBaseline(country, vector);
    
    if (cached) {
      // Check if baseline is stale (older than 90 days)
      const age = Date.now() - cached.lastCalculated.getTime();
      const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
      
      if (age < maxAge) {
        return cached;
      }
    }

    // Calculate new baseline (last 2 years)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    return this.calculateBaseline(country, vector, startDate, endDate);
  }

  /**
   * Statistical helper functions
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Seed baselines for common countries
   */
  async seedBaselines(countries: string[]): Promise<void> {
    const vectors = Object.values(RiskVector);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    for (const country of countries) {
      for (const vector of vectors) {
        try {
          await this.calculateBaseline(country, vector, startDate, endDate);
          console.log(`Seeded baseline for ${country} ${vector}`);
        } catch (error) {
          console.error(`Failed to seed baseline for ${country} ${vector}:`, error);
        }
      }
    }
  }
}

// Singleton instance
export const baselineCalculator = new BaselineCalculator();