import { secEdgarService } from './secEdgarService';

interface SectorKeywords {
  sector: string;
  multiplier: number;
  keywords: string[];
  exclusions?: string[];
  companyPatterns?: string[]; // Specific company name patterns
  businessModels?: string[]; // Business model indicators
}

const SECTOR_DEFINITIONS: SectorKeywords[] = [
  {
    sector: 'Automotive',
    multiplier: 1.15,
    keywords: [
      'automotive', 'automobile', 'car manufacturer', 'vehicle', 'electric vehicle', 'ev',
      'tesla', 'ford', 'gm', 'general motors', 'toyota', 'volkswagen', 'bmw', 'mercedes',
      'auto parts', 'automotive supplier', 'car maker', 'motor company', 'mobility',
      'autonomous driving', 'self-driving', 'battery electric', 'hybrid vehicle',
      'rivian', 'lucid', 'nio', 'xpeng', 'byd', 'stellantis', 'honda', 'nissan',
      'hyundai', 'kia', 'mazda', 'subaru', 'volvo', 'porsche', 'ferrari', 'lamborghini',
      'automotive manufacturing', 'vehicle production', 'car assembly', 'auto dealer',
      'automotive retail', 'car sales', 'vehicle leasing', 'auto financing'
    ],
    companyPatterns: [
      'motors', 'automotive', 'auto', 'vehicle', 'car', 'mobility'
    ],
    businessModels: [
      'ev manufacturer', 'car maker', 'auto supplier', 'vehicle assembly'
    ]
  },
  {
    sector: 'Energy',
    multiplier: 1.12,
    keywords: [
      'energy', 'oil', 'gas', 'petroleum', 'lng', 'natural gas', 'crude oil',
      'exxon', 'chevron', 'bp', 'shell', 'conocophillips', 'occidental', 'marathon',
      'exploration', 'production', 'refining', 'downstream', 'upstream', 'midstream',
      'fossil fuel', 'hydrocarbon', 'energy producer', 'oil field', 'drilling',
      'exxonmobil', 'totalenergies', 'eni', 'equinor', 'petrobras', 'rosneft',
      'oilfield services', 'oil & gas', 'petroleum products', 'energy exploration',
      'fracking', 'shale oil', 'offshore drilling', 'onshore drilling', 'oil sands',
      'liquefied natural gas', 'pipeline', 'oil tanker', 'refinery', 'petrochemical',
      'ecopetrol', 'petrobras pbr', 'integrated oil', 'oil company', 'gas company',
      'petroleum company', 'energy company', 'oil producer', 'gas producer'
    ],
    exclusions: ['renewable', 'solar', 'wind', 'utility', 'clean energy'],
    companyPatterns: [
      'petroleum', 'energy', 'oil', 'gas', 'exploration', 'drilling', 'petro', 'petrol'
    ],
    businessModels: [
      'oil producer', 'gas producer', 'integrated energy', 'oil exploration',
      'petroleum refining', 'oil & gas exploration', 'energy exploration & production'
    ]
  },
  {
    sector: 'Technology',
    multiplier: 1.10,
    keywords: [
      'technology', 'software', 'hardware', 'semiconductor', 'chip', 'computing',
      'apple', 'microsoft', 'google', 'alphabet', 'meta', 'facebook', 'amazon',
      'nvidia', 'intel', 'amd', 'qualcomm', 'broadcom', 'oracle', 'salesforce',
      'cloud computing', 'artificial intelligence', 'ai', 'machine learning',
      'data center', 'enterprise software', 'saas', 'platform', 'digital',
      'cybersecurity', 'networking', 'telecommunications equipment', 'tech',
      'ibm', 'cisco', 'dell', 'hp', 'lenovo', 'samsung', 'sony', 'lg',
      'software development', 'app development', 'web services', 'cloud services',
      'information technology', 'it services', 'computer systems', 'data analytics',
      'big data', 'internet of things', 'iot', 'blockchain', 'cryptocurrency',
      'fintech', 'edtech', 'healthtech', 'proptech', 'martech', 'adtech',
      'semiconductor manufacturing', 'chip design', 'processor', 'gpu', 'cpu',
      'memory chips', 'storage devices', 'servers', 'workstations', 'laptops'
    ],
    companyPatterns: [
      'tech', 'soft', 'systems', 'solutions', 'digital', 'cyber', 'data', 'cloud'
    ],
    businessModels: [
      'saas provider', 'cloud platform', 'software company', 'tech services'
    ]
  },
  {
    sector: 'Basic Materials',
    multiplier: 1.09,
    keywords: [
      'mining', 'metals', 'steel', 'aluminum', 'copper', 'iron ore', 'coal',
      'bhp', 'rio tinto', 'vale', 'freeport', 'newmont', 'barrick', 'glencore',
      'chemicals', 'industrial chemicals', 'specialty chemicals', 'fertilizer',
      'paper', 'packaging', 'forestry', 'lumber', 'commodity', 'raw materials',
      'rare earth', 'lithium', 'cobalt', 'nickel', 'mineral resources', 'gold',
      'silver', 'platinum', 'palladium', 'zinc', 'lead', 'tin', 'titanium',
      'dow chemical', 'basf', 'dupont', 'lyondellbasell', 'air products',
      'agricultural chemicals', 'crop protection', 'nitrogen', 'phosphate', 'potash',
      'pulp and paper', 'containerboard', 'tissue products', 'wood products',
      'mining operations', 'metal production', 'smelting', 'refining metals',
      'chemical manufacturing', 'polymer production', 'plastics', 'resins'
    ],
    companyPatterns: [
      'mining', 'materials', 'metals', 'chemical', 'resources', 'commodities'
    ],
    businessModels: [
      'mining company', 'chemical producer', 'materials supplier', 'commodity producer'
    ]
  },
  {
    sector: 'Healthcare',
    multiplier: 1.08,
    keywords: [
      'healthcare', 'pharmaceutical', 'biotech', 'medical', 'hospital', 'health',
      'pfizer', 'johnson', 'merck', 'abbvie', 'bristol myers', 'eli lilly',
      'unitedhealth', 'cvs health', 'cigna', 'anthem', 'humana', 'aetna',
      'drug', 'medicine', 'therapy', 'clinical', 'diagnostic', 'device',
      'life sciences', 'biologics', 'vaccine', 'treatment', 'patient care',
      'novartis', 'roche', 'sanofi', 'glaxosmithkline', 'astrazeneca', 'bayer',
      'medical devices', 'surgical equipment', 'imaging equipment', 'laboratory',
      'health insurance', 'managed care', 'pharmacy benefits', 'drug distribution',
      'biotechnology', 'gene therapy', 'cell therapy', 'immunotherapy', 'oncology',
      'cardiology', 'neurology', 'orthopedics', 'ophthalmology', 'dermatology',
      'clinical trials', 'drug development', 'pharmaceutical research', 'medical research',
      'hospital systems', 'healthcare services', 'outpatient care', 'urgent care'
    ],
    companyPatterns: [
      'pharma', 'bio', 'health', 'medical', 'care', 'therapeutics', 'sciences'
    ],
    businessModels: [
      'drug manufacturer', 'biotech company', 'medical device maker', 'health insurer'
    ]
  },
  {
    sector: 'Industrials',
    multiplier: 1.07,
    keywords: [
      'industrial', 'manufacturing', 'machinery', 'equipment', 'aerospace',
      'caterpillar', '3m', 'honeywell', 'boeing', 'lockheed', 'raytheon',
      'ge', 'general electric', 'siemens', 'emerson', 'parker hannifin',
      'construction', 'engineering', 'infrastructure', 'transportation',
      'logistics', 'freight', 'shipping', 'railroad', 'airline', 'defense',
      'deere', 'cummins', 'paccar', 'wabtec', 'union pacific', 'norfolk southern',
      'fedex', 'ups', 'delta', 'united airlines', 'american airlines', 'southwest',
      'industrial equipment', 'heavy machinery', 'construction equipment', 'farm equipment',
      'aerospace defense', 'military equipment', 'weapons systems', 'aircraft manufacturing',
      'rail transportation', 'trucking', 'air freight', 'package delivery',
      'industrial automation', 'robotics', 'control systems', 'instrumentation',
      'building products', 'hvac', 'electrical equipment', 'power generation equipment'
    ],
    companyPatterns: [
      'industrial', 'manufacturing', 'engineering', 'systems', 'equipment', 'machinery'
    ],
    businessModels: [
      'manufacturer', 'industrial supplier', 'logistics provider', 'aerospace company'
    ]
  },
  {
    sector: 'Consumer Cyclical',
    multiplier: 1.06,
    keywords: [
      'retail', 'e-commerce', 'consumer discretionary', 'apparel', 'clothing',
      'amazon', 'walmart', 'target', 'costco', 'home depot', 'lowes',
      'nike', 'adidas', 'lululemon', 'tjx', 'ross stores', 'gap', 'macys',
      'restaurant', 'hotel', 'travel', 'leisure', 'entertainment', 'casino',
      'automotive retail', 'furniture', 'home improvement', 'luxury goods',
      'starbucks', 'mcdonalds', 'chipotle', 'yum brands', 'dominos',
      'marriott', 'hilton', 'hyatt', 'booking', 'expedia', 'airbnb',
      'consumer electronics', 'sporting goods', 'toys', 'jewelry', 'watches',
      'department stores', 'specialty retail', 'online retail', 'marketplace',
      'fast fashion', 'luxury fashion', 'footwear', 'accessories', 'cosmetics',
      'home furnishings', 'appliances', 'home decor', 'garden supplies',
      'restaurants chains', 'fast food', 'casual dining', 'quick service'
    ],
    companyPatterns: [
      'retail', 'stores', 'brands', 'apparel', 'restaurant', 'hotel', 'travel'
    ],
    businessModels: [
      'retailer', 'e-commerce platform', 'restaurant chain', 'hotel operator'
    ]
  },
  {
    sector: 'Financial Services',
    multiplier: 1.05,
    keywords: [
      'bank', 'banking', 'financial', 'finance', 'insurance', 'investment', 'asset management',
      'jpmorgan', 'bank of america', 'wells fargo', 'citigroup', 'goldman sachs',
      'morgan stanley', 'blackrock', 'visa', 'mastercard', 'american express',
      'credit card', 'payment', 'lending', 'mortgage', 'wealth management',
      'capital markets', 'trading', 'brokerage', 'financial services',
      'charles schwab', 'fidelity', 'vanguard', 'state street', 'bny mellon',
      'prudential', 'metlife', 'aig', 'travelers', 'progressive', 'allstate',
      'commercial banking', 'investment banking', 'private equity', 'hedge fund',
      'mutual funds', 'etf', 'index funds', 'retirement planning', 'financial advisory',
      'property casualty insurance', 'life insurance', 'health insurance', 'reinsurance',
      'payment processing', 'merchant services', 'digital payments', 'mobile payments',
      'consumer finance', 'auto loans', 'personal loans', 'credit services',
      'banco', 'banque', 'banca', 'bancorp', 'bancshares', 'bancorporation',
      'hsbc', 'barclays', 'santander', 'bnp paribas', 'credit suisse', 'ubs',
      'deutsche bank', 'societe generale', 'ing', 'unicredit', 'intesa',
      'itau', 'bradesco', 'bbva', 'scotiabank', 'td bank', 'rbc', 'bmo'
    ],
    companyPatterns: [
      'bank', 'banking', 'financial', 'capital', 'investment', 'insurance', 'fund', 'trust',
      'banco', 'banque', 'banca', 'bancorp', 'finance', 'credit'
    ],
    businessModels: [
      'commercial bank', 'investment bank', 'asset manager', 'insurance company',
      'retail banking', 'corporate banking', 'private banking', 'wealth management'
    ]
  },
  {
    sector: 'Communication Services',
    multiplier: 1.05,
    keywords: [
      'telecommunications', 'telecom', 'wireless', 'broadband', 'internet service',
      'att', 'verizon', 'tmobile', 'comcast', 'charter communications',
      'meta', 'facebook', 'netflix', 'disney', 'warner bros', 'paramount',
      'media', 'entertainment', 'streaming', 'content', 'social media',
      'cable', 'satellite', 'network operator', 'isp', 'fiber optic',
      'alphabet', 'google', 'youtube', 'twitter', 'x', 'snap', 'pinterest',
      'telecommunications services', 'mobile network', 'cellular', '5g', '4g',
      'cable tv', 'satellite tv', 'internet provider', 'broadband services',
      'content creation', 'video streaming', 'music streaming', 'gaming',
      'advertising', 'digital advertising', 'online advertising', 'ad tech',
      'broadcasting', 'radio', 'television', 'news media', 'publishing'
    ],
    companyPatterns: [
      'communications', 'telecom', 'media', 'entertainment', 'broadcasting', 'wireless'
    ],
    businessModels: [
      'telecom operator', 'media company', 'streaming service', 'social network'
    ]
  },
  {
    sector: 'Consumer Defensive',
    multiplier: 1.04,
    keywords: [
      'consumer staples', 'food', 'beverage', 'household products', 'personal care',
      'procter gamble', 'coca cola', 'pepsico', 'walmart', 'costco', 'kroger',
      'nestle', 'unilever', 'colgate', 'kimberly clark', 'general mills',
      'grocery', 'supermarket', 'packaged food', 'tobacco', 'consumer goods',
      'kraft heinz', 'mondelez', 'campbell soup', 'kellogg', 'conagra',
      'tyson foods', 'hormel', 'smithfield', 'perdue', 'pilgrim',
      'diageo', 'anheuser busch', 'molson coors', 'constellation brands',
      'food processing', 'food manufacturing', 'beverage manufacturing',
      'household cleaning', 'laundry products', 'paper products', 'tissues',
      'personal hygiene', 'cosmetics', 'beauty products', 'skincare', 'haircare',
      'tobacco products', 'cigarettes', 'vaping', 'smokeless tobacco',
      'pet food', 'pet care', 'baby products', 'diapers', 'formula'
    ],
    companyPatterns: [
      'foods', 'brands', 'products', 'consumer', 'grocery', 'beverage'
    ],
    businessModels: [
      'food manufacturer', 'beverage company', 'consumer goods maker', 'packaged goods'
    ]
  },
  {
    sector: 'Utilities',
    multiplier: 1.03,
    keywords: [
      'utility', 'utilities', 'electric', 'electricity', 'power', 'water',
      'nextera', 'duke energy', 'southern company', 'dominion', 'exelon',
      'renewable energy', 'solar', 'wind', 'hydroelectric', 'nuclear',
      'gas utility', 'water utility', 'regulated utility', 'power generation',
      'american electric', 'firstenergy', 'entergy', 'xcel energy', 'edison',
      'sempra energy', 'consolidated edison', 'public service enterprise',
      'electric utility', 'power utility', 'energy utility', 'transmission',
      'distribution', 'power grid', 'electrical grid', 'power lines',
      'natural gas distribution', 'gas pipeline', 'water treatment', 'wastewater',
      'renewable power', 'clean energy', 'solar power', 'wind power', 'solar farm',
      'wind farm', 'hydropower', 'geothermal', 'biomass', 'nuclear power plant'
    ],
    companyPatterns: [
      'energy', 'power', 'electric', 'utility', 'utilities', 'renewable'
    ],
    businessModels: [
      'electric utility', 'gas utility', 'water utility', 'renewable energy provider'
    ]
  },
  {
    sector: 'Real Estate',
    multiplier: 1.02,
    keywords: [
      'real estate', 'reit', 'property', 'properties', 'commercial real estate', 'residential',
      'american tower', 'prologis', 'crown castle', 'equinix', 'public storage',
      'simon property', 'realty income', 'welltower', 'ventas', 'avalonbay',
      'data center', 'cell tower', 'warehouse', 'logistics real estate',
      'shopping center', 'office', 'apartment', 'multifamily', 'retail property',
      'industrial property', 'healthcare real estate', 'senior housing',
      'self storage', 'manufactured housing', 'timberland', 'farmland',
      'real estate investment trust', 'property management', 'real estate development',
      'commercial property', 'office buildings', 'retail centers', 'strip malls',
      'apartment complexes', 'residential properties', 'single family rentals',
      'hotel properties', 'resort properties', 'mixed use development',
      'inmobiliaria', 'inmuebles', 'propiedades', 'bienes raices',
      'property developer', 'land development', 'urban development', 'construction development'
    ],
    companyPatterns: [
      'realty', 'properties', 'real estate', 'reit', 'property', 'development',
      'inmobiliaria', 'inmuebles', 'propiedades'
    ],
    businessModels: [
      'reit', 'property owner', 'real estate developer', 'property manager',
      'commercial real estate', 'residential real estate', 'property development'
    ]
  }
];

