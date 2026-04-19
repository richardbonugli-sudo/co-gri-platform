/**
 * Narrative Parser for SEC Filings
 *
 * Parses REAL narrative text from SEC filings to extract:
 * 1. Regional definitions (e.g., "Europe includes European countries, India, Middle East, and Africa")
 * 2. Explicit country mentions
 * 3. Supply chain locations
 * 4. Facility and asset locations
 * 5. Currency and financial exposures
 *
 * PHASE 1 FIX (Fix 1):
 * - Removed `generateSimulatedNarrativeText` entirely.
 * - `parseNarrativeText` now only processes real text passed in; returns empty result if input
 *   is empty/null/undefined.
 * - Added `isSimulated: boolean` to NarrativeParseResult so callers can guard against
 *   template-injected data.
 * - Added `fetchSECFilingText(ticker)` using SEC EDGAR submissions API with graceful empty fallback.
 */

// ============================================================================
// TYPES
// ============================================================================

interface RegionalDefinition {
  regionName: string;
  countries: string[];
  source: string;
  confidence: 'high' | 'medium' | 'low';
}

interface CountryMention {
  country: string;
  channel: 'revenue' | 'supply' | 'assets' | 'financial';
  context: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NarrativeParseResult {
  regionalDefinitions: RegionalDefinition[];
  countryMentions: CountryMention[];
  explicitCountries: Set<string>;
  regionalCountries: Map<string, string[]>; // region -> countries
  /**
   * Fix 1: isSimulated flag.
   * Always false now that generateSimulatedNarrativeText has been removed.
   * Callers in structuredDataIntegratorV5.ts MUST check this flag and skip
   * buildAdmissibleSetFromNarrative / extractSupplyCountriesFromNarrative
   * if true (defensive guard for any future regression).
   */
  isSimulated: boolean;
}

// ============================================================================
// COUNTRY ALIASES
// ============================================================================

const COUNTRY_ALIASES: Record<string, string[]> = {
  'United States': ['US', 'USA', 'U.S.', 'United States', 'America', 'American'],
  'United Kingdom': ['UK', 'U.K.', 'United Kingdom', 'Britain', 'British', 'Great Britain'],
  'China': ['China', 'Chinese', 'PRC', "People's Republic of China", 'mainland China', 'China mainland'],
  'Hong Kong': ['Hong Kong', 'HK', 'HKSAR'],
  'Taiwan': ['Taiwan', 'ROC', 'Republic of China'],
  'South Korea': ['South Korea', 'Korea', 'Republic of Korea', 'ROK', 'Korean'],
  'India': ['India', 'Indian'],
  'Japan': ['Japan', 'Japanese'],
  'Germany': ['Germany', 'German'],
  'France': ['France', 'French'],
  'Italy': ['Italy', 'Italian'],
  'Spain': ['Spain', 'Spanish'],
  'Brazil': ['Brazil', 'Brazilian'],
  'Mexico': ['Mexico', 'Mexican'],
  'Canada': ['Canada', 'Canadian'],
  'Australia': ['Australia', 'Australian'],
  'New Zealand': ['New Zealand', 'NZ'],
  'Singapore': ['Singapore', 'Singaporean'],
  'Vietnam': ['Vietnam', 'Vietnamese'],
  'Thailand': ['Thailand', 'Thai'],
  'Malaysia': ['Malaysia', 'Malaysian'],
  'Indonesia': ['Indonesia', 'Indonesian'],
  'Philippines': ['Philippines', 'Philippine', 'Filipino'],
  'Russia': ['Russia', 'Russian', 'Russian Federation'],
  'Saudi Arabia': ['Saudi Arabia', 'Saudi', 'KSA'],
  'United Arab Emirates': ['UAE', 'U.A.E.', 'United Arab Emirates', 'Emirates'],
  'Israel': ['Israel', 'Israeli'],
  'Turkey': ['Turkey', 'Turkish', 'Türkiye'],
  'South Africa': ['South Africa', 'South African'],
  'Nigeria': ['Nigeria', 'Nigerian'],
  'Egypt': ['Egypt', 'Egyptian'],
  'Argentina': ['Argentina', 'Argentine', 'Argentinian'],
  'Chile': ['Chile', 'Chilean'],
  'Colombia': ['Colombia', 'Colombian'],
  'Peru': ['Peru', 'Peruvian'],
  'Poland': ['Poland', 'Polish'],
  'Netherlands': ['Netherlands', 'Dutch', 'Holland'],
  'Belgium': ['Belgium', 'Belgian'],
  'Switzerland': ['Switzerland', 'Swiss'],
  'Sweden': ['Sweden', 'Swedish'],
  'Norway': ['Norway', 'Norwegian'],
  'Denmark': ['Denmark', 'Danish'],
  'Finland': ['Finland', 'Finnish'],
  'Austria': ['Austria', 'Austrian'],
  'Ireland': ['Ireland', 'Irish'],
  'Portugal': ['Portugal', 'Portuguese'],
  'Greece': ['Greece', 'Greek'],
  'Czech Republic': ['Czech Republic', 'Czech', 'Czechia'],
  'Hungary': ['Hungary', 'Hungarian'],
  'Romania': ['Romania', 'Romanian'],
};

// ============================================================================
// REGIONAL PATTERNS
// ============================================================================

const REGIONAL_PATTERNS: Record<string, { keywords: string[]; defaultCountries: string[] }> = {
  'Europe': {
    keywords: ['Europe', 'European', 'EMEA'],
    defaultCountries: ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Sweden', 'Poland', 'Austria', 'Norway', 'Denmark', 'Ireland', 'Finland'],
  },
  'Middle East': {
    keywords: ['Middle East', 'MENA', 'Gulf'],
    defaultCountries: ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Turkey', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'],
  },
  'Africa': {
    keywords: ['Africa', 'African'],
    defaultCountries: ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Morocco', 'Ethiopia', 'Ghana', 'Tanzania', 'Angola', 'Algeria'],
  },
  'Asia Pacific': {
    keywords: ['Asia Pacific', 'APAC', 'Asia-Pacific', 'Asian'],
    defaultCountries: ['China', 'Japan', 'South Korea', 'India', 'Australia', 'Singapore', 'Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Taiwan', 'Hong Kong', 'New Zealand'],
  },
  'Rest of Asia Pacific': {
    keywords: ['Rest of Asia Pacific', 'other Asian countries', 'other Asia'],
    defaultCountries: ['Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Singapore', 'Australia', 'New Zealand'],
  },
  'Greater China': {
    keywords: ['Greater China', 'China region'],
    defaultCountries: ['China', 'Hong Kong', 'Taiwan'],
  },
  'Latin America': {
    keywords: ['Latin America', 'LATAM', 'South America', 'Central America'],
    defaultCountries: ['Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru'],
  },
  'Americas': {
    keywords: ['Americas', 'Western Hemisphere'],
    defaultCountries: ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru'],
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize region name by removing common suffixes like "segment", "region", etc.
 */
function normalizeRegionName(regionName: string): string {
  return regionName
    .replace(/\s+segment$/i, '')
    .replace(/\s+region$/i, '')
    .trim();
}

/**
 * Extract country names from text using COUNTRY_ALIASES and REGIONAL_PATTERNS.
 */
function extractCountriesFromText(text: string): string[] {
  const countries = new Set<string>();

  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(text)) {
        countries.add(country);
        break;
      }
    }
  }

  for (const [, data] of Object.entries(REGIONAL_PATTERNS)) {
    for (const keyword of data.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) {
        data.defaultCountries.forEach(c => countries.add(c));
      }
    }
  }

  return Array.from(countries);
}

