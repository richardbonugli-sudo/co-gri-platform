/**
 * Deep Linking Infrastructure
 * Enables cross-mode navigation with context prefill
 * Part of CO-GRI Platform Phase 3 - Week 6
 * 
 * Implements cross-mode navigation patterns from specification
 */

import { Mode, SelectedEntity } from '@/store/globalState';
import { CountryExposure } from '@/services/cogriCalculationService';
import { TimelineEvent } from '@/utils/timelineEvents';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Navigation context for cross-mode transitions
 */
export interface NavigationContext {
  fromMode: Mode;
  toMode: Mode;
  prefillData?: Record<string, any>;
  preserveSelection?: boolean;
}

/**
 * Deep link parameters
 */
export interface DeepLinkParams {
  mode: Mode;
  country?: string;
  company?: string;
  sector?: string;
  portfolio?: string;
  lens?: string;
  timeWindow?: string;
  [key: string]: string | undefined;
}

// ============================================================================
// DEEP LINKING SERVICE
// ============================================================================

class DeepLinkingService {
  /**
   * Navigate from Company Mode to Scenario Mode
   * Prefills scenario builder with company's exposure countries
   * 
   * @param companyTicker - Company ticker symbol
   * @param exposures - Company's country exposures
   * @returns Navigation context
   */
  companyToScenario(
    companyTicker: string,
    exposures: CountryExposure[]
  ): NavigationContext {
    // Extract top exposure countries (>5% threshold)
    const topCountries = exposures
      .filter(exp => exp.exposureWeight >= 0.05)
      .sort((a, b) => b.exposureWeight - a.exposureWeight)
      .slice(0, 5)
      .map(exp => exp.country);
    
    return {
      fromMode: 'Company',
      toMode: 'Scenario',
      prefillData: {
        sourceCompany: companyTicker,
        affectedCountries: topCountries,
        exposureWeights: exposures
          .filter(exp => topCountries.includes(exp.country))
          .reduce((acc, exp) => {
            acc[exp.country] = exp.exposureWeight;
            return acc;
          }, {} as Record<string, number>)
      },
      preserveSelection: true
    };
  }
  
  /**
   * Navigate from Forecast Mode to Company Mode
   * Prefills company analysis with forecast events
   * 
   * @param events - Forecast events to apply
   * @param companyTicker - Optional company ticker
   * @returns Navigation context
   */
  forecastToCompany(
    events: TimelineEvent[],
    companyTicker?: string
  ): NavigationContext {
    return {
      fromMode: 'Forecast',
      toMode: 'Company',
      prefillData: {
        forecastEvents: events,
        activeLens: 'Forecast Overlay',
        highlightedCountries: events.flatMap(e => e.affected_countries)
      },
      preserveSelection: !!companyTicker
    };
  }
  
  /**
   * Navigate from Company Mode to Forecast Mode
   * Filters forecast events by company's exposure countries
   * 
   * @param companyTicker - Company ticker symbol
   * @param exposures - Company's country exposures
   * @returns Navigation context
   */
  companyToForecast(
    companyTicker: string,
    exposures: CountryExposure[]
  ): NavigationContext {
    const exposureCountries = exposures.map(exp => exp.country);
    
    return {
      fromMode: 'Company',
      toMode: 'Forecast',
      prefillData: {
        sourceCompany: companyTicker,
        filterCountries: exposureCountries,
        exposureWeights: exposures.reduce((acc, exp) => {
          acc[exp.country] = exp.exposureWeight;
          return acc;
        }, {} as Record<string, number>)
      },
      preserveSelection: true
    };
  }
  
  /**
   * Navigate from Scenario Mode to Company Mode
   * Applies scenario results to company analysis
   * 
   * @param scenarioId - Scenario identifier
   * @param scenarioResults - Scenario impact results
   * @param companyTicker - Optional company ticker
   * @returns Navigation context
   */
  scenarioToCompany(
    scenarioId: string,
    scenarioResults: any,
    companyTicker?: string
  ): NavigationContext {
    return {
      fromMode: 'Scenario',
      toMode: 'Company',
      prefillData: {
        activeScenario: scenarioId,
        scenarioResults,
        activeLens: 'Scenario Shock'
      },
      preserveSelection: !!companyTicker
    };
  }
  