// Enhanced company-to-sector mapping for well-known companies
const COMPANY_SECTOR_MAP: Record<string, string> = {
  // Technology
  'apple': 'Technology', 'microsoft': 'Technology', 'alphabet': 'Technology', 'google': 'Technology',
  'meta': 'Technology', 'facebook': 'Technology', 'amazon': 'Technology', 'nvidia': 'Technology',
  'intel': 'Technology', 'amd': 'Technology', 'qualcomm': 'Technology', 'broadcom': 'Technology',
  'oracle': 'Technology', 'salesforce': 'Technology', 'cisco': 'Technology', 'ibm': 'Technology',
  'dell': 'Technology', 'hp': 'Technology', 'samsung': 'Technology', 'sony': 'Technology',
  
  // Automotive
  'tesla': 'Automotive', 'ford': 'Automotive', 'gm': 'Automotive', 'general motors': 'Automotive',
  'toyota': 'Automotive', 'volkswagen': 'Automotive', 'bmw': 'Automotive', 'mercedes': 'Automotive',
  'rivian': 'Automotive', 'lucid': 'Automotive', 'nio': 'Automotive', 'stellantis': 'Automotive',
  
  // Energy - ENHANCED with Ecopetrol and Petrobras
  'exxon': 'Energy', 'exxonmobil': 'Energy', 'chevron': 'Energy', 'bp': 'Energy',
  'shell': 'Energy', 'conocophillips': 'Energy', 'occidental': 'Energy', 'marathon': 'Energy',
  'ecopetrol': 'Energy', 'petrobras': 'Energy', 'totalenergies': 'Energy', 'eni': 'Energy',
  'equinor': 'Energy', 'rosneft': 'Energy', 'lukoil': 'Energy', 'gazprom': 'Energy',
  
  // Healthcare
  'pfizer': 'Healthcare', 'johnson': 'Healthcare', 'merck': 'Healthcare', 'abbvie': 'Healthcare',
  'unitedhealth': 'Healthcare', 'cvs': 'Healthcare', 'cigna': 'Healthcare', 'anthem': 'Healthcare',
  
  // Financial Services - ENHANCED with international banks and CIB
  'jpmorgan': 'Financial Services', 'bank of america': 'Financial Services', 'wells fargo': 'Financial Services',
  'citigroup': 'Financial Services', 'goldman sachs': 'Financial Services', 'morgan stanley': 'Financial Services',
  'blackrock': 'Financial Services', 'visa': 'Financial Services', 'mastercard': 'Financial Services',
  'hsbc': 'Financial Services', 'barclays': 'Financial Services', 'santander': 'Financial Services',
  'bnp paribas': 'Financial Services', 'credit suisse': 'Financial Services', 'ubs': 'Financial Services',
  'deutsche bank': 'Financial Services', 'societe generale': 'Financial Services', 'ing': 'Financial Services',
  'unicredit': 'Financial Services', 'intesa': 'Financial Services', 'itau': 'Financial Services',
  'bradesco': 'Financial Services', 'bbva': 'Financial Services', 'scotiabank': 'Financial Services',
  'cib': 'Financial Services', 'commercial international bank': 'Financial Services',
  'banco': 'Financial Services', 'bancorp': 'Financial Services', 'bancshares': 'Financial Services',
  
  // Consumer Cyclical
  'walmart': 'Consumer Cyclical', 'target': 'Consumer Cyclical', 'costco': 'Consumer Cyclical',
  'home depot': 'Consumer Cyclical', 'nike': 'Consumer Cyclical', 'starbucks': 'Consumer Cyclical',
  'mcdonalds': 'Consumer Cyclical', 'marriott': 'Consumer Cyclical', 'hilton': 'Consumer Cyclical',
  
  // Consumer Defensive
  'coca cola': 'Consumer Defensive', 'pepsico': 'Consumer Defensive', 'procter gamble': 'Consumer Defensive',
  'nestle': 'Consumer Defensive', 'unilever': 'Consumer Defensive', 'kraft heinz': 'Consumer Defensive',
  
  // Communication Services
  'verizon': 'Communication Services', 'att': 'Communication Services', 'tmobile': 'Communication Services',
  'comcast': 'Communication Services', 'netflix': 'Communication Services', 'disney': 'Communication Services',
  
  // Industrials
  'boeing': 'Industrials', 'lockheed': 'Industrials', 'caterpillar': 'Industrials',
  '3m': 'Industrials', 'honeywell': 'Industrials', 'ge': 'Industrials', 'general electric': 'Industrials',
  
  // Basic Materials
  'bhp': 'Basic Materials', 'rio tinto': 'Basic Materials', 'vale': 'Basic Materials',
  'freeport': 'Basic Materials', 'dow': 'Basic Materials', 'basf': 'Basic Materials',
  
  // Utilities
  'nextera': 'Utilities', 'duke energy': 'Utilities', 'southern company': 'Utilities',
  'dominion': 'Utilities', 'exelon': 'Utilities',
  
  // Real Estate - ENHANCED with IRSA and international real estate companies
  'american tower': 'Real Estate', 'prologis': 'Real Estate', 'crown castle': 'Real Estate',
  'equinix': 'Real Estate', 'simon property': 'Real Estate', 'realty income': 'Real Estate',
  'irsa': 'Real Estate', 'irsa inversiones': 'Real Estate', 'irsa propiedades': 'Real Estate',
  'inmobiliaria': 'Real Estate', 'propiedades': 'Real Estate', 'bienes raices': 'Real Estate'
};

