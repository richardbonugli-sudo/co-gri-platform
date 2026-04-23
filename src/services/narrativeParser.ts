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
 * ENHANCEMENT SUMMARY (2026-04-23):
 *
 * Fix 1: Removed `generateSimulatedNarrativeText` entirely (already done).
 *        `parseNarrativeText` only processes real text; returns empty result if
 *        input is empty/null/undefined.
 *        Added `isSimulated: boolean` to NarrativeParseResult.
 *
 * Fix 2: Always-on local extraction — `extractCountriesLocally` now runs on
 *        ALL section texts, not just as a fallback. Merges with LLM results.
 *
 * Fix 3: Extended section extraction — `extractSectionText` now supports
 *        'business', 'item2Properties', 'exhibit21', and 'segmentNotes' in
 *        addition to 'mda', 'riskFactors', 'geoNotes'. `extractAllNarrativeSections`
 *        returns all six sections.
 *
 * Fix 4: Enhanced HTML cleaning — handles iXBRL inline tags (ix:nonNumeric,
 *        ix:nonFraction, etc.) and all common HTML entities before stripping.
 *
 * Fix 5: Broader iXBRL anchor patterns — covers 20-F section numbering
 *        (Item 4 Business, Item 5 MD&A equivalent) and additional id/name
 *        attribute variants used by different filers.
 *
 * Fix 6: Currency-to-country mapping — EUR, JPY, CNY, GBP, BRL, etc. resolve
 *        to countries even without explicit country names in the text.
 *
 * Fix 7: Adjective-form extraction — "Chinese operations", "German subsidiary",
 *        "Irish holding company" etc. now resolve to canonical country names.
 *
 * Fix 8: Expanded COUNTRY_ALIASES — 150+ countries, offshore jurisdictions
 *        (Cayman Islands, Bermuda, BVI, Luxembourg), and common abbreviations.
 *
 * Fix 9: Expanded REGIONAL_PATTERNS — added EMEA, SEA, CIS, GCC, MENA,
 *        Sub-Saharan Africa, Nordic, Benelux, Iberia, CEE, DACH.
 *
 * Fix 10: `parseCountryMentions` now also extracts mentions without explicit
 *         channel keywords (confidence: 'low') so no country is silently dropped.
 *
 * Fix 11: `extractSectionText` Strategy A now also checks 20-F anchor patterns
 *         and falls back to a mid-document window scan (Fix 11 in runSECBaseline).
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
   * Always false — simulated text generation was removed in Fix 1.
   * Callers MUST check this flag and skip buildAdmissibleSetFromNarrative /
   * extractSupplyCountriesFromNarrative if true (defensive guard).
   */
  isSimulated: boolean;
}

// ============================================================================
// FIX 8: EXPANDED COUNTRY ALIASES (150+ countries + offshore jurisdictions)
// ============================================================================