/**
 * Parse narrative text to extract regional definitions.
 * Example: "Europe includes European countries, India, the Middle East, and Africa"
 */
function parseRegionalDefinitions(text: string): RegionalDefinition[] {
  const definitions: RegionalDefinition[] = [];

  const patterns: Array<{ regex: RegExp; source: string }> = [
    { regex: /([A-Z][a-z\s]+)\s+includes?\s+([^.;]+)/gi, source: 'Narrative text (includes pattern)' },
    { regex: /([A-Z][a-z\s]+)\s+consists?\s+of\s+([^.;]+)/gi, source: 'Narrative text (consists pattern)' },
    { regex: /([A-Z][a-z\s]+)\s+comprises?\s+([^.;]+)/gi, source: 'Narrative text (comprises pattern)' },
  ];

  for (const { regex, source } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const regionName = match[1].trim();
      const countries = extractCountriesFromText(match[2]);
      if (countries.length > 0) {
        definitions.push({ regionName, countries, source, confidence: 'high' });
      }
    }
  }

  return definitions;
}

/**
 * Parse narrative text to identify channel-specific country mentions.
 */
function parseCountryMentions(text: string): CountryMention[] {
  const mentions: CountryMention[] = [];

  const revenueKeywords = ['revenue', 'sales', 'market', 'customers', 'demand'];
  const supplyKeywords = ['manufacturing', 'supplier', 'supply chain', 'production', 'assembly', 'sourcing', 'procurement'];
  const assetsKeywords = ['facility', 'facilities', 'plant', 'office', 'property', 'real estate', 'PP&E', 'long-lived assets'];
  const financialKeywords = ['debt', 'currency', 'FX', 'foreign exchange', 'banking', 'credit facility', 'cash holdings'];

  const sentences = text.split(/[.;]/);

  for (const sentence of sentences) {
    const countries = extractCountriesFromText(sentence);
    if (countries.length === 0) continue;

    const lowerSentence = sentence.toLowerCase();
    let channel: 'revenue' | 'supply' | 'assets' | 'financial' | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    if (revenueKeywords.some(kw => lowerSentence.includes(kw))) {
      channel = 'revenue'; confidence = 'high';
    } else if (supplyKeywords.some(kw => lowerSentence.includes(kw))) {
      channel = 'supply'; confidence = 'high';
    } else if (assetsKeywords.some(kw => lowerSentence.includes(kw))) {
      channel = 'assets'; confidence = 'high';
    } else if (financialKeywords.some(kw => lowerSentence.includes(kw))) {
      channel = 'financial'; confidence = 'high';
    }

    if (channel) {
      for (const country of countries) {
        mentions.push({ country, channel, context: sentence.trim().substring(0, 200), confidence });
      }
    }
  }

  return mentions;
}

