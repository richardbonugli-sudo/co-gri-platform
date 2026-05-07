/**
 * Exposure Pathway Analyzer - Analyzes how forecast events impact through different channels
 * Part of CO-GRI Platform Phase 2 Implementation - Task 2
 */

import { ForecastEvent } from './forecastEngine';

export interface ChannelPathway {
  channel: 'Revenue' | 'Supply' | 'Assets' | 'Financial';
  exposureWeight: number;
  forecastImpact: number;
  transmissionMechanism: string;
  timeToImpact: number; // days
  impactDuration: number; // days
}

export interface PathwayAnalysis {
  forecast_event_id: string;
  company_ticker: string;
  pathways: ChannelPathway[];
  totalImpact: number;
  primaryChannel: string;
  riskAmplification: number; // multiplier effect
}

export class ExposurePathwayAnalyzer {
  /**
   * Analyze how a forecast event impacts a company through different channels
   */
  analyzePathways(
    event: ForecastEvent,
    companyData: {
      ticker: string;
      sector: string;
      countryExposures: { country: string; exposureWeight: number }[];
      channelBreakdown?: Record<string, {
        revenue?: { weight: number };
        supply?: { weight: number };
        assets?: { weight: number };
        operations?: { weight: number };
      }>;
    }
  ): PathwayAnalysis {
    const pathways: ChannelPathway[] = [];

    // Calculate affected country exposure
    const affectedCountries = event.affected_countries;
    const affectedExposure = companyData.countryExposures
      .filter(ce => affectedCountries.includes(ce.country))
      .reduce((sum, ce) => sum + ce.exposureWeight, 0);

    // Analyze Revenue Channel
    const revenuePathway = this.analyzeRevenueChannel(event, companyData, affectedExposure);
    if (revenuePathway) pathways.push(revenuePathway);

    // Analyze Supply Channel
    const supplyPathway = this.analyzeSupplyChannel(event, companyData, affectedExposure);
    if (supplyPathway) pathways.push(supplyPathway);

    // Analyze Assets Channel
    const assetsPathway = this.analyzeAssetsChannel(event, companyData, affectedExposure);
    if (assetsPathway) pathways.push(assetsPathway);

    // Analyze Financial Channel
    const financialPathway = this.analyzeFinancialChannel(event, companyData, affectedExposure);
    if (financialPathway) pathways.push(financialPathway);

    // Calculate total impact and identify primary channel
    const totalImpact = pathways.reduce((sum, p) => sum + Math.abs(p.forecastImpact), 0);
    const primaryChannel = pathways.reduce((max, p) => 
      Math.abs(p.forecastImpact) > Math.abs(max.forecastImpact) ? p : max
    , pathways[0])?.channel || 'Revenue';

    // Calculate risk amplification (cross-channel effects)
    const riskAmplification = this.calculateRiskAmplification(pathways, event);

    return {
      forecast_event_id: event.event_id,
      company_ticker: companyData.ticker,
      pathways,
      totalImpact: totalImpact * riskAmplification,
      primaryChannel,
      riskAmplification
    };
  }

  /**
   * Analyze Revenue Channel impact
   */
  private analyzeRevenueChannel(
    event: ForecastEvent,
    companyData: any,
    affectedExposure: number
  ): ChannelPathway | null {
    // Revenue is most affected by tariffs, trade agreements, demand shocks
    const revenueMultiplier = this.getChannelMultiplier(event, 'Revenue');
    const impact = event.delta_csi * affectedExposure * event.probability * revenueMultiplier * 0.4;

    return {
      channel: 'Revenue',
      exposureWeight: affectedExposure * 0.4,
      forecastImpact: impact,
      transmissionMechanism: this.getTransmissionMechanism(event, 'Revenue'),
      timeToImpact: this.getTimeToImpact(event, 'Revenue'),
      impactDuration: event.duration_days
    };
  }

  /**
   * Analyze Supply Channel impact
   */
  private analyzeSupplyChannel(
    event: ForecastEvent,
    companyData: any,
    affectedExposure: number
  ): ChannelPathway | null {
    // Supply is most affected by production disruptions, logistics issues
    const supplyMultiplier = this.getChannelMultiplier(event, 'Supply');
    const impact = event.delta_csi * affectedExposure * event.probability * supplyMultiplier * 0.35;

    return {
      channel: 'Supply',
      exposureWeight: affectedExposure * 0.35,
      forecastImpact: impact,
      transmissionMechanism: this.getTransmissionMechanism(event, 'Supply'),
      timeToImpact: this.getTimeToImpact(event, 'Supply'),
      impactDuration: event.duration_days
    };
  }