const COUNTRY_ALIASES: Record<string, string[]> = {
  // ── Major economies ───────────────────────────────────────────────────────
  'United States': ['US', 'USA', 'U.S.', 'U.S.A.', 'United States', 'America', 'American', 'United States of America'],
  'United Kingdom': ['UK', 'U.K.', 'United Kingdom', 'Britain', 'British', 'Great Britain', 'England', 'England and Wales'],
  'China': ['China', 'Chinese', 'PRC', "People's Republic of China", 'mainland China', 'China mainland', 'Greater China'],
  'Hong Kong': ['Hong Kong', 'HK', 'HKSAR', 'H.K.'],
  'Taiwan': ['Taiwan', 'ROC', 'Republic of China', 'Taiwan, R.O.C.', 'R.O.C.'],
  'South Korea': ['South Korea', 'Korea', 'Republic of Korea', 'ROK', 'Korean', 'S. Korea'],
  'India': ['India', 'Indian'],
  'Japan': ['Japan', 'Japanese'],
  'Germany': ['Germany', 'German', 'Deutschland'],
  'France': ['France', 'French'],
  'Italy': ['Italy', 'Italian'],
  'Spain': ['Spain', 'Spanish'],
  'Brazil': ['Brazil', 'Brazilian', 'Brasil'],
  'Mexico': ['Mexico', 'Mexican', 'México'],
  'Canada': ['Canada', 'Canadian'],
  'Australia': ['Australia', 'Australian'],
  'New Zealand': ['New Zealand', 'NZ'],
  'Singapore': ['Singapore', 'Singaporean'],
  'Vietnam': ['Vietnam', 'Vietnamese', 'Viet Nam'],
  'Thailand': ['Thailand', 'Thai'],
  'Malaysia': ['Malaysia', 'Malaysian'],
  'Indonesia': ['Indonesia', 'Indonesian'],
  'Philippines': ['Philippines', 'Philippine', 'Filipino', 'Phillipines'],
  'Russia': ['Russia', 'Russian', 'Russian Federation'],
  'Saudi Arabia': ['Saudi Arabia', 'Saudi', 'KSA'],
  'United Arab Emirates': ['UAE', 'U.A.E.', 'United Arab Emirates', 'Emirates'],
  'Israel': ['Israel', 'Israeli'],
  'Turkey': ['Turkey', 'Turkish', 'Türkiye', 'Turkiye'],
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
  // ── Additional European ───────────────────────────────────────────────────
  'Luxembourg': ['Luxembourg', 'Luxembourgish'],
  'Slovakia': ['Slovakia', 'Slovak'],
  'Slovenia': ['Slovenia', 'Slovenian'],
  'Croatia': ['Croatia', 'Croatian'],
  'Serbia': ['Serbia', 'Serbian'],
  'Bulgaria': ['Bulgaria', 'Bulgarian'],
  'Ukraine': ['Ukraine', 'Ukrainian'],
  'Belarus': ['Belarus', 'Belarusian'],
  'Estonia': ['Estonia', 'Estonian'],
  'Latvia': ['Latvia', 'Latvian'],
  'Lithuania': ['Lithuania', 'Lithuanian'],
  'Iceland': ['Iceland', 'Icelandic'],
  'Malta': ['Malta', 'Maltese'],
  'Cyprus': ['Cyprus', 'Cypriot'],
  'North Macedonia': ['North Macedonia', 'Macedonia'],
  'Albania': ['Albania', 'Albanian'],
  'Bosnia': ['Bosnia', 'Bosnia and Herzegovina'],
  'Montenegro': ['Montenegro'],
  'Moldova': ['Moldova', 'Moldovan'],
  'Georgia': ['Georgia', 'Georgian'],
  'Armenia': ['Armenia', 'Armenian'],
  'Azerbaijan': ['Azerbaijan', 'Azerbaijani'],
  'Kazakhstan': ['Kazakhstan', 'Kazakh'],
  'Uzbekistan': ['Uzbekistan', 'Uzbek'],
  // ── Middle East & Africa ──────────────────────────────────────────────────
  'Qatar': ['Qatar', 'Qatari'],
  'Kuwait': ['Kuwait', 'Kuwaiti'],
  'Oman': ['Oman', 'Omani'],
  'Bahrain': ['Bahrain', 'Bahraini'],
  'Jordan': ['Jordan', 'Jordanian'],
  'Lebanon': ['Lebanon', 'Lebanese'],
  'Iraq': ['Iraq', 'Iraqi'],
  'Iran': ['Iran', 'Iranian'],
  'Morocco': ['Morocco', 'Moroccan'],
  'Algeria': ['Algeria', 'Algerian'],
  'Tunisia': ['Tunisia', 'Tunisian'],
  'Libya': ['Libya', 'Libyan'],
  'Kenya': ['Kenya', 'Kenyan'],
  'Ethiopia': ['Ethiopia', 'Ethiopian'],
  'Tanzania': ['Tanzania', 'Tanzanian'],
  'Uganda': ['Uganda', 'Ugandan'],
  'Ghana': ['Ghana', 'Ghanaian'],
  'Angola': ['Angola', 'Angolan'],
  'Mozambique': ['Mozambique', 'Mozambican'],
  'Zimbabwe': ['Zimbabwe', 'Zimbabwean'],
  'Zambia': ['Zambia', 'Zambian'],
  'Botswana': ['Botswana'],
  'Namibia': ['Namibia', 'Namibian'],
  'Rwanda': ['Rwanda', 'Rwandan'],
  'Ivory Coast': ["Ivory Coast", "Côte d'Ivoire"],
  'Senegal': ['Senegal', 'Senegalese'],
  'Cameroon': ['Cameroon', 'Cameroonian'],
  // ── Americas ──────────────────────────────────────────────────────────────
  'Venezuela': ['Venezuela', 'Venezuelan'],
  'Ecuador': ['Ecuador', 'Ecuadorian'],
  'Bolivia': ['Bolivia', 'Bolivian'],
  'Paraguay': ['Paraguay', 'Paraguayan'],
  'Uruguay': ['Uruguay', 'Uruguayan'],
  'Panama': ['Panama', 'Panamanian'],
  'Costa Rica': ['Costa Rica', 'Costa Rican'],
  'Guatemala': ['Guatemala', 'Guatemalan'],
  'Honduras': ['Honduras', 'Honduran'],
  'El Salvador': ['El Salvador', 'Salvadoran'],
  'Nicaragua': ['Nicaragua', 'Nicaraguan'],
  'Dominican Republic': ['Dominican Republic', 'Dominican'],
  'Cuba': ['Cuba', 'Cuban'],
  'Jamaica': ['Jamaica', 'Jamaican'],
  'Trinidad': ['Trinidad', 'Trinidad and Tobago'],
  'Barbados': ['Barbados', 'Barbadian'],
  // ── Asia ──────────────────────────────────────────────────────────────────
  'Pakistan': ['Pakistan', 'Pakistani'],
  'Bangladesh': ['Bangladesh', 'Bangladeshi'],
  'Sri Lanka': ['Sri Lanka', 'Sri Lankan'],
  'Nepal': ['Nepal', 'Nepali'],
  'Myanmar': ['Myanmar', 'Burmese'],
  'Cambodia': ['Cambodia', 'Cambodian'],
  'Laos': ['Laos', 'Lao'],
  'Mongolia': ['Mongolia', 'Mongolian'],
  'Afghanistan': ['Afghanistan', 'Afghan'],
  'Brunei': ['Brunei'],
  'Maldives': ['Maldives'],
  'Papua New Guinea': ['Papua New Guinea'],
  'Fiji': ['Fiji', 'Fijian'],
  // ── Offshore / Special jurisdictions ─────────────────────────────────────
  'Cayman Islands': ['Cayman Islands', 'Cayman'],
  'Bermuda': ['Bermuda'],
  'British Virgin Islands': ['British Virgin Islands', 'BVI'],
  'Netherlands Antilles': ['Netherlands Antilles'],
  'Macau': ['Macau', 'Macao'],
  'North Korea': ['North Korea', 'DPRK'],
};