export class SectorClassificationService {
  /**
   * Classify company sector using multiple data sources with enhanced accuracy
   * Now includes SEC Edgar API integration for authoritative SIC code validation
   */
  async classifySector(
    ticker: string,
    companyName: string,
    apiSector?: string,
    apiIndustry?: string,
    apiDescription?: string
  ): Promise<{ sector: string; multiplier: number; confidence: number; sources: string[] }> {
    const sources: string[] = [];
    const sectorScores: Map<string, { score: number; sources: string[] }> = new Map();

    // Initialize scores for all sectors
    SECTOR_DEFINITIONS.forEach(def => {
      sectorScores.set(def.sector, { score: 0, sources: [] });
    });

    // 0. NEW: Check SEC Edgar API for SIC code (highest authority - 70 points)
    try {
      const secData = await secEdgarService.getCompanyDataByTicker(ticker);
      if (secData.sector && secData.confidence > 0) {
        const current = sectorScores.get(secData.sector);
        if (current) {
          current.score += 70; // Highest weight for SEC Edgar data
          current.sources.push(`SEC Edgar (SIC ${secData.sicCode}: ${secData.sicDescription})`);
          sources.push(`SEC Edgar (SIC ${secData.sicCode})`);
          console.log(`✅ SEC Edgar: ${ticker} → SIC ${secData.sicCode} → ${secData.sector} (70 points)`);
        }
      }
    } catch (error) {
      console.log(`⚠️ SEC Edgar lookup failed for ${ticker}, continuing with other sources`);
    }

    // 1. Check well-known company mapping (high priority - 60 points)
    const directMatch = this.getDirectCompanyMatch(companyName);
    if (directMatch) {
      const current = sectorScores.get(directMatch)!;
      current.score += 60;
      current.sources.push('Known Company Database');
      sources.push('Known Company Database');
    }

    // 2. Check API-provided sector (high priority - 50 points)
    if (apiSector) {
      const apiMatch = this.matchSectorFromText(apiSector);
      if (apiMatch) {
        const current = sectorScores.get(apiMatch.sector)!;
        current.score += 50;
        current.sources.push('API Sector Classification');
        if (!sources.includes('API Sector Classification')) {
          sources.push('API Sector Classification');
        }
      }
    }

    // 3. Check API-provided industry (medium-high priority - 40 points)
    if (apiIndustry) {
      const industryMatch = this.matchSectorFromText(apiIndustry);
      if (industryMatch) {
        const current = sectorScores.get(industryMatch.sector)!;
        current.score += 40;
        current.sources.push('API Industry Classification');
        if (!sources.includes('API Industry Classification')) {
          sources.push('API Industry Classification');
        }
      }
    }

    // 4. Analyze API-provided business description (medium priority - 35 points)
    if (apiDescription) {
      const descriptionMatch = this.matchSectorFromText(apiDescription);
      if (descriptionMatch) {
        const current = sectorScores.get(descriptionMatch.sector)!;
        current.score += 35;
        current.sources.push('API Business Description');
        if (!sources.includes('API Business Description')) {
          sources.push('API Business Description');
        }
      }
    }

    // 5. Analyze company name with enhanced matching (30 points)
    const nameMatch = this.matchSectorFromText(companyName, true);
    if (nameMatch) {
      const current = sectorScores.get(nameMatch.sector)!;
      current.score += 30;
      current.sources.push('Company Name Analysis');
      if (!sources.includes('Company Name Analysis')) {
        sources.push('Company Name Analysis');
      }
    }

    // 6. Check company name patterns (25 points)
    const patternMatch = this.matchCompanyPattern(companyName);
    if (patternMatch) {
      const current = sectorScores.get(patternMatch)!;
      current.score += 25;
      current.sources.push('Company Name Pattern');
      if (!sources.includes('Company Name Pattern')) {
        sources.push('Company Name Pattern');
      }
    }

    // 7. Analyze ticker symbol (20 points)
    const tickerMatch = this.matchSectorFromText(ticker);
    if (tickerMatch) {
      const current = sectorScores.get(tickerMatch.sector)!;
      current.score += 20;
      current.sources.push('Ticker Symbol Analysis');
      if (!sources.includes('Ticker Symbol Analysis')) {
        sources.push('Ticker Symbol Analysis');
      }
    }

    // Find the sector with highest score
    let bestSector = 'General';
    let bestScore = 0;
    let bestMultiplier = 1.00;

    sectorScores.forEach((data, sector) => {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestSector = sector;
        const sectorDef = SECTOR_DEFINITIONS.find(d => d.sector === sector);
        bestMultiplier = sectorDef?.multiplier || 1.00;
      }
    });

