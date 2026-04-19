/**
 * Forecast Engine - Generates forward-looking geopolitical risk forecasts
 * Part of CO-GRI Platform Phase 2 Implementation - Task 2
 */

export interface ForecastEvent {
  event_id: string;
  event_name: string;
  probability: number; // 0-1
  expected_date: Date;
  duration_days: number;
  affected_countries: string[];
  affected_sectors: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  delta_csi: number; // Expected change in CSI
  description: string;
  confidence: number; // 0-1
}

export interface ForecastImpact {
  company_ticker: string;
  forecast_event_id: string;
  expected_cogri_change: number;
  probability_weighted_impact: number;
  affected_channels: {
    revenue: number;
    supply: number;
    assets: number;
    financial: number;
  };
  timeline: {
    start_date: Date;
    peak_date: Date;
    end_date: Date;
  };
}

class ForecastEngine {
  private forecastEvents: Map<string, ForecastEvent> = new Map();

  constructor() {
    this.initializeSeedForecasts();
  }

  /**
   * Initialize seed forecast events for demonstration
   */
  private initializeSeedForecasts(): void {
    const seedForecasts: ForecastEvent[] = [
      {
        event_id: 'fcst_001',
        event_name: 'US-China Trade Negotiations',
        probability: 0.65,
        expected_date: new Date('2024-06-15'),
        duration_days: 90,
        affected_countries: ['United States', 'China', 'Taiwan', 'South Korea'],
        affected_sectors: ['Technology', 'Semiconductors', 'Electronics', 'Manufacturing'],
        severity: 'high',
        delta_csi: 15,
        description: 'Potential trade agreement could reduce tariffs on technology goods by 10-15%',
        confidence: 0.72
      },
      {
        event_id: 'fcst_002',
        event_name: 'EU Carbon Border Tax Implementation',
        probability: 0.85,
        expected_date: new Date('2024-07-01'),
        duration_days: 365,
        affected_countries: ['Germany', 'France', 'Italy', 'Spain', 'Poland'],
        affected_sectors: ['Manufacturing', 'Steel', 'Cement', 'Chemicals'],
        severity: 'medium',
        delta_csi: 8,
        description: 'Carbon Border Adjustment Mechanism to impose tariffs on carbon-intensive imports',
        confidence: 0.88
      },
      {
        event_id: 'fcst_003',
        event_name: 'India Digital Economy Expansion',
        probability: 0.78,
        expected_date: new Date('2024-08-01'),
        duration_days: 180,
        affected_countries: ['India', 'Singapore', 'United States'],
        affected_sectors: ['Technology', 'Finance', 'Telecommunications'],
        severity: 'low',
        delta_csi: -5,
        description: 'New digital infrastructure investments expected to reduce regulatory barriers',
        confidence: 0.81
      },
      {
        event_id: 'fcst_004',
        event_name: 'Middle East Energy Transition',
        probability: 0.55,
        expected_date: new Date('2024-09-01'),
        duration_days: 540,
        affected_countries: ['Saudi Arabia', 'United Arab Emirates', 'Qatar'],
        affected_sectors: ['Energy', 'Renewable Energy', 'Construction'],
        severity: 'medium',
        delta_csi: -3,
        description: 'Regional shift toward renewable energy could stabilize geopolitical tensions',
        confidence: 0.68
      },
      {
        event_id: 'fcst_005',
        event_name: 'Latin America Trade Bloc Formation',
        probability: 0.42,
        expected_date: new Date('2024-10-15'),
        duration_days: 270,
        affected_countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Mexico'],
        affected_sectors: ['Agriculture', 'Mining', 'Manufacturing'],
        severity: 'low',
        delta_csi: -7,
        description: 'Potential regional trade agreement to reduce intra-regional tariffs',
        confidence: 0.59
      },
      {
        event_id: 'fcst_006',
        event_name: 'Southeast Asia Supply Chain Diversification',
        probability: 0.73,
        expected_date: new Date('2024-05-01'),
        duration_days: 450,
        affected_countries: ['Vietnam', 'Thailand', 'Indonesia', 'Malaysia', 'Philippines'],
        affected_sectors: ['Electronics', 'Textiles', 'Manufacturing', 'Automotive'],
        severity: 'medium',
        delta_csi: -4,
        description: 'Companies relocating production from China to Southeast Asia',
        confidence: 0.79
      },
      {
        event_id: 'fcst_007',
        event_name: 'Global Semiconductor Shortage Resolution',
        probability: 0.61,
        expected_date: new Date('2024-12-01'),
        duration_days: 180,
        affected_countries: ['Taiwan', 'South Korea', 'United States', 'Japan'],
        affected_sectors: ['Semiconductors', 'Electronics', 'Automotive', 'Technology'],
        severity: 'high',
        delta_csi: -12,
        description: 'New fab capacity coming online expected to ease supply constraints',
        confidence: 0.75
      },
      {
        event_id: 'fcst_008',
        event_name: 'African Continental Free Trade Area Expansion',
        probability: 0.68,
        expected_date: new Date('2024-07-15'),
        duration_days: 365,
        affected_countries: ['South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Ghana'],
        affected_sectors: ['Agriculture', 'Mining', 'Manufacturing', 'Logistics'],
        severity: 'low',
        delta_csi: -6,
        description: 'Increased participation in AfCFTA expected to boost intra-African trade',
        confidence: 0.71
      }
    ];

    seedForecasts.forEach(forecast => {
      this.forecastEvents.set(forecast.event_id, forecast);
    });

    console.log(`[Forecast Engine] ✅ Initialized with ${seedForecasts.length} forecast events`);
  }

