/**
 * Company Outlook Aggregator
 * 
 * Orchestrates all forecast analysis services to generate complete company outlook.
 * This is the main entry point for Strategic Forecast Baseline (Phase 1).
 */

import { getCompanyGeographicExposure } from '../geographicExposureService';
import { loadCedarOwlForecast } from '@/utils/forecastDataAccess';
import { adaptForecastEvents } from './forecastEventAdapter';
import { filterRelevantEvents, type CompanyExposureData } from './eventRelevanceFilter';
import { analyzeExposurePathways, type ChannelPathway } from './exposurePathwayAnalyzer';
import { generateBottomLineInterpretation, type BottomLineInterpretation } from './bottomLineGenerator';
import type { CompanyOutlook } from '@/types/forecastCompany';

/**
 * Generate complete company geopolitical outlook
 * 
 * This is the main orchestration function that:
 * 1. Loads company exposure data
 * 2. Loads and filters forecast events
 * 3. Analyzes exposure pathways
 * 4. Generates bottom-line interpretation
 * 5. Calculates quantitative support
 * 
 * @param ticker - Company ticker symbol
 * @param forecastYear - Forecast year (default: '2026')
 * @returns Complete company forecast outlook
 */
export async function generateCompanyOutlook(
  ticker: string,
  forecastYear: string = '2026'
): Promise<CompanyOutlook> {
  console.log(`[CompanyOutlookAggregator] Starting analysis for ${ticker} (${forecastYear})`);
  
  // Step 1: Get company exposure data
  console.log('[CompanyOutlookAggregator] Step 1: Fetching company exposure data...');
  const geoData = await getCompanyGeographicExposure(ticker);
  
  const companyData: CompanyExposureData = {
    company: geoData.company || ticker,
    ticker,
    sector: geoData.sector || 'Unknown',
    exposures: Object.entries(geoData.channelBreakdown || {}).map(([country, data]) => ({
      country,
      percentage: data.blended * 100
    })),
    channelBreakdown: geoData.channelBreakdown
  };
  
  console.log(`[CompanyOutlookAggregator] ✅ Company data retrieved: ${companyData.company}, Sector: ${companyData.sector}`);
  
  // Step 2: Load forecast events
  console.log('[CompanyOutlookAggregator] Step 2: Loading forecast events...');
  const forecast = loadCedarOwlForecast(forecastYear);
  const adaptedEvents = adaptForecastEvents(forecast.geopoliticalEvents);
  console.log(`[CompanyOutlookAggregator] ✅ Loaded ${adaptedEvents.length} forecast events`);
  
  // Step 3: Filter relevant events
  console.log('[CompanyOutlookAggregator] Step 3: Filtering relevant events...');
  const relevantEvents = filterRelevantEvents(companyData, adaptedEvents);
  console.log(`[CompanyOutlookAggregator] ✅ Filtered to ${relevantEvents.length} relevant events`);
  
  // Step 4: Analyze exposure pathways
  console.log('[CompanyOutlookAggregator] Step 4: Analyzing exposure pathways...');
  const channelPathways = analyzeExposurePathways(companyData, relevantEvents);
  console.log(`[CompanyOutlookAggregator] ✅ Analyzed ${channelPathways.length} channel pathways`);
  
  // Step 5: Generate bottom-line interpretation
  console.log('[CompanyOutlookAggregator] Step 5: Generating bottom-line interpretation...');
  const bottomLine = generateBottomLineInterpretation({
    companyName: companyData.company,
    relevantEvents,
    channelPathways
  });
  console.log(`[CompanyOutlookAggregator] ✅ Bottom-line: ${bottomLine.netDirection}`);
  
  // Step 6: Generate narrative summary
  console.log('[CompanyOutlookAggregator] Step 6: Generating narrative summary...');
  const narrativeSummary = generateNarrativeSummary(companyData, relevantEvents, bottomLine);
  
  // Step 7: Calculate quantitative support
  console.log('[CompanyOutlookAggregator] Step 7: Calculating quantitative support...');
  const quantitativeSupport = calculateQuantitativeSupport(
    geoData.coGriScore || 45,
    channelPathways
  );
  
  console.log(`[CompanyOutlookAggregator] ✅ Analysis complete for ${ticker}`);
  
  return {
    companyName: companyData.company,
    ticker,
    sector: companyData.sector,
    horizon: `Next 6-12 months (${forecastYear})`,
    netImpact: bottomLine.netDirection === 'elevated' ? 'negative' : 
               bottomLine.netDirection === 'reduced' ? 'positive' : 'mixed',
    confidence: relevantEvents.length >= 3 ? 'high' : 'low',
    narrativeSummary,
    relevantEvents,
    channelPathways,
    bottomLineInterpretation: bottomLine,
    quantitativeSupport
  };
}

/**
 * Generate narrative summary
 */
function generateNarrativeSummary(
  companyData: CompanyExposureData,
  relevantEvents: any[],
  bottomLine: BottomLineInterpretation
): string {
  if (relevantEvents.length === 0) {
    return `${companyData.company} faces a stable geopolitical environment over the forecast horizon, with no significant events affecting its exposure profile. The company's diversified geographic footprint provides resilience against localized disruptions.`;
  }
  
  const primaryEvent = relevantEvents[0];
  const eventCount = relevantEvents.length;
  
  return `${companyData.company}'s geopolitical risk exposure is ${bottomLine.netDirection} over the forecast horizon, driven primarily by ${primaryEvent.event.toLowerCase()}. With ${eventCount} significant events affecting its operations, the company faces ${bottomLine.conclusion} conditions across its global footprint.`;
}

/**
 * Calculate quantitative support metrics
 */
function calculateQuantitativeSupport(
  structuralCOGRI: number,
  channelPathways: ChannelPathway[]
) {
  // Calculate forecast adjustment
  let totalAdjustment = 0;
  const channelContributions: Record<string, number> = {};
  
  for (const pathway of channelPathways) {
    let adjustment = 0;
    
    if (pathway.impact === 'negative') {
      adjustment = pathway.severity === 'high' ? -5 : pathway.severity === 'medium' ? -3 : -1;
    } else if (pathway.impact === 'positive') {
      adjustment = pathway.severity === 'high' ? 5 : pathway.severity === 'medium' ? 3 : 1;
    }
    
    totalAdjustment += adjustment;
    channelContributions[pathway.channel] = adjustment;
  }
  
  const forecastAdjustedCOGRI = Math.max(0, Math.min(100, structuralCOGRI + totalAdjustment));
  
  let directionalChange: 'up' | 'down' | 'neutral';
  if (totalAdjustment > 2) directionalChange = 'up';
  else if (totalAdjustment < -2) directionalChange = 'down';
  else directionalChange = 'neutral';
  
  return {
    structuralCOGRI,
    forecastAdjustedCOGRI,
    directionalChange,
    channelContributions
  };
}