    // Calculate confidence (0-100)
    // Max possible: 70 (SEC) + 60 (Known) + 50 (API Sector) + 40 (Industry) + 35 (Desc) + 30 (Name) + 25 (Pattern) + 20 (Ticker) = 330
    const maxPossibleScore = 330;
    const confidence = Math.min(100, (bestScore / maxPossibleScore) * 100);

    // If confidence is too low, default to General
    if (confidence < 15) {
      return {
        sector: 'General',
        multiplier: 1.00,
        confidence: 0,
        sources: ['Insufficient data - using default']
      };
    }

    return {
      sector: bestSector,
      multiplier: bestMultiplier,
      confidence: Math.round(confidence),
      sources: sectorScores.get(bestSector)?.sources || sources
    };
  }

  /**
   * Get direct company match from known company database
   */
  private getDirectCompanyMatch(companyName: string): string | null {
    const lowerName = companyName.toLowerCase();
    
    for (const [company, sector] of Object.entries(COMPANY_SECTOR_MAP)) {
      if (lowerName.includes(company)) {
        return sector;
      }
    }
    
    return null;
  }

  /**
   * Match company name patterns to sectors
   */
  private matchCompanyPattern(companyName: string): string | null {
    const lowerName = companyName.toLowerCase();
    
    for (const def of SECTOR_DEFINITIONS) {
      if (def.companyPatterns) {
        for (const pattern of def.companyPatterns) {
          if (lowerName.includes(pattern.toLowerCase())) {
            return def.sector;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Match sector from text using enhanced keyword analysis
   */
  private matchSectorFromText(text: string, usePatterns: boolean = false): { sector: string; multiplier: number } | null {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    const sectorMatches: Map<string, number> = new Map();

    SECTOR_DEFINITIONS.forEach(def => {
      let matchCount = 0;

      // Check keywords
      def.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });

      // Check business model patterns if enabled
      if (usePatterns && def.businessModels) {
        def.businessModels.forEach(model => {
          if (lowerText.includes(model.toLowerCase())) {
            matchCount += 2; // Higher weight for business model matches
          }
        });
      }

      // Check exclusions
      if (def.exclusions) {
        def.exclusions.forEach(exclusion => {
          if (lowerText.includes(exclusion.toLowerCase())) {
            matchCount -= 3; // Higher penalty for exclusions
          }
        });
      }

      if (matchCount > 0) {
        sectorMatches.set(def.sector, matchCount);
      }
    });

    // Find sector with most matches
    let bestSector: string | null = null;
    let bestCount = 0;

    sectorMatches.forEach((count, sector) => {
      if (count > bestCount) {
        bestCount = count;
        bestSector = sector;
      }
    });

    if (bestSector) {
      const sectorDef = SECTOR_DEFINITIONS.find(d => d.sector === bestSector);
      return {
        sector: bestSector,
        multiplier: sectorDef?.multiplier || 1.00
      };
    }

    return null;
  }

  /**
   * Get sector multiplier by sector name
   */
  getSectorMultiplier(sector: string): number {
    const sectorDef = SECTOR_DEFINITIONS.find(d => d.sector === sector);
    return sectorDef?.multiplier || 1.00;
  }

  /**
   * Get all available sectors
   */
  getAllSectors(): Array<{ sector: string; multiplier: number }> {
    return SECTOR_DEFINITIONS.map(def => ({
      sector: def.sector,
      multiplier: def.multiplier
    }));
  }

  /**
   * Get sector information including keyword count
   */
  getSectorInfo(sector: string): { 
    sector: string; 
    multiplier: number; 
    keywordCount: number;
    hasPatterns: boolean;
  } | null {
    const sectorDef = SECTOR_DEFINITIONS.find(d => d.sector === sector);
    if (!sectorDef) return null;

    return {
      sector: sectorDef.sector,
      multiplier: sectorDef.multiplier,
      keywordCount: sectorDef.keywords.length,
      hasPatterns: !!(sectorDef.companyPatterns || sectorDef.businessModels)
    };
  }
}

// Export singleton instance
export const sectorClassificationService = new SectorClassificationService();