// ============================================================================
// SEC EDGAR FETCH (Fix 1: real data, no simulation)
// ============================================================================

/**
 * Fetch the most recent 10-K filing narrative text for a ticker from SEC EDGAR.
 *
 * Uses the public EDGAR submissions API:
 *   https://data.sec.gov/submissions/CIK{cik}.json
 * then fetches the filing index to locate the 10-K document.
 *
 * Returns empty string on any error (graceful fallback — callers check for empty string
 * and skip narrative-based admissible set construction).
 */
export async function fetchSECFilingText(ticker: string): Promise<string> {
  try {
    // Step 1: Resolve CIK from EDGAR company search
    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(ticker)}%22&dateRange=custom&startdt=2023-01-01&forms=10-K`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'COGRI-Platform research@cogri.dev' },
    });

    if (!searchRes.ok) {
      console.warn(`[NarrativeParser] EDGAR search failed for ${ticker}: ${searchRes.status}`);
      return '';
    }

    const searchData = await searchRes.json();
    const hits = searchData?.hits?.hits;
    if (!hits || hits.length === 0) {
      console.warn(`[NarrativeParser] No 10-K hits for ${ticker}`);
      return '';
    }

    // Step 2: Get CIK from first hit
    const cik = hits[0]?._source?.entity_id || hits[0]?._source?.period_of_report;
    if (!cik) {
      console.warn(`[NarrativeParser] Could not extract CIK for ${ticker}`);
      return '';
    }

    // Step 3: Fetch submissions JSON to get filing list
    const paddedCik = String(cik).padStart(10, '0');
    const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
    const subRes = await fetch(submissionsUrl, {
      headers: { 'User-Agent': 'COGRI-Platform research@cogri.dev' },
    });

    if (!subRes.ok) {
      console.warn(`[NarrativeParser] EDGAR submissions fetch failed for CIK ${paddedCik}: ${subRes.status}`);
      return '';
    }

    const subData = await subRes.json();
    const filings = subData?.filings?.recent;
    if (!filings) {
      console.warn(`[NarrativeParser] No recent filings for ${ticker}`);
      return '';
    }

    // Step 4: Find most recent 10-K accession number
    const forms: string[] = filings.form || [];
    const accessionNumbers: string[] = filings.accessionNumber || [];
    const primaryDocuments: string[] = filings.primaryDocument || [];

    const tenKIndex = forms.findIndex(f => f === '10-K');
    if (tenKIndex === -1) {
      console.warn(`[NarrativeParser] No 10-K found for ${ticker}`);
      return '';
    }

    const accession = accessionNumbers[tenKIndex].replace(/-/g, '');
    const primaryDoc = primaryDocuments[tenKIndex];

    // Step 5: Fetch the primary 10-K document
    const docUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik, 10)}/${accession}/${primaryDoc}`;
    const docRes = await fetch(docUrl, {
      headers: { 'User-Agent': 'COGRI-Platform research@cogri.dev' },
    });

    if (!docRes.ok) {
      console.warn(`[NarrativeParser] Failed to fetch 10-K document for ${ticker}: ${docRes.status}`);
      return '';
    }

    const rawText = await docRes.text();

    // Step 6: Strip HTML tags and return plain text (first 50,000 chars for performance)
    const plainText = rawText
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .substring(0, 50000);

    console.log(`[NarrativeParser] ✅ Fetched 10-K text for ${ticker}: ${plainText.length} chars`);
    return plainText;
  } catch (error) {
    console.warn(`[NarrativeParser] fetchSECFilingText error for ${ticker}:`, error);
    return '';
  }
}