  /**
   * Analyze Assets Channel impact
   */
  private analyzeAssetsChannel(
    event: ForecastEvent,
    companyData: any,
    affectedExposure: number
  ): ChannelPathway | null {
    // Assets affected by expropriation risk, property rights
    const assetsMultiplier = this.getChannelMultiplier(event, 'Assets');
    const impact = event.delta_csi * affectedExposure * event.probability * assetsMultiplier * 0.15;

    return {
      channel: 'Assets',
      exposureWeight: affectedExposure * 0.15,
      forecastImpact: impact,
      transmissionMechanism: this.getTransmissionMechanism(event, 'Assets'),
      timeToImpact: this.getTimeToImpact(event, 'Assets'),
      impactDuration: event.duration_days
    };
  }

  /**
   * Analyze Financial Channel impact
   */
  private analyzeFinancialChannel(
    event: ForecastEvent,
    companyData: any,
    affectedExposure: number
  ): ChannelPathway | null {
    // Financial affected by currency risk, capital controls, banking restrictions
    const financialMultiplier = this.getChannelMultiplier(event, 'Financial');
    const impact = event.delta_csi * affectedExposure * event.probability * financialMultiplier * 0.1;

    return {
      channel: 'Financial',
      exposureWeight: affectedExposure * 0.1,
      forecastImpact: impact,
      transmissionMechanism: this.getTransmissionMechanism(event, 'Financial'),
      timeToImpact: this.getTimeToImpact(event, 'Financial'),
      impactDuration: event.duration_days
    };
  }

  /**
   * Get channel-specific multiplier based on event type
   */
  private getChannelMultiplier(event: ForecastEvent, channel: string): number {
    // Event name patterns that affect different channels
    const eventName = event.event_name.toLowerCase();
    
    if (channel === 'Revenue') {
      if (eventName.includes('trade') || eventName.includes('tariff')) return 1.5;
      if (eventName.includes('demand') || eventName.includes('market')) return 1.3;
      return 1.0;
    }
    
    if (channel === 'Supply') {
      if (eventName.includes('supply') || eventName.includes('production')) return 1.5;
      if (eventName.includes('logistics') || eventName.includes('transport')) return 1.4;
      return 1.0;
    }
    
    if (channel === 'Assets') {
      if (eventName.includes('property') || eventName.includes('expropriation')) return 1.6;
      if (eventName.includes('infrastructure')) return 1.3;
      return 1.0;
    }
    
    if (channel === 'Financial') {
      if (eventName.includes('currency') || eventName.includes('capital')) return 1.5;
      if (eventName.includes('banking') || eventName.includes('payment')) return 1.4;
      return 1.0;
    }
    
    return 1.0;
  }

  /**
   * Get transmission mechanism description
   */
  private getTransmissionMechanism(event: ForecastEvent, channel: string): string {
    const mechanisms: Record<string, string> = {
      'Revenue': 'Customer demand shifts, pricing pressure, market access restrictions',
      'Supply': 'Production disruptions, supplier constraints, logistics delays',
      'Assets': 'Property value changes, operational restrictions, infrastructure impact',
      'Financial': 'Currency fluctuations, capital flow restrictions, payment system disruptions'
    };
    
    return mechanisms[channel] || 'Direct exposure impact';
  }

  /**
   * Get time to impact (days until effect is felt)
   */
  private getTimeToImpact(event: ForecastEvent, channel: string): number {
    // Different channels have different lag times
    const lagTimes: Record<string, number> = {
      'Revenue': 30,      // ~1 month for demand effects
      'Supply': 14,       // ~2 weeks for supply disruptions
      'Assets': 90,       // ~3 months for asset value changes
      'Financial': 7      // ~1 week for financial market reactions
    };
    
    return lagTimes[channel] || 30;
  }

  /**
   * Calculate risk amplification from cross-channel effects
   */
  private calculateRiskAmplification(pathways: ChannelPathway[], event: ForecastEvent): number {
    // Base amplification
    let amplification = 1.0;
    
    // If multiple channels are significantly affected, there's amplification
    const significantPathways = pathways.filter(p => Math.abs(p.forecastImpact) > 1.0);
    
    if (significantPathways.length >= 3) {
      amplification += 0.15; // 15% amplification for 3+ channels
    } else if (significantPathways.length === 2) {
      amplification += 0.08; // 8% amplification for 2 channels
    }
    
    // High severity events have additional amplification
    if (event.severity === 'critical') {
      amplification += 0.10;
    } else if (event.severity === 'high') {
      amplification += 0.05;
    }
    
    return amplification;
  }
}

// Singleton instance
export const exposurePathwayAnalyzer = new ExposurePathwayAnalyzer();

// Export standalone function for backward compatibility
export function analyzeExposurePathways(
  event: ForecastEvent,
  companyData: {
    ticker: string;
    sector: string;
    countryExposures: { country: string; exposureWeight: number }[];
    channelBreakdown?: Record<string, {
      revenue?: { weight: number };
      supply?: { weight: number };
      assets?: { weight: number };
      operations?: { weight: number };
    }>;
  }
): PathwayAnalysis {
  return exposurePathwayAnalyzer.analyzePathways(event, companyData);
}