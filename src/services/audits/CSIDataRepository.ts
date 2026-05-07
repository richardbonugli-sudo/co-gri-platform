/**
 * CSI Data Repository
 * 
 * Provides read-only access to CSI database for audit purposes.
 * This is a mock implementation for demonstration.
 */

import { 
  CSIRiskVector, 
  TimeWindow,
  VectorTotals,
  BaselineFactor,
  VectorActivityData
} from '../../types/audit.types';

export class CSIDataRepository {
  /**
   * Get movement data for time window
   */
  async getMovementData(timeWindow: TimeWindow): Promise<VectorTotals[]> {
    // Mock data for demonstration
    const mockData: VectorTotals[] = [
      {
        vector: CSIRiskVector.GOVERNANCE_RULE_OF_LAW,
        total_drift_points: 312.5,
        total_event_points: 112.3,
        total_movement_points: 424.8,
        total_confirmed_items: 31,
        total_detected_items: 203,
        items_suppressed: 15,
        items_discarded_pre_scoring: 67
      },
      {
        vector: CSIRiskVector.CONFLICT_SECURITY,
        total_drift_points: 245.3,
        total_event_points: 89.7,
        total_movement_points: 335.0,
        total_confirmed_items: 23,
        total_detected_items: 156,
        items_suppressed: 12,
        items_discarded_pre_scoring: 45
      },
      {
        vector: CSIRiskVector.SANCTIONS_REGULATORY,
        total_drift_points: 178.2,
        total_event_points: 67.4,
        total_movement_points: 245.6,
        total_confirmed_items: 18,
        total_detected_items: 134,
        items_suppressed: 8,
        items_discarded_pre_scoring: 38
      },
      {
        vector: CSIRiskVector.TRADE_LOGISTICS,
        total_drift_points: 156.8,
        total_event_points: 45.2,
        total_movement_points: 202.0,
        total_confirmed_items: 15,
        total_detected_items: 98,
        items_suppressed: 6,
        items_discarded_pre_scoring: 22
      },
      {
        vector: CSIRiskVector.CIVIL_UNREST,
        total_drift_points: 134.6,
        total_event_points: 56.8,
        total_movement_points: 191.4,
        total_confirmed_items: 14,
        total_detected_items: 112,
        items_suppressed: 7,
        items_discarded_pre_scoring: 29
      },
      {
        vector: CSIRiskVector.CURRENCY_CAPITAL_CONTROLS,
        total_drift_points: 98.7,
        total_event_points: 34.5,
        total_movement_points: 133.2,
        total_confirmed_items: 11,
        total_detected_items: 89,
        items_suppressed: 5,
        items_discarded_pre_scoring: 24
      },
      {
        vector: CSIRiskVector.CYBER_DATA,
        total_drift_points: 89.4,
        total_event_points: 23.1,
        total_movement_points: 112.5,
        total_confirmed_items: 8,
        total_detected_items: 67,
        items_suppressed: 4,
        items_discarded_pre_scoring: 18
      }
    ];

    return mockData;
  }

  /**
   * Get baseline factors for countries
   */
  async getBaselineFactors(countryIds: string[]): Promise<BaselineFactor[]> {
    // Mock baseline data
    const mockFactors: BaselineFactor[] = [];
    const countries = [
      { id: 'ARG', name: 'Argentina' },
      { id: 'BRA', name: 'Brazil' },
      { id: 'CHN', name: 'China' }
    ];

    for (const country of countries.slice(0, Math.min(countryIds.length, 3))) {
      const vectors = Object.values(CSIRiskVector);
      for (const vector of vectors) {
        mockFactors.push({
          country_id: country.id,
          country_name: country.name,
          vector,
          factor_value: Math.random() * 5 + 2,
          source: this.getSourceForVector(vector),
          timestamp: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          fallback_type: Math.random() > 0.8 ? 'regional' : 'direct',
          weight: Math.random() > 0.8 ? 0.7 : 1.0,
          weighted_contribution: 0
        });
      }
    }

    // Calculate weighted contributions
    mockFactors.forEach(f => {
      f.weighted_contribution = f.factor_value * f.weight;
    });

    return mockFactors;
  }

  /**
   * Get rolling vector activity data
   */
  async getRollingVectorActivity(timeWindow: TimeWindow): Promise<VectorActivityData[]> {
    const mockData: VectorActivityData[] = [];
    const vectors = Object.values(CSIRiskVector);
    const months = this.generateMonthRange(12);

    for (const month of months) {
      for (const vector of vectors) {
        mockData.push({
          month,
          vector,
          total_drift_points: Math.random() * 100 + 50,
          total_event_points: Math.random() * 50 + 20,
          confirmed_items: Math.floor(Math.random() * 15) + 5
        });
      }
    }

    return mockData;
  }

  private getSourceForVector(vector: CSIRiskVector): string {
    const sources: Record<CSIRiskVector, string> = {
      [CSIRiskVector.CONFLICT_SECURITY]: 'IISS Military Balance',
      [CSIRiskVector.SANCTIONS_REGULATORY]: 'OFAC Registry',
      [CSIRiskVector.TRADE_LOGISTICS]: 'WTO Trade Index',
      [CSIRiskVector.GOVERNANCE_RULE_OF_LAW]: 'V-Dem Index',
      [CSIRiskVector.CYBER_DATA]: 'CISA Advisories',
      [CSIRiskVector.CIVIL_UNREST]: 'ACLED Data',
      [CSIRiskVector.CURRENCY_CAPITAL_CONTROLS]: 'IMF AREAER'
    };
    return sources[vector];
  }

  private generateMonthRange(months: number): string[] {
    const result: string[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(date.toISOString().slice(0, 7));
    }
    
    return result;
  }
}