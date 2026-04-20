import React from 'react';

type EvidenceStatus = 'evidence' | 'high_confidence_estimate' | 'known_zero' | 'fallback';

interface ChannelExplanationProps {
  country: string;
  channel: string;
  status: EvidenceStatus;
  weight: number;
  source: string | undefined;
  sector: string;
}

/**
 * Generate detailed explanation for a specific country-channel data point
 */
export const getChannelExplanation = (
  country: string,
  channel: string,
  status: EvidenceStatus,
  weight: number,
  source: string | undefined,
  sector: string
): string => {
  const channelName = channel === 'revenue' ? 'Revenue' : 
                     channel === 'operations' ? 'Financial' :
                     channel === 'supply' ? 'Supply Chain' : 'Physical Assets';
  
  if (status === 'evidence') {
    return `✅ EVIDENCE - ${channelName} Channel for ${country}

📊 Data Quality: HIGH - Direct data from verified sources
📈 Weight: ${(weight * 100).toFixed(2)}%
📁 Source: ${source || 'SEC 10-K/20-F filings'}

🔍 EXPLANATION:
This ${(weight * 100).toFixed(2)}% ${channelName.toLowerCase()} exposure to ${country} comes from direct evidence in SEC filings. This is the highest quality data available, extracted from structured tables or narrative disclosures in annual/quarterly reports.

✓ WHY EVIDENCE:
The company explicitly disclosed this ${channelName.toLowerCase()} relationship with ${country} in their regulatory filings, making this a fact-based data point rather than an estimate.

📋 TYPICAL SOURCES:
• SEC 10-K/20-F Item 1 (Business Description)
• Item 8 Notes to Financial Statements
• Management Discussion & Analysis (MD&A)
• Geographic segment footnotes
• Quarterly 10-Q updates`;
  }
  
  if (status === 'high_confidence_estimate') {
    return `⭐ HIGH CONFIDENCE ESTIMATE - ${channelName} Channel for ${country}

📊 Data Quality: MEDIUM-HIGH - ADR-resolved with multiple confirming signals
📈 Weight: ${(weight * 100).toFixed(2)}%
📁 Source: ${source || 'ADR Resolution + SEC Cross-Reference'}

🔍 EXPLANATION:
This ${(weight * 100).toFixed(2)}% ${channelName.toLowerCase()} exposure to ${country} is estimated with high confidence based on the company being an American Depositary Receipt (ADR) with ${country} as its home country.

✓ WHY HIGH CONFIDENCE:
Multiple signals confirm ${country} as the home country:
• Ticker pattern analysis (exchange suffix, naming conventions)
• Company name and headquarters location
• Exchange listing data
• SEC filing cross-references
• Historical incorporation records

Home country typically has dominant ${channelName.toLowerCase()} presence for ADRs due to:
• Primary operations and headquarters location
• Majority of workforce and facilities
• Main banking relationships and currency exposure
• Core supplier and customer base

⚠️ LIMITATIONS:
While highly likely, this is still an estimate. Some ADRs have diversified operations beyond their home country.`;
  }
  
  if (status === 'known_zero') {
    return `🔒 KNOWN ZERO - ${channelName} Channel for ${country}

📊 Data Quality: HIGH - Confirmed absence (not missing data)
📈 Weight: 0.00%
📁 Source: ${source || 'SEC filings or authoritative data'}

🔍 EXPLANATION:
The company has explicitly stated or authoritative data confirms zero ${channelName.toLowerCase()} exposure to ${country}. This is NOT a missing data situation - it's a confirmed absence.

✓ WHY KNOWN ZERO:
Either:
1. The company's SEC filings explicitly state no ${channelName.toLowerCase()} relationship with ${country}
2. Comprehensive data sources show no presence (e.g., no trade flows, no facilities, no debt instruments)
3. Geographic segment disclosures list all countries with exposure, and ${country} is not included

🚫 NO FALLBACK APPLIED:
Because absence is confirmed (not unknown), we do NOT apply fallback estimates. Applying a fallback to a known zero would create false exposure and misrepresent the company's actual risk profile.

This is a critical distinction in our methodology - we respect confirmed zeros and only apply fallbacks to truly unknown/missing data.`;
  }
  
  // Fallback - channel-specific explanations
  if (channel === 'revenue') {
    return `📊 FALLBACK - Revenue Channel for ${country}

📊 Data Quality: LOW-MEDIUM - Template-based estimate
📈 Weight: ${(weight * 100).toFixed(2)}%
📁 Fallback Method: Sector Template
📁 Data Source: Historical revenue patterns from ${sector} sector companies

🔍 EXPLANATION:
This ${(weight * 100).toFixed(2)}% revenue exposure to ${country} is estimated using sector-specific revenue distribution templates. Since the company didn't disclose geographic revenue breakdown in SEC filings, we use typical patterns from similar ${sector} companies.

❓ WHY FALLBACK APPLIED:
No direct revenue data for ${country} was found in:
• SEC 10-K/20-F Item 1 (Business Description)
• Item 8 Notes - Geographic Segment Information
• Management Discussion & Analysis (MD&A)
• Segment footnotes with country-level revenue breakdowns
• Quarterly 10-Q geographic updates

The exposure is unknown/missing, not confirmed as zero.

💡 RATIONALE:
Companies in the ${sector} sector typically have similar geographic revenue distributions due to:
• Shared market dynamics and customer bases
• Similar competitive landscapes
• Common regulatory environments
• Industry-specific trade patterns

While not as accurate as direct evidence, sector templates provide a reasonable proxy based on peer company patterns.

⚠️ LIMITATIONS:
• This is a statistical estimate that may not reflect the company's actual revenue from ${country}
• Actual exposure could be significantly higher or lower
• Company-specific strategies (market focus, competitive advantages) are not captured
• Use with caution for critical investment or risk management decisions

📈 CONFIDENCE LEVEL: Low (30-50%)
Recommend seeking additional company-specific information if this country represents a material risk concern.`;
  }
  
  if (channel === 'supply') {
    return `📊 FALLBACK - Supply Chain Channel for ${country}

📊 Data Quality: MEDIUM - Empirical trade data with sector calibration
📈 Weight: ${(weight * 100).toFixed(2)}%
📁 Fallback Method: COMTRADE + OECD ICIO + Assembly Shares
📁 Data Sources: UN COMTRADE, OECD Inter-Country Input-Output tables, Industry assembly patterns

🔍 EXPLANATION:
This ${(weight * 100).toFixed(2)}% supply chain exposure to ${country} is estimated using actual international trade flows and value chain linkages. We analyze what countries typically supply inputs to the ${sector} sector and adjust for assembly patterns.

❓ WHY FALLBACK APPLIED:
No direct supplier geographic disclosures were found in:
• SEC 10-K/20-F supplier lists or concentrations
• Manufacturing location descriptions
• Contract manufacturer disclosures
• Raw material sourcing information
• MD&A supply chain strategy sections
• Risk Factors supplier concentration warnings
• 8-K supply chain disruption filings

The exposure is unknown/missing, not confirmed as zero.

💡 RATIONALE & METHODOLOGY:
Supply chain exposure can be estimated from empirical trade data:

1. **UN COMTRADE Analysis**: 
   If ${country} exports significant volumes of key inputs to the company's home country, and the ${sector} sector heavily relies on those inputs, the company likely has supply dependencies on ${country}.

2. **OECD ICIO Tables**:
   Inter-Country Input-Output tables show value chain linkages across countries and industries, revealing which countries provide intermediate inputs to the ${sector} sector.

3. **Assembly Share Adjustments**:
   We account for value-added at each production stage. For example, if components are manufactured in ${country} but assembled elsewhere, we attribute appropriate supply chain exposure to ${country}.

📊 EXAMPLE PATTERNS:
For Technology sector companies:
• China: 35% (electronics assembly, components)
• Taiwan: 20% (semiconductors, displays)
• South Korea: 15% (memory chips, displays)
• Japan: 10% (precision components, materials)

⚠️ LIMITATIONS:
• Based on aggregate trade flows and industry patterns, not the company's specific supplier relationships
• Actual supply chain exposure could differ if the company has unique sourcing strategies
• Vertical integration or direct supplier relationships not captured in trade data
• Regional variations within countries not reflected

📈 CONFIDENCE LEVEL: Medium (50-70%)
Trade data provides empirical foundation, but company-specific sourcing may vary.`;
  }
  
  if (channel === 'assets') {
    return `📊 FALLBACK - Physical Assets Channel for ${country}

📊 Data Quality: MEDIUM - GDP-based proxy with sector calibration
📈 Weight: ${(weight * 100).toFixed(2)}%
📁 Fallback Method: GDP-weighted Priors × Asset Intensity Multiplier
📁 Data Sources: World Bank 2023 GDP data, ${sector} sector asset intensity factors

🔍 EXPLANATION:
This ${(weight * 100).toFixed(2)}% physical assets exposure to ${country} is estimated by weighting countries by their economic size (GDP) and adjusting for the ${sector} sector's asset intensity characteristics.

❓ WHY FALLBACK APPLIED:
No direct Property, Plant & Equipment (PP&E) geographic breakdown was found in:
• SEC 10-K/20-F Item 2 (Properties/Facilities)
• Note disclosures on long-lived assets by geography
• DEF 14A proxy statements (office locations, employee counts)
• PP&E footnotes with geographic detail
• Segment information on long-lived assets
• 8-K facility opening/closure announcements
• Satellite/GIS asset registries

The exposure is unknown/missing, not confirmed as zero.

💡 RATIONALE & METHODOLOGY:
Physical asset locations correlate with economic activity, but vary by sector:

**GDP Weighting Logic:**
Larger economies attract more corporate investment due to:
• Market size and customer proximity
• Infrastructure quality
• Skilled labor availability
• Legal and regulatory frameworks
• Financial market depth

**${sector} Sector Asset Intensity:**
Different sectors have different asset footprints:
• Energy: 2.5x multiplier (heavy infrastructure: refineries, pipelines, power plants)
• Manufacturing: 1.5x multiplier (factories, warehouses, distribution centers)
• Technology: 0.8x multiplier (asset-light: offices, data centers, R&D facilities)
• Services: 0.6x multiplier (minimal physical assets: offices only)

This approach weights ${country} by its GDP share (${country}'s economic importance) and adjusts for ${sector} sector characteristics.

📊 CALCULATION EXAMPLE:
If ${country} represents 10% of global GDP and ${sector} has a 1.2x asset intensity:
Base exposure = 10% × 1.2 = 12% (before normalization)

⚠️ LIMITATIONS:
• Macroeconomic proxy doesn't reflect company's actual facility locations
• Companies may concentrate assets in specific countries for strategic reasons not captured by GDP
• Tax optimization, regulatory arbitrage, and historical factors not modeled
• Real estate holdings and leased facilities not distinguished
• Asset quality and utilization rates not reflected

📈 CONFIDENCE LEVEL: Medium (40-60%)
GDP provides reasonable baseline, but company-specific location decisions may differ significantly.`;
  }
  
  if (channel === 'operations') {
    return `📊 FALLBACK - Financial Channel for ${country}

📊 Data Quality: MEDIUM - Currency-based proxy with banking adjustments
📈 Weight: ${(weight * 100).toFixed(2)}%
📁 Fallback Method: Currency Decomposition × CPIS/BIS Banking Priors
📁 Data Sources: Global currency markets, IMF CPIS, BIS International Banking Statistics

🔍 EXPLANATION:
This ${(weight * 100).toFixed(2)}% financial exposure to ${country} is estimated based on global debt currency markets and cross-border banking relationships. We map currency exposures to countries and adjust using international financial flow data.

❓ WHY FALLBACK APPLIED:
No direct debt currency composition or banking relationship disclosures were found in:
• SEC 10-K/20-F debt instruments by currency and jurisdiction
• Foreign exchange exposure disclosures
• Banking relationships and credit facilities
• Notes to Financial Statements (debt schedules, FX derivatives)
• MD&A currency risk management discussions
• Risk Factors on FX volatility
• Liquidity section cash holdings by country
• 10-Q quarterly debt and FX updates

The exposure is unknown/missing, not confirmed as zero.

💡 RATIONALE & METHODOLOGY:
Financial exposure follows currency and banking relationships:

**1. Currency Decomposition:**
Companies typically borrow in major currencies proportional to global debt markets:
• USD exposure (45%) → United States financial system dependency
• EUR exposure (25%) → Eurozone banking relationships
• JPY exposure (8%) → Japan financial markets
• GBP exposure (7%) → United Kingdom banking sector
• CNY exposure (6%) → China financial system
• Other currencies (9%) → Regional financial exposures

**2. CPIS/BIS Adjustments:**
• IMF Coordinated Portfolio Investment Survey (CPIS): Cross-border portfolio investment patterns
• BIS International Banking Statistics: Banking sector exposures and international lending
• These provide empirical patterns of financial flows between countries

**3. Country Mapping:**
Currency exposure is mapped to countries based on:
• Central bank jurisdiction
• Primary banking system
• Bond market location
• Financial regulatory authority

📊 EXAMPLE LOGIC:
If a company has 40% USD debt → ~40% financial exposure to United States
If a company has 30% EUR debt → distributed across Eurozone countries by banking relationships

⚠️ LIMITATIONS:
• Proxy based on global financial market patterns, not company's actual debt structure
• Companies may have concentrated financial exposures to specific countries not reflected in aggregate currency distributions
• Offshore financing and tax havens not fully captured
• Derivative positions and hedging strategies not modeled
• Credit facility locations vs. currency denomination may differ

📈 CONFIDENCE LEVEL: Medium (45-65%)
Currency markets provide reasonable proxy, but company-specific banking relationships may vary.`;
  }
  
  return `Status: ${status}, Weight: ${(weight * 100).toFixed(2)}%`;
};

export const ChannelExplanation: React.FC<ChannelExplanationProps> = ({
  country,
  channel,
  status,
  weight,
  source,
  sector
}) => {
  const explanation = getChannelExplanation(country, channel, status, weight, source, sector);
  
  return (
    <div className="bg-[#0d5f5f]/10 border border-[#0d5f5f] rounded-lg p-4">
      <pre className="text-xs text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
        {explanation}
      </pre>
    </div>
  );
};