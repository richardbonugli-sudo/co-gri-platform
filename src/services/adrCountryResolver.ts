/**
 * ADR Country Resolver
 * Resolves the true home country for American Depositary Receipts (ADRs)
 * that trade on US exchanges but represent foreign companies
 */

interface ADRPattern {
  pattern: RegExp;
  country: string;
  description: string;
}

// Known ADR ticker to country mappings
const KNOWN_ADR_MAPPINGS: Record<string, string> = {
  // Latin America
  'CRESY': 'Argentina',
  'CIB': 'Colombia',
  'BMA': 'Argentina',
  'TEO': 'Argentina',
  'GGAL': 'Argentina',
  'YPF': 'Argentina',
  'SUPV': 'Argentina',
  'IRS': 'Argentina',
  'PAM': 'Argentina',
  'TX': 'Argentina',
  'BBD': 'Brazil',
  'VALE': 'Brazil',
  'PBR': 'Brazil',
  'ITUB': 'Brazil',
  'ABEV': 'Brazil',
  'SBS': 'Brazil',
  'TIMB': 'Brazil',
  'BRFS': 'Brazil',
  'CBD': 'Brazil',
  'EBR': 'Brazil',
  'GGB': 'Brazil',
  'UGP': 'Brazil',
  'VIV': 'Brazil',
  'CIG': 'Brazil',
  'SID': 'Brazil',
  'ERJ': 'Brazil',
  'BSBR': 'Brazil',
  'BAK': 'Brazil',
  'CEPU': 'Peru',
  'EC': 'Colombia',
  'ECOPETROL': 'Colombia',
  'SQM': 'Chile',  // Sociedad Química y Minera de Chile - lithium mining
  'LTM': 'Chile',  // LATAM Airlines
  'BCH': 'Chile',  // Banco de Chile
  'BSAC': 'Chile', // Banco Santander Chile
  
  // Asia
  'BABA': 'China',
  'BIDU': 'China',
  'JD': 'China',
  'PDD': 'China',
  'NTES': 'China',
  'TME': 'China',
  'NIO': 'China',
  'LI': 'China',
  'XPEV': 'China',
  'BILI': 'China',
  'IQ': 'China',
  'VIPS': 'China',
  'WB': 'China',
  'HTHT': 'China',
  'YY': 'China',
  'MOMO': 'China',
  'ATHM': 'China',
  'TSM': 'Taiwan',
  'UMC': 'Taiwan',
  'ASX': 'Taiwan',
  'KB': 'South Korea',
  'LPL': 'South Korea',
  'SKM': 'South Korea',
  'PKX': 'South Korea',
  'SHI': 'South Korea',
  'SNP': 'China',
  'CEO': 'China',
  'CHU': 'China',
  'PTR': 'China',
  'CHL': 'China',
  'CHT': 'Taiwan',
  'HMC': 'Japan',
  'TM': 'Japan',
  'SONY': 'Japan',
  'SMFG': 'Japan',
  'MFG': 'Japan',
  'NMR': 'Japan',
  'MUFG': 'Japan',
  'MTU': 'Japan',
  'CAJ': 'Japan',
  'DCM': 'Japan',
  'HMY': 'South Africa',
  'GOLD': 'South Africa',
  'AU': 'South Africa',
  'SBSW': 'South Africa',
  'STNG': 'Bermuda',
  'VEDL': 'India',
  'IBN': 'India',
  'INFY': 'India',
  'WIT': 'India',
  'HDB': 'India',
  'RDY': 'India',
  'TTM': 'India',
  'SIFY': 'India',
  
  // Singapore Exchange (SGX) - Major Holdings and Conglomerates
  'J36.SI': 'Hong Kong',  // Jardine Matheson Holdings - Bermuda-incorporated, HK-based conglomerate
  'C07.SI': 'Hong Kong',  // Jardine Cycle & Carriage - Part of Jardine Matheson group
  'J37.SI': 'Hong Kong',  // Jardine Strategic Holdings - Part of Jardine Matheson group
  'H78.SI': 'Hong Kong',  // Hongkong Land Holdings - Part of Jardine Matheson group
  'M44U.SI': 'Hong Kong', // Dairy Farm International Holdings - Part of Jardine Matheson group
  'C52.SI': 'Singapore',  // ComfortDelGro Corporation
  'D05.SI': 'Singapore',  // DBS Group Holdings
  'O39.SI': 'Singapore',  // OCBC Bank
  'U11.SI': 'Singapore',  // United Overseas Bank
  'Z74.SI': 'Singapore',  // Singapore Telecommunications (Singtel)
  'BN4.SI': 'Singapore',  // Keppel Corporation
  'S63.SI': 'Singapore',  // Singapore Technologies Engineering
  'C38U.SI': 'Singapore', // CapitaLand Integrated Commercial Trust
  'ME8U.SI': 'Singapore', // Mapletree Logistics Trust
  'N2IU.SI': 'Singapore', // Mapletree Industrial Trust
  'M1GU.SI': 'Singapore', // Mapletree Greater China Commercial Trust
  'S58.SI': 'Singapore',  // SATS Ltd
  'G13.SI': 'Singapore',  // Genting Singapore
  'BS6.SI': 'Singapore',  // YZJ Shipbldg SGD
  'F34.SI': 'Singapore',  // Wilmar International
  'Y92.SI': 'Singapore',  // Thai Beverage
  'S68.SI': 'Singapore',  // Singapore Exchange
  'V03.SI': 'Singapore',  // Venture Corporation
  'U96.SI': 'Singapore',  // Sembcorp Industries
  
  // Europe
  'NVO': 'Denmark',
  'AZN': 'United Kingdom',
  'GSK': 'United Kingdom',
  'BP': 'United Kingdom',
  'RDS.A': 'Netherlands',
  'RDS.B': 'Netherlands',
  'SHEL': 'Netherlands',
  'ING': 'Netherlands',
  'PHG': 'Netherlands',
  'BCS': 'Spain',
  'SAN': 'Spain',
  'BBVA': 'Spain',
  'TEF': 'Spain',
  'DB': 'Germany',
  'SAP': 'Germany',
  'SIEGY': 'Germany',
  'BAYRY': 'Germany',
  'BASFY': 'Germany',
  'DDAIF': 'Germany',
  'VLVLY': 'Germany',
  'BMWYY': 'Germany',
  'BN': 'France',
  'SNY': 'France',
  'TEVA': 'Israel',
  'CHKP': 'Israel',
  'NICE': 'Israel',
  'WIX': 'Israel',
  'MNDY': 'Israel',
  
  // Others
  'RY': 'Canada',
  'TD': 'Canada',
  'BNS': 'Canada',
  'BMO': 'Canada',
  'CM': 'Canada',
  'SU': 'Canada',
  'CNQ': 'Canada',
  'ENB': 'Canada',
  'TRP': 'Canada',
  'ABX': 'Canada',
  'NEM': 'United States', // Actually US, not ADR
  'E': 'Italy',
  'ENEL': 'Italy',
  'MT': 'Luxembourg',
  'STLA': 'Netherlands',
  'NVS': 'Switzerland',
  'RHHBY': 'Switzerland',
  'UBS': 'Switzerland',
  'CS': 'Switzerland',
  'VOD': 'United Kingdom',
  'BHP': 'Australia',
  'RIO': 'United Kingdom',
  'WPL': 'Australia'
};