  /**
   * Get all forecast events
   */
  getAllForecasts(): ForecastEvent[] {
    return Array.from(this.forecastEvents.values()).sort(
      (a, b) => a.expected_date.getTime() - b.expected_date.getTime()
    );
  }

  /**
   * Get forecasts relevant to a specific company based on exposure
   */
  getRelevantForecasts(
    countryExposures: { country: string; exposureWeight: number }[],
    sector: string,
    minRelevanceScore: number = 0.3
  ): Array<ForecastEvent & { relevanceScore: number }> {
    const forecasts = this.getAllForecasts();
    
    return forecasts
      .map(forecast => {
        let relevanceScore = 0;
        
        // Country overlap
        const exposedCountries = new Set(countryExposures.map(ce => ce.country));
        const affectedCountries = new Set(forecast.affected_countries);
        const countryOverlap = [...exposedCountries].filter(c => affectedCountries.has(c));
        
        if (countryOverlap.length > 0) {
          const totalExposure = countryOverlap.reduce((sum, country) => {
            const exposure = countryExposures.find(ce => ce.country === country);
            return sum + (exposure?.exposureWeight || 0);
          }, 0);
          relevanceScore += totalExposure * 0.6; // 60% weight on country exposure
        }
        
        // Sector match
        if (forecast.affected_sectors.includes(sector)) {
          relevanceScore += 0.3; // 30% weight on sector match
        }
        
        // Probability and severity
        relevanceScore += (forecast.probability * 0.1); // 10% weight on probability
        
        return {
          ...forecast,
          relevanceScore
        };
      })
      .filter(f => f.relevanceScore >= minRelevanceScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate forecast impact on a company
   */
  calculateForecastImpact(
    ticker: string,
    forecastEventId: string,
    countryExposures: { country: string; exposureWeight: number }[],
    currentCOGRI: number
  ): ForecastImpact | null {
    const forecast = this.forecastEvents.get(forecastEventId);
    if (!forecast) return null;

    // Calculate exposure to affected countries
    const affectedExposure = countryExposures
      .filter(ce => forecast.affected_countries && Array.isArray(forecast.affected_countries) && forecast.affected_countries.includes(ce.country))
      .reduce((sum, ce) => sum + ce.exposureWeight, 0);

    // Expected COGRI change = delta_csi * affected_exposure * probability
    const expectedChange = forecast.delta_csi * affectedExposure * forecast.probability;

    // Distribute impact across channels (simplified)
    const channelImpact = {
      revenue: expectedChange * 0.4,
      supply: expectedChange * 0.35,
      assets: expectedChange * 0.15,
      financial: expectedChange * 0.1
    };

    return {
      company_ticker: ticker,
      forecast_event_id: forecastEventId,
      expected_cogri_change: expectedChange,
      probability_weighted_impact: expectedChange,
      affected_channels: channelImpact,
      timeline: {
        start_date: forecast.expected_date,
        peak_date: new Date(forecast.expected_date.getTime() + (forecast.duration_days / 2) * 24 * 60 * 60 * 1000),
        end_date: new Date(forecast.expected_date.getTime() + forecast.duration_days * 24 * 60 * 60 * 1000)
      }
    };
  }

  /**
   * Get forecast statistics
   */
  getStatistics(): {
    totalForecasts: number;
    bySeverity: Record<string, number>;
    byProbability: { high: number; medium: number; low: number };
    averageConfidence: number;
  } {
    const forecasts = this.getAllForecasts();
    
    return {
      totalForecasts: forecasts.length,
      bySeverity: forecasts.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byProbability: {
        high: forecasts.filter(f => f.probability >= 0.7).length,
        medium: forecasts.filter(f => f.probability >= 0.4 && f.probability < 0.7).length,
        low: forecasts.filter(f => f.probability < 0.4).length
      },
      averageConfidence: forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
    };
  }
}

// Singleton instance
export const forecastEngine = new ForecastEngine();