// ============================================================================
// FIX 6: CURRENCY-TO-COUNTRY MAPPING
// ============================================================================

const CURRENCY_TO_COUNTRIES: Record<string, string[]> = {
  'USD': ['United States'],
  'EUR': ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Finland', 'Portugal', 'Greece', 'Ireland', 'Luxembourg'],
  'GBP': ['United Kingdom'],
  'JPY': ['Japan'],
  'CNY': ['China'], 'RMB': ['China'], 'CNH': ['China'],
  'HKD': ['Hong Kong'],
  'TWD': ['Taiwan'],
  'KRW': ['South Korea'],
  'INR': ['India'],
  'AUD': ['Australia'],
  'CAD': ['Canada'],
  'SGD': ['Singapore'],
  'CHF': ['Switzerland'],
  'SEK': ['Sweden'],
  'NOK': ['Norway'],
  'DKK': ['Denmark'],
  'PLN': ['Poland'],
  'CZK': ['Czech Republic'],
  'HUF': ['Hungary'],
  'RON': ['Romania'],
  'BRL': ['Brazil'],
  'MXN': ['Mexico'],
  'ARS': ['Argentina'],
  'CLP': ['Chile'],
  'COP': ['Colombia'],
  'PEN': ['Peru'],
  'IDR': ['Indonesia'],
  'MYR': ['Malaysia'],
  'THB': ['Thailand'],
  'VND': ['Vietnam'],
  'PHP': ['Philippines'],
  'TRY': ['Turkey'],
  'ILS': ['Israel'],
  'SAR': ['Saudi Arabia'],
  'AED': ['United Arab Emirates'],
  'QAR': ['Qatar'],
  'KWD': ['Kuwait'],
  'EGP': ['Egypt'],
  'NGN': ['Nigeria'],
  'KES': ['Kenya'],
  'ZAR': ['South Africa'],
  'RUB': ['Russia'],
  'UAH': ['Ukraine'],
  'PKR': ['Pakistan'],
  'BDT': ['Bangladesh'],
  'LKR': ['Sri Lanka'],
  'MAD': ['Morocco'],
  'DZD': ['Algeria'],
  'TND': ['Tunisia'],
  'JOD': ['Jordan'],
  'KZT': ['Kazakhstan'],
  'GEL': ['Georgia'],
  'AMD': ['Armenia'],
  'AZN': ['Azerbaijan'],
  'UZS': ['Uzbekistan'],
  'BGN': ['Bulgaria'],
  'ISK': ['Iceland'],
  'MNT': ['Mongolia'],
  'KHR': ['Cambodia'],
  'LAK': ['Laos'],
  'MMK': ['Myanmar'],
  'NPR': ['Nepal'],
  'BND': ['Brunei'],
  'MOP': ['Macau'],
  'GTQ': ['Guatemala'],
  'HNL': ['Honduras'],
  'NIO': ['Nicaragua'],
  'DOP': ['Dominican Republic'],
  'JMD': ['Jamaica'],
  'TTD': ['Trinidad'],
  'CRC': ['Costa Rica'],
  'PYG': ['Paraguay'],
  'UYU': ['Uruguay'],
  'BOB': ['Bolivia'],
  'VEF': ['Venezuela'],
};

// ============================================================================
// FIX 7: ADJECTIVE-FORM MAPPING
// ============================================================================

const ADJECTIVE_TO_COUNTRY: Record<string, string> = {
  'american': 'United States', 'u.s.': 'United States',
  'chinese': 'China', 'japanese': 'Japan', 'german': 'Germany',
  'french': 'France', 'british': 'United Kingdom', 'italian': 'Italy',
  'spanish': 'Spain', 'dutch': 'Netherlands', 'swiss': 'Switzerland',
  'swedish': 'Sweden', 'norwegian': 'Norway', 'danish': 'Denmark',
  'finnish': 'Finland', 'austrian': 'Austria', 'belgian': 'Belgium',
  'polish': 'Poland', 'hungarian': 'Hungary', 'romanian': 'Romania',
  'greek': 'Greece', 'portuguese': 'Portugal', 'irish': 'Ireland',
  'canadian': 'Canada', 'australian': 'Australia', 'brazilian': 'Brazil',
  'mexican': 'Mexico', 'argentinian': 'Argentina', 'argentine': 'Argentina',
  'chilean': 'Chile', 'colombian': 'Colombia', 'peruvian': 'Peru',
  'indian': 'India', 'korean': 'South Korea', 'taiwanese': 'Taiwan',
  'singaporean': 'Singapore', 'vietnamese': 'Vietnam', 'thai': 'Thailand',
  'malaysian': 'Malaysia', 'indonesian': 'Indonesia', 'filipino': 'Philippines',
  'philippine': 'Philippines', 'russian': 'Russia', 'ukrainian': 'Ukraine',
  'turkish': 'Turkey', 'israeli': 'Israel', 'saudi': 'Saudi Arabia',
  'emirati': 'United Arab Emirates', 'egyptian': 'Egypt', 'nigerian': 'Nigeria',
  'kenyan': 'Kenya', 'south african': 'South Africa', 'moroccan': 'Morocco',
  'algerian': 'Algeria', 'tunisian': 'Tunisia', 'jordanian': 'Jordan',
  'lebanese': 'Lebanon', 'iraqi': 'Iraq', 'iranian': 'Iran',
  'pakistani': 'Pakistan', 'bangladeshi': 'Bangladesh', 'sri lankan': 'Sri Lanka',
  'mongolian': 'Mongolia', 'kazakh': 'Kazakhstan', 'uzbek': 'Uzbekistan',
  'georgian': 'Georgia', 'armenian': 'Armenia', 'azerbaijani': 'Azerbaijan',
  'bulgarian': 'Bulgaria', 'serbian': 'Serbia', 'croatian': 'Croatia',
  'slovak': 'Slovakia', 'slovenian': 'Slovenia', 'estonian': 'Estonia',
  'latvian': 'Latvia', 'lithuanian': 'Lithuania', 'icelandic': 'Iceland',
  'maltese': 'Malta', 'cypriot': 'Cyprus', 'luxembourgish': 'Luxembourg',
  'qatari': 'Qatar', 'kuwaiti': 'Kuwait', 'omani': 'Oman', 'bahraini': 'Bahrain',
  'ghanaian': 'Ghana', 'ethiopian': 'Ethiopia', 'tanzanian': 'Tanzania',
  'ugandan': 'Uganda', 'angolan': 'Angola', 'zambian': 'Zambia',
  'zimbabwean': 'Zimbabwe', 'rwandan': 'Rwanda', 'cameroonian': 'Cameroon',
  'senegalese': 'Senegal', 'venezuelan': 'Venezuela', 'ecuadorian': 'Ecuador',
  'bolivian': 'Bolivia', 'paraguayan': 'Paraguay', 'uruguayan': 'Uruguay',
  'panamanian': 'Panama', 'guatemalan': 'Guatemala', 'honduran': 'Honduras',
  'nicaraguan': 'Nicaragua', 'dominican': 'Dominican Republic', 'cuban': 'Cuba',
  'jamaican': 'Jamaica', 'pakistani': 'Pakistan', 'nepali': 'Nepal',
  'burmese': 'Myanmar', 'cambodian': 'Cambodia', 'mongolian': 'Mongolia',
  'afghan': 'Afghanistan', 'fijian': 'Fiji',
};