// ============================================================================
// MAIN PARSE FUNCTION (Fix 1: real text only, no simulation)
// ============================================================================

/**
 * Parse real narrative text extracted from SEC filings.
 *
 * Fix 1: This function NO LONGER generates simulated text.
 * - If `narrativeText` is empty/null/undefined, returns an empty result with isSimulated: false.
 * - Callers must supply real text (e.g., from fetchSECFilingText or secFilingParser).
 * - `isSimulated` is always false; the field exists so downstream guards can detect
 *   any future regression where simulated text is accidentally re-introduced.
 */
export function parseNarrativeText(narrativeText: string | null | undefined): NarrativeParseResult {
  const empty: NarrativeParseResult = {
    regionalDefinitions: [],
    countryMentions: [],
    explicitCountries: new Set<string>(),
    regionalCountries: new Map<string, string[]>(),
    isSimulated: false,
  };

  if (!narrativeText || narrativeText.trim().length === 0) {
    console.log('[Narrative Parser] Empty/null input — returning empty result (no simulation)');
    return empty;
  }

  const regionalDefinitions = parseRegionalDefinitions(narrativeText);
  const countryMentions = parseCountryMentions(narrativeText);

  const explicitCountries = new Set<string>();
  const regionalCountries = new Map<string, string[]>();

  for (const mention of countryMentions) {
    explicitCountries.add(mention.country);
  }

  for (const definition of regionalDefinitions) {
    const normalizedRegionName = normalizeRegionName(definition.regionName);
    console.log(`[Narrative Parser] Mapping "${definition.regionName}" -> normalized: "${normalizedRegionName}"`);
    regionalCountries.set(normalizedRegionName, definition.countries);
    definition.countries.forEach(c => explicitCountries.add(c));
  }

  console.log(`[Narrative Parser] Found ${regionalDefinitions.length} regional definitions, ${countryMentions.length} country mentions`);
  console.log(`[Narrative Parser] Explicit countries: ${Array.from(explicitCountries).join(', ')}`);

  return {
    regionalDefinitions,
    countryMentions,
    explicitCountries,
    regionalCountries,
    isSimulated: false,
  };
}

export default {
  parseNarrativeText,
  fetchSECFilingText,
  extractCountriesFromText,
  parseRegionalDefinitions,
  parseCountryMentions,
};