  /**
   * Navigate from Country Mode to Company Mode
   * Shows companies with exposure to selected country
   * 
   * @param country - Country name
   * @returns Navigation context
   */
  countryToCompany(country: string): NavigationContext {
    return {
      fromMode: 'Country',
      toMode: 'Company',
      prefillData: {
        filterCountry: country,
        highlightedCountries: [country]
      },
      preserveSelection: false
    };
  }
  
  /**
   * Navigate from Trading Mode to Company Mode
   * Applies trading signals to company analysis
   * 
   * @param companyTicker - Company ticker symbol
   * @param signals - Trading signals
   * @returns Navigation context
   */
  tradingToCompany(
    companyTicker: string,
    signals: any
  ): NavigationContext {
    return {
      fromMode: 'Trading',
      toMode: 'Company',
      prefillData: {
        tradingSignals: signals,
        activeLens: 'Trading Signal'
      },
      preserveSelection: true
    };
  }
  
  /**
   * Generate deep link URL with parameters
   * 
   * @param params - Deep link parameters
   * @returns URL string
   */
  generateDeepLink(params: DeepLinkParams): string {
    const { mode, ...rest } = params;
    const basePath = this.getModeRoute(mode);
    
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }
  
  /**
   * Parse deep link URL
   * 
   * @param url - URL string
   * @returns Deep link parameters
   */
  parseDeepLink(url: string): DeepLinkParams | null {
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;
      
      // Extract mode from pathname
      const mode = this.extractModeFromPath(pathname);
      if (!mode) return null;
      
      // Extract parameters
      const params: DeepLinkParams = { mode };
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return params;
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }
  
  /**
   * Apply navigation context to global state
   * 
   * @param context - Navigation context
   * @param setState - State setter function
   */
  applyNavigationContext(
    context: NavigationContext,
    setState: (state: Partial<SelectedEntity>) => void
  ): void {
    if (context.preserveSelection && context.prefillData) {
      // Preserve and update selection
      const updates: Partial<SelectedEntity> = {};
      
      if (context.prefillData.sourceCompany) {
        updates.company = context.prefillData.sourceCompany;
      }
      if (context.prefillData.filterCountry) {
        updates.country = context.prefillData.filterCountry;
      }
      
      setState(updates);
    }
  }
  
  /**
   * Get mode route path
   */
  private getModeRoute(mode: Mode): string {
    const routes: Record<Mode, string> = {
      'Country': '/country',
      'Company': '/company',
      'Forecast': '/forecast',
      'Scenario': '/scenario',
      'Trading': '/trading'
    };
    return routes[mode];
  }
  
  /**
   * Extract mode from URL pathname
   */
  private extractModeFromPath(pathname: string): Mode | null {
    const pathToMode: Record<string, Mode> = {
      '/country': 'Country',
      '/company': 'Company',
      '/forecast': 'Forecast',
      '/scenario': 'Scenario',
      '/trading': 'Trading'
    };
    
    return pathToMode[pathname] || null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const deepLinking = new DeepLinkingService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if navigation context is valid
 */
export function isValidNavigationContext(context: NavigationContext): boolean {
  return (
    context.fromMode !== context.toMode &&
    ['Country', 'Company', 'Forecast', 'Scenario', 'Trading'].includes(context.fromMode) &&
    ['Country', 'Company', 'Forecast', 'Scenario', 'Trading'].includes(context.toMode)
  );
}

/**
 * Get navigation description
 */
export function getNavigationDescription(context: NavigationContext): string {
  return `Navigate from ${context.fromMode} Mode to ${context.toMode} Mode${
    context.prefillData ? ' with prefilled data' : ''
  }`;
}