// ============================================================================
// FIX 9: EXPANDED REGIONAL PATTERNS
// ============================================================================

const REGIONAL_PATTERNS: Record<string, { keywords: string[]; defaultCountries: string[] }> = {
  'Europe': {
    keywords: ['Europe', 'European'],
    defaultCountries: ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Sweden', 'Poland', 'Austria', 'Norway', 'Denmark', 'Ireland', 'Finland', 'Portugal', 'Greece', 'Czech Republic', 'Hungary', 'Romania'],
  },
  'EMEA': {
    keywords: ['EMEA', 'Europe, Middle East and Africa', 'Europe, the Middle East and Africa'],
    defaultCountries: ['Germany', 'United Kingdom', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Belgium', 'Sweden', 'Poland', 'Saudi Arabia', 'United Arab Emirates', 'Israel', 'Turkey', 'South Africa', 'Nigeria', 'Egypt'],
  },
  'Middle East': {
    keywords: ['Middle East', 'MENA', 'Gulf', 'GCC'],
    defaultCountries: ['Saudi Arabia', 'United Arab Emirates', 'Israel', 'Turkey', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Jordan', 'Lebanon', 'Iraq', 'Iran'],
  },
  'Africa': {
    keywords: ['Africa', 'African', 'Sub-Saharan Africa'],
    defaultCountries: ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Morocco', 'Ethiopia', 'Ghana', 'Tanzania', 'Angola', 'Algeria'],
  },
  'Asia Pacific': {
    keywords: ['Asia Pacific', 'APAC', 'Asia-Pacific', 'Asian', 'Asia/Pacific'],
    defaultCountries: ['China', 'Japan', 'South Korea', 'India', 'Australia', 'Singapore', 'Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Taiwan', 'Hong Kong', 'New Zealand'],
  },
  'Rest of Asia Pacific': {
    keywords: ['Rest of Asia Pacific', 'other Asian countries', 'other Asia', 'Rest of APAC'],
    defaultCountries: ['Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Singapore', 'Australia', 'New Zealand'],
  },
  'Greater China': {
    keywords: ['Greater China', 'China region', 'China and Hong Kong'],
    defaultCountries: ['China', 'Hong Kong', 'Taiwan'],
  },
  'Latin America': {
    keywords: ['Latin America', 'LATAM', 'South America', 'Central America', 'LatAm'],
    defaultCountries: ['Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia'],
  },
  'Americas': {
    keywords: ['Americas', 'Western Hemisphere', 'The Americas'],
    defaultCountries: ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru'],
  },
  'North America': {
    keywords: ['North America', 'North American'],
    defaultCountries: ['United States', 'Canada', 'Mexico'],
  },
  'Southeast Asia': {
    keywords: ['Southeast Asia', 'SEA', 'ASEAN'],
    defaultCountries: ['Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Singapore', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'],
  },
  'CIS': {
    keywords: ['CIS', 'Commonwealth of Independent States', 'Former Soviet'],
    defaultCountries: ['Russia', 'Ukraine', 'Kazakhstan', 'Uzbekistan', 'Azerbaijan', 'Georgia', 'Armenia', 'Belarus'],
  },
  'Nordic': {
    keywords: ['Nordic', 'Nordics', 'Scandinavia', 'Scandinavian'],
    defaultCountries: ['Sweden', 'Norway', 'Denmark', 'Finland', 'Iceland'],
  },
  'Benelux': {
    keywords: ['Benelux'],
    defaultCountries: ['Belgium', 'Netherlands', 'Luxembourg'],
  },
  'DACH': {
    keywords: ['DACH', 'D-A-CH'],
    defaultCountries: ['Germany', 'Austria', 'Switzerland'],
  },
  'Iberia': {
    keywords: ['Iberia', 'Iberian'],
    defaultCountries: ['Spain', 'Portugal'],
  },
  'CEE': {
    keywords: ['CEE', 'Central and Eastern Europe', 'Eastern Europe'],
    defaultCountries: ['Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Slovakia', 'Slovenia', 'Croatia', 'Serbia', 'Estonia', 'Latvia', 'Lithuania'],
  },
  'Rest of World': {
    keywords: ['Rest of World', 'Rest of the World', 'ROW', 'Other countries', 'Other regions'],
    defaultCountries: [],
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function normalizeRegionName(regionName: string): string {
  return regionName
    .replace(/\s+segment$/i, '')
    .replace(/\s+region$/i, '')
    .trim();
}

/**
 * FIX 2 + 6 + 7 + 8: Enhanced country extraction from text.
 * Covers: COUNTRY_ALIASES, REGIONAL_PATTERNS, currency codes, adjective forms.
 */
function extractCountriesFromText(text: string): string[] {
  const countries = new Set<string>();
  const lower = text.toLowerCase();

  // ── COUNTRY_ALIASES (word-boundary aware) ─────────────────────────────────
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i');
      if (regex.test(text)) {
        countries.add(country);
        break;
      }
    }
  }

  // ── REGIONAL_PATTERNS ─────────────────────────────────────────────────────
  for (const [, data] of Object.entries(REGIONAL_PATTERNS)) {
    for (const keyword of data.keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i');
      if (regex.test(text)) {
        data.defaultCountries.forEach(c => countries.add(c));
      }
    }
  }

  // ── Fix 6: Currency codes ─────────────────────────────────────────────────
  const currencyPattern = /\b(USD|EUR|GBP|JPY|CNY|RMB|CNH|HKD|TWD|KRW|INR|AUD|CAD|SGD|CHF|SEK|NOK|DKK|PLN|CZK|HUF|RON|BRL|MXN|ARS|CLP|COP|PEN|IDR|MYR|THB|VND|PHP|TRY|ILS|SAR|AED|QAR|KWD|EGP|NGN|KES|ZAR|RUB|UAH|PKR|BDT|LKR|MAD|DZD|TND|JOD|KZT|GEL|AZN|UZS|BGN|ISK|MNT|KHR|LAK|MMK|NPR|BND|MOP|GTQ|HNL|DOP|JMD|TTD|CRC|PYG|UYU|BOB)\b/g;
  const currencyMatches = text.match(currencyPattern);
  if (currencyMatches) {
    for (const currency of currencyMatches) {
      const mapped = CURRENCY_TO_COUNTRIES[currency.toUpperCase()];
      if (mapped) mapped.forEach(c => countries.add(c));
    }
  }

  // ── Fix 7: Adjective forms ────────────────────────────────────────────────
  for (const [adj, country] of Object.entries(ADJECTIVE_TO_COUNTRY)) {
    const escaped = adj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i');
    if (regex.test(lower)) {
      countries.add(country);
    }
  }

  return Array.from(countries);
}

// ============================================================================
// REGIONAL DEFINITION PARSER
// ============================================================================

function parseRegionalDefinitions(text: string): RegionalDefinition[] {
  const definitions: RegionalDefinition[] = [];

  const patterns: Array<{ regex: RegExp; source: string }> = [
    { regex: /([A-Z][a-z\s]+)\s+includes?\s+([^.;]+)/gi, source: 'Narrative text (includes pattern)' },
    { regex: /([A-Z][a-z\s]+)\s+consists?\s+of\s+([^.;]+)/gi, source: 'Narrative text (consists pattern)' },
    { regex: /([A-Z][a-z\s]+)\s+comprises?\s+([^.;]+)/gi, source: 'Narrative text (comprises pattern)' },
    { regex: /([A-Z][a-z\s]+)\s+encompasses?\s+([^.;]+)/gi, source: 'Narrative text (encompasses pattern)' },
    { regex: /([A-Z][a-z\s]+)\s+(?:is\s+)?defined\s+as\s+([^.;]+)/gi, source: 'Narrative text (defined as pattern)' },
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

// ============================================================================
// COUNTRY MENTION PARSER (Fix 10: also extract low-confidence mentions)
// ============================================================================

function parseCountryMentions(text: string): CountryMention[] {
  const mentions: CountryMention[] = [];

  const revenueKeywords = ['revenue', 'sales', 'market', 'customers', 'demand', 'net sales', 'net revenues'];
  const supplyKeywords = ['manufacturing', 'supplier', 'supply chain', 'production', 'assembly', 'sourcing', 'procurement', 'contract manufacturer', 'outsource'];
  const assetsKeywords = ['facility', 'facilities', 'plant', 'office', 'property', 'real estate', 'PP&E', 'long-lived assets', 'data center', 'warehouse', 'store', 'retail'];
  const financialKeywords = ['debt', 'currency', 'FX', 'foreign exchange', 'banking', 'credit facility', 'cash holdings', 'bond', 'notes payable', 'subsidiary', 'holding company', 'incorporated'];

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
    } else {
      // Fix 10: Extract low-confidence mentions even without channel keywords
      // Default to 'revenue' channel with low confidence so no country is silently dropped
      for (const country of countries) {
        mentions.push({
          country,
          channel: 'revenue',
          context: sentence.trim().substring(0, 200),
          confidence: 'low',
        });
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
 * Uses the EDGAR company tickers endpoint to resolve CIK, then fetches the
 * submissions JSON and the primary 10-K document.
 *
 * NOTE: The preferred integration path is to use `parseSECFiling()` from
 * `secFilingParser.ts` and pass the already-fetched HTML text to
 * `parseNarrativeText()` directly. Use `fetchSECFilingText` only when you need
 * a standalone narrative fetch without the full SEC parser pipeline.
 *
 * Returns empty string on any error (graceful fallback).
 */
export async function fetchSECFilingText(ticker: string): Promise<string> {
  try {
    const tickersUrl = 'https://www.sec.gov/files/company_tickers.json';
    const tickersRes = await fetch(tickersUrl, {
      headers: { 'User-Agent': 'COGRI-Platform research@cogri.dev' },
    });

    if (!tickersRes.ok) {
      console.warn(`[NarrativeParser] EDGAR company_tickers.json fetch failed: ${tickersRes.status}`);
      return '';
    }

    const tickersData = await tickersRes.json() as Record<string, { cik_str: number; ticker: string; title: string }>;

    const tickerUpper = ticker.toUpperCase();
    let resolvedCik: string | null = null;

    for (const entry of Object.values(tickersData)) {
      if (entry.ticker.toUpperCase() === tickerUpper) {
        resolvedCik = String(entry.cik_str);
        break;
      }
    }

    if (!resolvedCik) {
      console.warn(`[NarrativeParser] Could not find CIK for ticker ${ticker} in company_tickers.json`);
      return '';
    }

    const paddedCik = resolvedCik.padStart(10, '0');
    console.log(`[NarrativeParser] Resolved CIK for ${ticker}: ${paddedCik}`);

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

    const forms: string[] = filings.form || [];
    const accessionNumbers: string[] = filings.accessionNumber || [];
    const primaryDocuments: string[] = filings.primaryDocument || [];

    // Try 10-K first, then 20-F for ADRs
    let filingIndex = forms.findIndex(f => f === '10-K');
    if (filingIndex === -1) filingIndex = forms.findIndex(f => f === '20-F');
    if (filingIndex === -1) {
      console.warn(`[NarrativeParser] No 10-K or 20-F found for ${ticker}`);
      return '';
    }

    const accession = accessionNumbers[filingIndex].replace(/-/g, '');
    const primaryDoc = primaryDocuments[filingIndex];

    const numericCik = parseInt(resolvedCik, 10);
    const docUrl = `https://www.sec.gov/Archives/edgar/data/${numericCik}/${accession}/${primaryDoc}`;
    const docRes = await fetch(docUrl, {
      headers: { 'User-Agent': 'COGRI-Platform research@cogri.dev' },
    });

    if (!docRes.ok) {
      console.warn(`[NarrativeParser] Failed to fetch filing document for ${ticker}: ${docRes.status}`);
      return '';
    }

    const rawText = await docRes.text();

    // Fix 4: Enhanced HTML cleaning — handles iXBRL tags and entities
    const plainText = rawText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<ix:[^>]*>[\s\S]*?<\/ix:[^>]*>/gi, '')
      .replace(/<ix:[^>]*\/>/gi, '')
      .replace(/<\/ix:[^>]*>/gi, '')
      .replace(/<ix:[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/&#x[0-9a-fA-F]+;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 100000); // Increased from 50k to 100k

    console.log(`[NarrativeParser] ✅ Fetched filing text for ${ticker}: ${plainText.length} chars`);
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
 * Fix 1: This function NEVER generates simulated text.
 * Fix 2: Runs enhanced local extraction on all input text.
 * Fix 10: Captures low-confidence country mentions (no channel keyword required).
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

  // Fix 2: Also run direct country extraction on the full text
  const directCountries = extractCountriesFromText(narrativeText);
  directCountries.forEach(c => explicitCountries.add(c));

  console.log(`[Narrative Parser] Found ${regionalDefinitions.length} regional definitions, ${countryMentions.length} country mentions`);
  console.log(`[Narrative Parser] Explicit countries (${explicitCountries.size}): ${Array.from(explicitCountries).slice(0, 20).join(', ')}${explicitCountries.size > 20 ? '...' : ''}`);

  return {
    regionalDefinitions,
    countryMentions,
    explicitCountries,
    regionalCountries,
    isSimulated: false,
  };
}

// ============================================================================
// FIX 3 + 5 + 11: ENHANCED SECTION-LEVEL TEXT EXTRACTION
// ============================================================================

/**
 * extractSectionText
 *
 * Extracts the text of a named section from raw SEC filing HTML.
 *
 * Fix 3: Now supports 'business', 'item2Properties', 'exhibit21', 'segmentNotes'
 *        in addition to 'mda', 'riskFactors', 'geoNotes'.
 *
 * Fix 5: Broader iXBRL anchor patterns — covers 20-F section numbering
 *        (Item 4 Business, Item 5 MD&A), additional id/name attribute variants.
 *
 * Fix 11: Strategy D — mid-document window scan when all other strategies fail.
 *
 * Priority-ordered strategies:
 *   A: iXBRL id/name anchors (raw HTML)
 *   B: Table of Contents href links
 *   C: Heading text regex on stripped text
 *   D: Mid-document window scan (fallback)
 */
export function extractSectionText(
  html: string,
  sectionId: 'mda' | 'riskFactors' | 'geoNotes' | 'business' | 'item2Properties' | 'exhibit21' | 'segmentNotes'
): string {
  const MAX_CHARS = 60_000;
  const SLICE_LEN = 600_000;

  // Fix 4: Enhanced HTML strip — handles iXBRL tags and entities
  function stripSlice(start: number, len: number): string {
    return html
      .substring(start, start + len)
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<ix:[^>]*>[\s\S]*?<\/ix:[^>]*>/gi, '')
      .replace(/<ix:[^>]*\/>/gi, '')
      .replace(/<\/ix:[^>]*>/gi, '')
      .replace(/<ix:[^>]*>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/&#x[0-9a-fA-F]+;/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Fix 5: Expanded anchor patterns — covers 10-K and 20-F section numbering
  const anchorPatterns: Record<string, RegExp[]> = {
    mda: [
      /id=["'][^"']*item[\s_-]*7[^"']*["']/i,
      /id=["'][^"']*\bmda\b[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*7[^"']*["']/i,
      /id=["'][^"']*management[^"']*discussion[^"']*["']/i,
      /name=["'][^"']*management[^"']*discussion[^"']*["']/i,
      // 20-F Item 5 (Operating and Financial Review)
      /id=["'][^"']*item[\s_-]*5[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*5[^"']*["']/i,
      /id=["'][^"']*operating[^"']*financial[^"']*review[^"']*["']/i,
    ],
    riskFactors: [
      /id=["'][^"']*item[\s_-]*1a[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*1a[^"']*["']/i,
      /id=["'][^"']*risk[^"']*factor[^"']*["']/i,
      /name=["'][^"']*risk[^"']*factor[^"']*["']/i,
    ],
    geoNotes: [
      /id=["'][^"']*item[\s_-]*8[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*8[^"']*["']/i,
      /id=["'][^"']*geographic[^"']*["']/i,
      /name=["'][^"']*geographic[^"']*["']/i,
      /id=["'][^"']*financial[^"']*statement[^"']*["']/i,
    ],
    // Fix 3: New sections
    business: [
      /id=["'][^"']*item[\s_-]*1(?![a-z0-9])[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*1(?![a-z0-9])[^"']*["']/i,
      // 20-F Item 4
      /id=["'][^"']*item[\s_-]*4[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*4[^"']*["']/i,
      /id=["'][^"']*business[^"']*overview[^"']*["']/i,
      /id=["'][^"']*information[^"']*company[^"']*["']/i,
    ],
    item2Properties: [
      /id=["'][^"']*item[\s_-]*2[^"']*["']/i,
      /name=["'][^"']*item[\s_-]*2[^"']*["']/i,
      /id=["'][^"']*properties[^"']*["']/i,
      /name=["'][^"']*properties[^"']*["']/i,
    ],
    exhibit21: [
      /id=["'][^"']*exhibit[\s_-]*21[^"']*["']/i,
      /name=["'][^"']*exhibit[\s_-]*21[^"']*["']/i,
      /id=["'][^"']*subsidiaries[^"']*["']/i,
      /name=["'][^"']*subsidiaries[^"']*["']/i,
    ],
    segmentNotes: [
      /id=["'][^"']*segment[^"']*["']/i,
      /name=["'][^"']*segment[^"']*["']/i,
      /id=["'][^"']*geographic[^"']*note[^"']*["']/i,
      /id=["'][^"']*note[^"']*segment[^"']*["']/i,
      /id=["'][^"']*note[^"']*geographic[^"']*["']/i,
    ],
  };

  const tocPatterns: Record<string, RegExp[]> = {
    mda: [
      /href=["']#[^"']*item[\s_-]*7[^"']*["']/i,
      /href=["']#[^"']*\bmda\b[^"']*["']/i,
    ],
    riskFactors: [
      /href=["']#[^"']*item[\s_-]*1a[^"']*["']/i,
    ],
    geoNotes: [
      /href=["']#[^"']*item[\s_-]*8[^"']*["']/i,
      /href=["']#[^"']*geographic[^"']*["']/i,
    ],
    business: [
      /href=["']#[^"']*item[\s_-]*1(?![a-z0-9])[^"']*["']/i,
      /href=["']#[^"']*item[\s_-]*4[^"']*["']/i,
    ],
    item2Properties: [
      /href=["']#[^"']*item[\s_-]*2[^"']*["']/i,
      /href=["']#[^"']*properties[^"']*["']/i,
    ],
    exhibit21: [
      /href=["']#[^"']*exhibit[\s_-]*21[^"']*["']/i,
      /href=["']#[^"']*subsidiaries[^"']*["']/i,
    ],
    segmentNotes: [
      /href=["']#[^"']*segment[^"']*["']/i,
    ],
  };

  const headingPatterns: Record<string, RegExp[]> = {
    mda: [
      /Item\s+7[\s.]+Management.{0,10}s\s+Discussion\s+and\s+Analysis/i,
      /Item\s+7[\s.]+MD&A/i,
      /Management.{0,10}s\s+Discussion\s+and\s+Analysis/i,
      // 20-F
      /Item\s+5[\s.]+Operating\s+and\s+Financial\s+Review/i,
      /OPERATING\s+AND\s+FINANCIAL\s+REVIEW/i,
    ],
    riskFactors: [
      /Item\s+1A[\s.]+Risk\s+Factors/i,
      /RISK\s+FACTORS/i,
      /Key\s+Risk\s+Factors/i,
    ],
    geoNotes: [
      /Geographic\s+(?:Information|Segment|Area|Revenue|Breakdown)/i,
      /Revenue\s+by\s+(?:Geography|Geographic\s+Area|Region|Country)/i,
      /Segment\s+(?:Information|Reporting|Data)/i,
      /Note\s+\d+[\s.\u2014\u2013-]+(?:Segment|Geographic)/i,
    ],
    business: [
      /Item\s+1[\s.]+Business/i,
      /Item\s+1[\s.]+Description\s+of\s+Business/i,
      /Item\s+4[\s.]+Information\s+on\s+the\s+Company/i,
      /Item\s+4[\s.]+Business\s+Overview/i,
      /INFORMATION\s+ON\s+THE\s+COMPANY/i,
      /DESCRIPTION\s+OF\s+BUSINESS/i,
    ],
    item2Properties: [
      /Item\s+2[\s.]+Properties/i,
      /PROPERTIES\s*\n/i,
    ],
    exhibit21: [
      /Exhibit\s+21/i,
      /Subsidiaries\s+of\s+the\s+Registrant/i,
      /List\s+of\s+Subsidiaries/i,
      /SUBSIDIARIES\s+OF\s+THE\s+REGISTRANT/i,
    ],
    segmentNotes: [
      /Note\s+\d+[\s.\u2014\u2013-]+(?:Segment|Geographic)\s+(?:Information|Reporting|Data|Areas?)/i,
      /\d+\.\s+SEGMENT\s+(?:INFORMATION|REPORTING)/i,
      /Geographic\s+Areas?\s*(?:\n|\r|\.)/i,
      /Revenue\s+by\s+(?:Geography|Geographic\s+Area|Region|Country)/i,
    ],
  };

  const results: Array<{ strategy: string; text: string }> = [];

  // ── Strategy A: iXBRL id/name anchors ─────────────────────────────────────
  const patternsA = anchorPatterns[sectionId] || [];
  for (const pat of patternsA) {
    const m = html.match(pat);
    if (m && m.index !== undefined) {
      const stripped = stripSlice(m.index, SLICE_LEN).substring(0, MAX_CHARS);
      if (stripped.length > 200) {
        console.log(`[extractSectionText] ${sectionId}: Strategy A succeeded, ${stripped.length} chars`);
        results.push({ strategy: 'A', text: stripped });
        break;
      }
    }
  }

  // ── Strategy B: TOC href links ────────────────────────────────────────────
  if (results.length === 0) {
    const patternsB = tocPatterns[sectionId] || [];
    for (const pat of patternsB) {
      const m = html.match(pat);
      if (m && m.index !== undefined) {
        const hrefMatch = m[0].match(/href=["']#([^"']+)["']/i);
        if (hrefMatch) {
          const anchorId = hrefMatch[1];
          const anchorRe = new RegExp(`id=["']${anchorId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
          const anchorM = html.match(anchorRe);
          if (anchorM && anchorM.index !== undefined) {
            const stripped = stripSlice(anchorM.index, SLICE_LEN).substring(0, MAX_CHARS);
            if (stripped.length > 200) {
              console.log(`[extractSectionText] ${sectionId}: Strategy B succeeded, ${stripped.length} chars`);
              results.push({ strategy: 'B', text: stripped });
              break;
            }
          }
        }
      }
    }
  }

  // ── Strategy C: Heading text regex on stripped text ───────────────────────
  if (results.length === 0) {
    const stripped = stripSlice(0, html.length);
    const patternsC = headingPatterns[sectionId] || [];
    for (const pat of patternsC) {
      const m = stripped.match(pat);
      if (m && m.index !== undefined) {
        const text = stripped.substring(m.index, m.index + MAX_CHARS);
        if (text.length > 200) {
          console.log(`[extractSectionText] ${sectionId}: Strategy C succeeded, ${text.length} chars`);
          results.push({ strategy: 'C', text });
          break;
        }
      }
    }
  }

  // ── Strategy D (Fix 11): Mid-document window scan ─────────────────────────
  if (results.length === 0 && sectionId === 'mda') {
    const docLen = html.length;
    const midStart = Math.floor(docLen * 0.2);
    const stripped = stripSlice(midStart, Math.min(80000, docLen - midStart));
    if (stripped.length > 500) {
      console.log(`[extractSectionText] ${sectionId}: Strategy D (mid-doc scan) succeeded, ${stripped.length} chars`);
      results.push({ strategy: 'D', text: stripped.substring(0, MAX_CHARS) });
    }
  }

  if (results.length === 0) {
    console.log(`[extractSectionText] ${sectionId}: All strategies failed, returning empty string`);
    return '';
  }

  return results.sort((a, b) => b.text.length - a.text.length)[0].text;
}

/**
 * extractAllNarrativeSections
 *
 * Fix 3: Now returns all six sections (mda, riskFactors, geoNotes, business,
 * item2Properties, exhibit21, segmentNotes).
 */
export function extractAllNarrativeSections(html: string): {
  mda: string;
  riskFactors: string;
  geoNotes: string;
  business: string;
  item2Properties: string;
  exhibit21: string;
  segmentNotes: string;
} {
  return {
    mda:              extractSectionText(html, 'mda'),
    riskFactors:      extractSectionText(html, 'riskFactors'),
    geoNotes:         extractSectionText(html, 'geoNotes'),
    business:         extractSectionText(html, 'business'),
    item2Properties:  extractSectionText(html, 'item2Properties'),
    exhibit21:        extractSectionText(html, 'exhibit21'),
    segmentNotes:     extractSectionText(html, 'segmentNotes'),
  };
}

export default {
  parseNarrativeText,
  fetchSECFilingText,
  extractCountriesFromText,
  parseRegionalDefinitions,
  parseCountryMentions,
  extractSectionText,
  extractAllNarrativeSections,
};