// Company name patterns that indicate country of origin
const NAME_PATTERNS: ADRPattern[] = [
  // Argentina
  { pattern: /SACIF y A/i, country: 'Argentina', description: 'Argentine corporate suffix' },
  { pattern: /S\.A\.C\.I\.F\./i, country: 'Argentina', description: 'Argentine corporate suffix' },
  { pattern: /Cresud/i, country: 'Argentina', description: 'Known Argentine company' },
  { pattern: /YPF/i, country: 'Argentina', description: 'Argentine state oil company' },
  { pattern: /Banco Macro/i, country: 'Argentina', description: 'Argentine bank' },
  { pattern: /Telecom Argentina/i, country: 'Argentina', description: 'Argentine telecom' },
  { pattern: /Grupo Financiero Galicia/i, country: 'Argentina', description: 'Argentine financial group' },
  
  // Colombia
  { pattern: /Bancolombia/i, country: 'Colombia', description: 'Colombian bank' },
  { pattern: /Grupo Cibest/i, country: 'Colombia', description: 'Colombian company' },
  { pattern: /Ecopetrol/i, country: 'Colombia', description: 'Colombian oil company' },
  
  // Brazil
  { pattern: /Petrobras/i, country: 'Brazil', description: 'Brazilian oil company' },
  { pattern: /Vale/i, country: 'Brazil', description: 'Brazilian mining company' },
  { pattern: /Itaú/i, country: 'Brazil', description: 'Brazilian bank' },
  { pattern: /Banco Bradesco/i, country: 'Brazil', description: 'Brazilian bank' },
  { pattern: /Ambev/i, country: 'Brazil', description: 'Brazilian beverage company' },
  { pattern: /Companhia/i, country: 'Brazil', description: 'Brazilian corporate prefix' },
  
  // Chile
  { pattern: /Banco de Chile/i, country: 'Chile', description: 'Chilean bank' },
  { pattern: /Banco Santander Chile/i, country: 'Chile', description: 'Chilean bank' },
  { pattern: /Sociedad Química y Minera/i, country: 'Chile', description: 'Chilean mining company (SQM)' },
  { pattern: /SQM/i, country: 'Chile', description: 'Chilean lithium mining company' },
  { pattern: /LATAM Airlines/i, country: 'Chile', description: 'Chilean airline' },
  
  // Mexico
  { pattern: /América Móvil/i, country: 'Mexico', description: 'Mexican telecom' },
  { pattern: /Cemex/i, country: 'Mexico', description: 'Mexican cement company' },
  { pattern: /Grupo Televisa/i, country: 'Mexico', description: 'Mexican media company' },
  
  // China
  { pattern: /Alibaba/i, country: 'China', description: 'Chinese e-commerce' },
  { pattern: /Baidu/i, country: 'China', description: 'Chinese search engine' },
  { pattern: /JD\.com/i, country: 'China', description: 'Chinese e-commerce' },
  { pattern: /Pinduoduo/i, country: 'China', description: 'Chinese e-commerce' },
  { pattern: /NetEase/i, country: 'China', description: 'Chinese internet company' },
  { pattern: /Tencent Music/i, country: 'China', description: 'Chinese music streaming' },
  { pattern: /NIO/i, country: 'China', description: 'Chinese EV maker' },
  { pattern: /Li Auto/i, country: 'China', description: 'Chinese EV maker' },
  { pattern: /XPeng/i, country: 'China', description: 'Chinese EV maker' },
  { pattern: /Bilibili/i, country: 'China', description: 'Chinese video platform' },
  { pattern: /iQIYI/i, country: 'China', description: 'Chinese streaming service' },
  { pattern: /PetroChina/i, country: 'China', description: 'Chinese oil company' },
  { pattern: /China Mobile/i, country: 'China', description: 'Chinese telecom' },
  { pattern: /Sinopec/i, country: 'China', description: 'Chinese oil company' },
  { pattern: /CNOOC/i, country: 'China', description: 'Chinese oil company' },
  
  // Hong Kong & Jardine Matheson Group
  { pattern: /Jardine Matheson/i, country: 'Hong Kong', description: 'Jardine Matheson Holdings - HK-based conglomerate' },
  { pattern: /Jardine Strategic/i, country: 'Hong Kong', description: 'Part of Jardine Matheson group' },
  { pattern: /Jardine Cycle/i, country: 'Hong Kong', description: 'Part of Jardine Matheson group' },
  { pattern: /Hongkong Land/i, country: 'Hong Kong', description: 'Part of Jardine Matheson group' },
  { pattern: /Dairy Farm International/i, country: 'Hong Kong', description: 'Part of Jardine Matheson group' },
  { pattern: /Mandarin Oriental/i, country: 'Hong Kong', description: 'Part of Jardine Matheson group' },
  
  // Taiwan
  { pattern: /Taiwan Semiconductor/i, country: 'Taiwan', description: 'Taiwanese semiconductor' },
  { pattern: /TSMC/i, country: 'Taiwan', description: 'Taiwanese semiconductor' },
  { pattern: /United Microelectronics/i, country: 'Taiwan', description: 'Taiwanese semiconductor' },
  { pattern: /Chunghwa Telecom/i, country: 'Taiwan', description: 'Taiwanese telecom' },
  
  // South Korea
  { pattern: /KB Financial/i, country: 'South Korea', description: 'Korean bank' },
  { pattern: /LG Display/i, country: 'South Korea', description: 'Korean display maker' },
  { pattern: /SK Telecom/i, country: 'South Korea', description: 'Korean telecom' },
  { pattern: /POSCO/i, country: 'South Korea', description: 'Korean steel company' },
  
  // Japan
  { pattern: /Honda Motor/i, country: 'Japan', description: 'Japanese automaker' },
  { pattern: /Toyota Motor/i, country: 'Japan', description: 'Japanese automaker' },
  { pattern: /Sony/i, country: 'Japan', description: 'Japanese electronics' },
  { pattern: /Mitsubishi UFJ/i, country: 'Japan', description: 'Japanese bank' },
  { pattern: /Mizuho/i, country: 'Japan', description: 'Japanese bank' },
  { pattern: /Sumitomo Mitsui/i, country: 'Japan', description: 'Japanese bank' },
  { pattern: /Canon/i, country: 'Japan', description: 'Japanese electronics' },
  
  // India
  { pattern: /Infosys/i, country: 'India', description: 'Indian IT services' },
  { pattern: /ICICI Bank/i, country: 'India', description: 'Indian bank' },
  { pattern: /HDFC Bank/i, country: 'India', description: 'Indian bank' },
  { pattern: /Wipro/i, country: 'India', description: 'Indian IT services' },
  { pattern: /Tata Motors/i, country: 'India', description: 'Indian automaker' },
  { pattern: /Dr\. Reddy/i, country: 'India', description: 'Indian pharma' },
  { pattern: /Vedanta/i, country: 'India', description: 'Indian mining' },
  
  // South Africa
  { pattern: /Harmony Gold/i, country: 'South Africa', description: 'South African mining' },
  { pattern: /AngloGold Ashanti/i, country: 'South Africa', description: 'South African mining' },
  { pattern: /Gold Fields/i, country: 'South Africa', description: 'South African mining' },
  { pattern: /Sibanye/i, country: 'South Africa', description: 'South African mining' },
  
  // Israel
  { pattern: /Teva Pharmaceutical/i, country: 'Israel', description: 'Israeli pharma' },
  { pattern: /Check Point/i, country: 'Israel', description: 'Israeli cybersecurity' },
  { pattern: /NICE/i, country: 'Israel', description: 'Israeli software' },
  
  // Europe
  { pattern: /Novo Nordisk/i, country: 'Denmark', description: 'Danish pharma' },
  { pattern: /AstraZeneca/i, country: 'United Kingdom', description: 'UK pharma' },
  { pattern: /GlaxoSmithKline/i, country: 'United Kingdom', description: 'UK pharma' },
  { pattern: /BP p\.l\.c\./i, country: 'United Kingdom', description: 'UK oil company' },
  { pattern: /Royal Dutch Shell/i, country: 'Netherlands', description: 'Dutch oil company' },
  { pattern: /Shell plc/i, country: 'Netherlands', description: 'Dutch oil company' },
  { pattern: /ING Groep/i, country: 'Netherlands', description: 'Dutch bank' },
  { pattern: /Philips/i, country: 'Netherlands', description: 'Dutch electronics' },
  { pattern: /Banco Santander/i, country: 'Spain', description: 'Spanish bank' },
  { pattern: /Telefónica/i, country: 'Spain', description: 'Spanish telecom' },
  { pattern: /BBVA/i, country: 'Spain', description: 'Spanish bank' },
  { pattern: /Deutsche Bank/i, country: 'Germany', description: 'German bank' },
  { pattern: /SAP/i, country: 'Germany', description: 'German software' },
  { pattern: /Siemens/i, country: 'Germany', description: 'German industrial' },
  { pattern: /Bayer/i, country: 'Germany', description: 'German pharma' },
  { pattern: /BASF/i, country: 'Germany', description: 'German chemicals' },
  { pattern: /Volkswagen/i, country: 'Germany', description: 'German automaker' },
  { pattern: /BMW/i, country: 'Germany', description: 'German automaker' },
  { pattern: /BNP Paribas/i, country: 'France', description: 'French bank' },
  { pattern: /Sanofi/i, country: 'France', description: 'French pharma' },
  { pattern: /Novartis/i, country: 'Switzerland', description: 'Swiss pharma' },
  { pattern: /Roche/i, country: 'Switzerland', description: 'Swiss pharma' },
  { pattern: /UBS/i, country: 'Switzerland', description: 'Swiss bank' },
  { pattern: /Credit Suisse/i, country: 'Switzerland', description: 'Swiss bank' },
  { pattern: /Vodafone/i, country: 'United Kingdom', description: 'UK telecom' },
  { pattern: /BHP/i, country: 'Australia', description: 'Australian mining' },
  { pattern: /Rio Tinto/i, country: 'United Kingdom', description: 'UK mining' },
  
  // Canada
  { pattern: /Royal Bank of Canada/i, country: 'Canada', description: 'Canadian bank' },
  { pattern: /Toronto-Dominion/i, country: 'Canada', description: 'Canadian bank' },
  { pattern: /Bank of Nova Scotia/i, country: 'Canada', description: 'Canadian bank' },
  { pattern: /Bank of Montreal/i, country: 'Canada', description: 'Canadian bank' },
  { pattern: /Canadian Imperial/i, country: 'Canada', description: 'Canadian bank' },
  { pattern: /Suncor Energy/i, country: 'Canada', description: 'Canadian energy' },
  { pattern: /Canadian Natural Resources/i, country: 'Canada', description: 'Canadian energy' },
  { pattern: /Enbridge/i, country: 'Canada', description: 'Canadian pipeline' },
  { pattern: /TransCanada/i, country: 'Canada', description: 'Canadian pipeline' },
  { pattern: /Barrick Gold/i, country: 'Canada', description: 'Canadian mining' }
];

