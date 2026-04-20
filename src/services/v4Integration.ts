import { getCompanyGeographicExposureV4 } from './v34ComprehensiveIntegrationV4';
import { runStep1WithDebug_V4 } from './v4/v4OrchestratorWithDebug';
import { Channel, EvidenceBundle, NarrativeMentions } from '@/types/v4Types';
import type { DebugBundle } from './v4/types/debugBundle.types';

export interface V4ExposureResult {
  exposures: Map<string, number>;
  debugBundles?: {
    revenue: DebugBundle;
    supply: DebugBundle;
    assets: DebugBundle;
    financial: DebugBundle;
  };
}

export interface V4ChannelResults {
  revenue: Map<string, number>;
  supply: Map<string, number>;
  assets: Map<string, number>;
  financial: Map<string, number>;
}

/**
 * Calculate V4 exposures with debug bundles
 */
export async function calculateV4ExposuresWithDebug(ticker: string): Promise<V4ExposureResult> {
  console.log(`[V4Integration] ========================================`);
  console.log(`[V4Integration] Starting calculateV4ExposuresWithDebug for ${ticker}`);
  console.log(`[V4Integration] ========================================`);
  
  try {
    // Get company data
    console.log(`[V4Integration] Step 1: Fetching company geographic exposure data...`);
    const companyData = await getCompanyGeographicExposureV4(ticker);
    
    if (!companyData) {
      console.error(`[V4Integration] ❌ No company data returned for ${ticker}`);
      throw new Error(`No data available for ${ticker}`);
    }
    
    console.log(`[V4Integration] ✅ Company data retrieved:`, {
      company: companyData.company,
      sector: companyData.sector,
      segmentCount: companyData.segments?.length || 0,
      hasChannelBreakdown: !!companyData.channelBreakdown
    });
    
    // Build evidence bundles for each channel
    console.log(`[V4Integration] Step 2: Building evidence bundles...`);
    const evidenceBundles = new Map<Channel, EvidenceBundle>();
    
    // Create evidence bundles from channel breakdown
    if (companyData.channelBreakdown) {
      for (const [channelName, countries] of Object.entries(companyData.channelBreakdown)) {
        const channel = channelName as Channel;
        
        // Create empty narrative mentions structure
        const narrative: NarrativeMentions = {
          namedCountries: new Set<string>(),
          geoLabels: new Set<string>(),
          nonStandardLabels: new Set<string>(),
          currencyLabels: new Set<string>(),
          definitions: new Map(),
          rawSentences: []
        };
        
        const evidenceBundle: EvidenceBundle = {
          channel,
          structuredItems: [],
          narrative,
          supplementaryMembershipHints: {
            namedCountries: new Set<string>(),
            geoLabels: new Set<string>(),
            nonStandardLabels: new Set<string>(),
            currencyLabels: new Set<string>(),
            definitions: new Map(),
            rawSentences: []
          },
          homeCountry: companyData.homeCountry || 'Unknown',
          sector: companyData.sector || 'Unknown'
        };
        evidenceBundles.set(channel, evidenceBundle);
        console.log(`[V4Integration] Created evidence bundle for ${channel}`);
      }
    }
    
    if (evidenceBundles.size === 0) {
      console.error(`[V4Integration] ❌ No evidence bundles created for ${ticker}`);
      throw new Error(`No channel data available for ${ticker}`);
    }
    
    // Run Step 1 with debug for all channels
    console.log(`[V4Integration] Step 3: Running Step 1 with debug for ${evidenceBundles.size} channels...`);
    const { results, debugBundles } = await runStep1WithDebug_V4(
      evidenceBundles,
      ticker,
      { enableDebug: true }
    );
    
    console.log(`[V4Integration] Step 4: Checking results...`);
    console.log(`[V4Integration] Results count: ${results.size}`);
    console.log(`[V4Integration] Debug bundles count: ${debugBundles.size}`);
    
    // Aggregate exposures from all channels
    const aggregatedExposures = new Map<string, number>();
    for (const [channel, result] of results.entries()) {
      console.log(`[V4Integration] Processing result for ${channel}:`, {
        hasAllocation: !!result.allocation,
        allocationSize: result.allocation?.size || 0
      });
      
      if (result.allocation) {
        for (const [country, weight] of result.allocation.entries()) {
          const current = aggregatedExposures.get(country) || 0;
          aggregatedExposures.set(country, current + weight);
        }
      }
    }
    
    // Convert debug bundles Map to object format
    let debugBundlesObject: V4ExposureResult['debugBundles'] | undefined;
    
    if (debugBundles.size > 0) {
      console.log(`[V4Integration] ✅ Converting ${debugBundles.size} debug bundles to object format`);
      
      debugBundlesObject = {
        revenue: debugBundles.get(Channel.REVENUE)!,
        supply: debugBundles.get(Channel.SUPPLY)!,
        assets: debugBundles.get(Channel.ASSETS)!,
        financial: debugBundles.get(Channel.FINANCIAL)!
      };
      
      // Validate all channels have debug bundles
      const missingChannels: string[] = [];
      if (!debugBundlesObject.revenue) missingChannels.push('revenue');
      if (!debugBundlesObject.supply) missingChannels.push('supply');
      if (!debugBundlesObject.assets) missingChannels.push('assets');
      if (!debugBundlesObject.financial) missingChannels.push('financial');
      
      if (missingChannels.length > 0) {
        console.warn(`[V4Integration] ⚠️ Missing debug bundles for channels: ${missingChannels.join(', ')}`);
      } else {
        console.log(`[V4Integration] ✅ All 4 channel debug bundles present`);
      }
    } else {
      console.warn(`[V4Integration] ⚠️ No debug bundles generated`);
    }
    
    console.log(`[V4Integration] ========================================`);
    console.log(`[V4Integration] calculateV4ExposuresWithDebug completed for ${ticker}`);
    console.log(`[V4Integration] Returning result with ${debugBundlesObject ? 'DEBUG BUNDLES' : 'NO DEBUG BUNDLES'}`);
    console.log(`[V4Integration] ========================================`);
    
    return {
      exposures: aggregatedExposures,
      debugBundles: debugBundlesObject
    };
    
  } catch (error) {
    console.error(`[V4Integration] ❌ ERROR in calculateV4ExposuresWithDebug:`, error);
    console.error(`[V4Integration] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

/**
 * Calculate V4 exposures (without debug bundles) - for geographicExposureServiceV4
 */
export async function calculateV4Exposures(ticker: string): Promise<V4ChannelResults> {
  console.log(`[V4Integration] Starting calculateV4Exposures (no debug) for ${ticker}`);
  
  try {
    const companyData = await getCompanyGeographicExposureV4(ticker);
    
    if (!companyData) {
      throw new Error(`No data available for ${ticker}`);
    }
    
    // Build evidence bundles
    const evidenceBundles = new Map<Channel, EvidenceBundle>();
    
    if (companyData.channelBreakdown) {
      for (const [channelName, countries] of Object.entries(companyData.channelBreakdown)) {
        const channel = channelName as Channel;
        
        // Create empty narrative mentions structure
        const narrative: NarrativeMentions = {
          namedCountries: new Set<string>(),
          geoLabels: new Set<string>(),
          nonStandardLabels: new Set<string>(),
          currencyLabels: new Set<string>(),
          definitions: new Map(),
          rawSentences: []
        };
        
        const evidenceBundle: EvidenceBundle = {
          channel,
          structuredItems: [],
          narrative,
          supplementaryMembershipHints: {
            namedCountries: new Set<string>(),
            geoLabels: new Set<string>(),
            nonStandardLabels: new Set<string>(),
            currencyLabels: new Set<string>(),
            definitions: new Map(),
            rawSentences: []
          },
          homeCountry: companyData.homeCountry || 'Unknown',
          sector: companyData.sector || 'Unknown'
        };
        evidenceBundles.set(channel, evidenceBundle);
      }
    }
    
    // Run Step 1 without debug
    const { results } = await runStep1WithDebug_V4(
      evidenceBundles,
      ticker,
      { enableDebug: false }
    );
    
    // Extract channel-specific results
    return {
      revenue: results.get(Channel.REVENUE)?.allocation || new Map(),
      supply: results.get(Channel.SUPPLY)?.allocation || new Map(),
      assets: results.get(Channel.ASSETS)?.allocation || new Map(),
      financial: results.get(Channel.FINANCIAL)?.allocation || new Map()
    };
    
  } catch (error) {
    console.error(`[V4Integration] Error in calculateV4Exposures:`, error);
    throw error;
  }
}