/**
 * Resolve the true home country for a company, correcting ADR misclassifications
 */
export function resolveADRCountry(
  ticker: string,
  companyName: string,
  apiCountry: string,
  exchange?: string
): { country: string; isADR: boolean; confidence: 'high' | 'medium' | 'low'; source: string } {
  const upperTicker = ticker.toUpperCase();
  
  // Check if API already returned non-US country
  if (apiCountry && apiCountry !== 'USA' && apiCountry !== 'United States') {
    // But still check if we have a better mapping for this ticker
    if (KNOWN_ADR_MAPPINGS[upperTicker]) {
      return {
        country: KNOWN_ADR_MAPPINGS[upperTicker],
        isADR: true,
        confidence: 'high',
        source: 'Known ADR Database (Override)'
      };
    }
    
    return {
      country: apiCountry,
      isADR: false,
      confidence: 'high',
      source: 'API Data'
    };
  }
  
  // Check known ADR mappings first (highest confidence)
  if (KNOWN_ADR_MAPPINGS[upperTicker]) {
    return {
      country: KNOWN_ADR_MAPPINGS[upperTicker],
      isADR: true,
      confidence: 'high',
      source: 'Known ADR Database'
    };
  }
  
  // Check company name patterns (medium confidence)
  if (companyName) {
    for (const pattern of NAME_PATTERNS) {
      if (pattern.pattern.test(companyName)) {
        return {
          country: pattern.country,
          isADR: true,
          confidence: 'medium',
          source: `Name Pattern: ${pattern.description}`
        };
      }
    }
  }
  
  // If exchange is clearly US and no ADR indicators found, it's likely a US company
  const usExchanges = ['NASDAQ', 'NYSE', 'AMEX', 'NYSEARCA', 'BATS'];
  if (exchange && usExchanges.some(ex => exchange.toUpperCase().includes(ex))) {
    return {
      country: 'United States',
      isADR: false,
      confidence: 'low',
      source: 'US Exchange Default'
    };
  }
  
  // Default to API country
  return {
    country: apiCountry || 'United States',
    isADR: false,
    confidence: 'low',
    source: 'API Default'
  };
}

/**
 * Check if a ticker is a known ADR
 */
export function isKnownADR(ticker: string): boolean {
  return ticker.toUpperCase() in KNOWN_ADR_MAPPINGS;
}

/**
 * Get all known ADR tickers
 */
export function getKnownADRs(): string[] {
  return Object.keys(KNOWN_ADR_MAPPINGS);
}

/**
 * Get the expected country for a known ADR
 */
export function getADRCountry(ticker: string): string | null {
  return KNOWN_ADR_MAPPINGS[ticker.toUpperCase()] || null;
}