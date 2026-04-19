/**
 * Expanded Data Sources Configuration - 55 sources across 4 tiers
 * 
 * Comprehensive global coverage for CSI event detection.
 */

export interface DataSource {
  id: string;
  name: string;
  url: string;
  rss_feed?: string;
  category: 'government' | 'regional' | 'sector' | 'think_tank';
  tier: 1 | 2 | 3;
  update_frequency_minutes: number;
  confidence_boost: number; // Percentage boost to confidence score
  regions?: string[];
  sectors?: string[];
  description: string;
}

/**
 * Tier 1: Authoritative Sources (15 sources)
 * Government agencies, central banks, international organizations
 */
export const TIER1_SOURCES: DataSource[] = [
  // US Government
  {
    id: 'fed',
    name: 'Federal Reserve',
    url: 'https://www.federalreserve.gov',
    rss_feed: 'https://www.federalreserve.gov/feeds/press_all.xml',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['United States'],
    description: 'US central bank policy and economic analysis'
  },
  {
    id: 'treasury',
    name: 'US Treasury',
    url: 'https://home.treasury.gov',
    rss_feed: 'https://home.treasury.gov/rss',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['United States'],
    description: 'Sanctions, financial policy, and economic data'
  },
  {
    id: 'state_dept',
    name: 'US State Department',
    url: 'https://www.state.gov',
    rss_feed: 'https://www.state.gov/rss-feed/',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'Diplomatic relations and international affairs'
  },
  {
    id: 'commerce',
    name: 'US Commerce Department',
    url: 'https://www.commerce.gov',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['United States'],
    description: 'Trade policy and export controls'
  },
  {
    id: 'ustr',
    name: 'US Trade Representative',
    url: 'https://ustr.gov',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['United States'],
    description: 'Trade agreements and disputes'
  },
  {
    id: 'sec',
    name: 'SEC',
    url: 'https://www.sec.gov',
    rss_feed: 'https://www.sec.gov/news/pressreleases.rss',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['United States'],
    sectors: ['Finance'],
    description: 'Securities regulation and enforcement'
  },

  // International Central Banks
  {
    id: 'boe',
    name: 'Bank of England',
    url: 'https://www.bankofengland.co.uk',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['United Kingdom'],
    description: 'UK monetary policy and financial stability'
  },
  {
    id: 'ecb',
    name: 'European Central Bank',
    url: 'https://www.ecb.europa.eu',
    rss_feed: 'https://www.ecb.europa.eu/rss/press.html',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['European Union'],
    description: 'Eurozone monetary policy'
  },
  {
    id: 'pboc',
    name: 'People\'s Bank of China',
    url: 'http://www.pbc.gov.cn/en/',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['China'],
    description: 'Chinese monetary policy and financial regulation'
  },

  // International Organizations
  {
    id: 'imf',
    name: 'International Monetary Fund',
    url: 'https://www.imf.org',
    rss_feed: 'https://www.imf.org/en/News/RSS',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'Global economic stability and financial assistance'
  },
  {
    id: 'world_bank',
    name: 'World Bank',
    url: 'https://www.worldbank.org',
    rss_feed: 'https://www.worldbank.org/en/news/all.rss',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'Development finance and economic data'
  },
  {
    id: 'wto',
    name: 'World Trade Organization',
    url: 'https://www.wto.org',
    rss_feed: 'https://www.wto.org/english/news_e/news_e.rss',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'International trade rules and disputes'
  },
  {
    id: 'oecd',
    name: 'OECD',
    url: 'https://www.oecd.org',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'Economic policy analysis and recommendations'
  },
  {
    id: 'g7',
    name: 'G7',
    url: 'https://www.g7germany.de/g7-en',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'Major economies coordination'
  },
  {
    id: 'bis',
    name: 'Bank for International Settlements',
    url: 'https://www.bis.org',
    category: 'government',
    tier: 1,
    update_frequency_minutes: 60,
    confidence_boost: 95,
    regions: ['Global'],
    description: 'Central bank coordination and financial stability'
  }
];

/**
 * Tier 2: Regional News Sources (20 sources)
 */
export const TIER2_SOURCES: DataSource[] = [
  // Asia-Pacific
  {
    id: 'scmp',
    name: 'South China Morning Post',
    url: 'https://www.scmp.com',
    rss_feed: 'https://www.scmp.com/rss/91/feed',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['China', 'Hong Kong', 'Asia'],
    description: 'Hong Kong-based coverage of China and Asia'
  },
  {
    id: 'nikkei',
    name: 'Nikkei Asia',
    url: 'https://asia.nikkei.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['Japan', 'Asia'],
    description: 'Japanese business and economic news'
  },
  {
    id: 'straits_times',
    name: 'The Straits Times',
    url: 'https://www.straitstimes.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 80,
    regions: ['Singapore', 'Southeast Asia'],
    description: 'Singapore-based regional coverage'
  },
  {
    id: 'japan_times',
    name: 'The Japan Times',
    url: 'https://www.japantimes.co.jp',
    rss_feed: 'https://www.japantimes.co.jp/feed/',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 80,
    regions: ['Japan'],
    description: 'English-language Japanese news'
  },
  {
    id: 'korea_herald',
    name: 'The Korea Herald',
    url: 'http://www.koreaherald.com',
    rss_feed: 'http://www.koreaherald.com/common/rss_xml.php',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 80,
    regions: ['South Korea'],
    description: 'South Korean news and analysis'
  },

  // Europe
  {
    id: 'dw',
    name: 'Deutsche Welle',
    url: 'https://www.dw.com',
    rss_feed: 'https://rss.dw.com/xml/rss-en-all',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['Germany', 'Europe'],
    description: 'German international broadcaster'
  },
  {
    id: 'france24',
    name: 'France 24',
    url: 'https://www.france24.com',
    rss_feed: 'https://www.france24.com/en/rss',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['France', 'Europe'],
    description: 'French international news'
  },
  {
    id: 'euronews',
    name: 'Euronews',
    url: 'https://www.euronews.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 80,
    regions: ['European Union'],
    description: 'Pan-European news network'
  },
  {
    id: 'politico_eu',
    name: 'Politico Europe',
    url: 'https://www.politico.eu',
    rss_feed: 'https://www.politico.eu/feed/',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['European Union'],
    description: 'EU politics and policy'
  },

  // Middle East
  {
    id: 'al_jazeera',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com',
    rss_feed: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 80,
    regions: ['Middle East', 'Qatar'],
    description: 'Qatar-based international news'
  },
  {
    id: 'arab_news',
    name: 'Arab News',
    url: 'https://www.arabnews.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 75,
    regions: ['Saudi Arabia', 'Middle East'],
    description: 'Saudi Arabian news'
  },
  {
    id: 'haaretz',
    name: 'Haaretz',
    url: 'https://www.haaretz.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 80,
    regions: ['Israel'],
    description: 'Israeli news and analysis'
  },

  // Latin America
  {
    id: 'buenos_aires_times',
    name: 'Buenos Aires Times',
    url: 'https://www.batimes.com.ar',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 75,
    regions: ['Argentina', 'Latin America'],
    description: 'Argentine news'
  },
  {
    id: 'brazil_reports',
    name: 'Brazil Reports',
    url: 'https://www.brazil-reports.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 75,
    regions: ['Brazil'],
    description: 'Brazilian news and analysis'
  },

  // Russia/Eastern Europe
  {
    id: 'moscow_times',
    name: 'The Moscow Times',
    url: 'https://www.themoscowtimes.com',
    rss_feed: 'https://www.themoscowtimes.com/rss/news',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 75,
    regions: ['Russia'],
    description: 'Independent Russian news'
  },
  {
    id: 'kyiv_post',
    name: 'Kyiv Post',
    url: 'https://www.kyivpost.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 75,
    regions: ['Ukraine'],
    description: 'Ukrainian news'
  },

  // Global
  {
    id: 'guardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com',
    rss_feed: 'https://www.theguardian.com/world/rss',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'UK-based global news'
  },
  {
    id: 'economist',
    name: 'The Economist',
    url: 'https://www.economist.com',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 90,
    regions: ['Global'],
    description: 'International affairs and economics'
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    url: 'https://www.wsj.com',
    rss_feed: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 90,
    regions: ['Global'],
    description: 'Business and financial news'
  },
  {
    id: 'nyt',
    name: 'New York Times',
    url: 'https://www.nytimes.com',
    rss_feed: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    category: 'regional',
    tier: 2,
    update_frequency_minutes: 360,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'International news and analysis'
  }
];

/**
 * Tier 3: Sector-Specific Sources (15 sources)
 */
export const TIER3_SOURCES: DataSource[] = [
  // Energy
  {
    id: 'platts',
    name: 'S&P Global Platts',
    url: 'https://www.spglobal.com/commodityinsights',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    sectors: ['Energy', 'Commodities'],
    description: 'Energy and commodities market intelligence'
  },
  {
    id: 'oilprice',
    name: 'OilPrice.com',
    url: 'https://oilprice.com',
    rss_feed: 'https://oilprice.com/rss/main',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 75,
    sectors: ['Energy'],
    description: 'Oil and energy market news'
  },

  // Technology
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    rss_feed: 'https://techcrunch.com/feed/',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 75,
    sectors: ['Technology'],
    description: 'Technology industry news'
  },
  {
    id: 'ars_technica',
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    rss_feed: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 80,
    sectors: ['Technology'],
    description: 'Technology news and analysis'
  },
  {
    id: 'semiconductor_eng',
    name: 'Semiconductor Engineering',
    url: 'https://semiengineering.com',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    sectors: ['Semiconductors', 'Technology'],
    description: 'Semiconductor industry news'
  },

  // Finance
  {
    id: 'ft_markets',
    name: 'Financial Times Markets',
    url: 'https://www.ft.com/markets',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 90,
    sectors: ['Finance'],
    description: 'Financial markets and banking'
  },
  {
    id: 'cnbc',
    name: 'CNBC',
    url: 'https://www.cnbc.com',
    rss_feed: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 80,
    sectors: ['Finance'],
    description: 'Business and financial news'
  },
  {
    id: 'marketwatch',
    name: 'MarketWatch',
    url: 'https://www.marketwatch.com',
    rss_feed: 'https://www.marketwatch.com/rss/',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 75,
    sectors: ['Finance'],
    description: 'Stock market and financial news'
  },

  // Trade & Supply Chain
  {
    id: 'supply_chain_dive',
    name: 'Supply Chain Dive',
    url: 'https://www.supplychaindive.com',
    rss_feed: 'https://www.supplychaindive.com/feeds/news/',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 80,
    sectors: ['Supply Chain', 'Logistics'],
    description: 'Supply chain industry news'
  },
  {
    id: 'joc',
    name: 'Journal of Commerce',
    url: 'https://www.joc.com',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    sectors: ['Trade', 'Logistics'],
    description: 'International trade and logistics'
  },

  // Defense
  {
    id: 'defense_news',
    name: 'Defense News',
    url: 'https://www.defensenews.com',
    rss_feed: 'https://www.defensenews.com/arc/outboundfeeds/rss/',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    sectors: ['Defense'],
    description: 'Defense industry news'
  },
  {
    id: 'janes',
    name: 'Janes',
    url: 'https://www.janes.com',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 90,
    sectors: ['Defense'],
    description: 'Defense intelligence and analysis'
  },

  // Pharmaceuticals
  {
    id: 'pharmatimes',
    name: 'PharmaTimes',
    url: 'https://www.pharmatimes.com',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 80,
    sectors: ['Pharmaceuticals'],
    description: 'Pharmaceutical industry news'
  },
  {
    id: 'fiercepharma',
    name: 'FiercePharma',
    url: 'https://www.fiercepharma.com',
    rss_feed: 'https://www.fiercepharma.com/rss/xml',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 80,
    sectors: ['Pharmaceuticals'],
    description: 'Pharmaceutical business news'
  },

  // Agriculture
  {
    id: 'agri_pulse',
    name: 'Agri-Pulse',
    url: 'https://www.agri-pulse.com',
    category: 'sector',
    tier: 3,
    update_frequency_minutes: 1440,
    confidence_boost: 75,
    sectors: ['Agriculture'],
    description: 'Agricultural policy and markets'
  }
];

/**
 * Think Tank Sources (5 sources)
 */
export const THINK_TANK_SOURCES: DataSource[] = [
  {
    id: 'csis',
    name: 'Center for Strategic and International Studies',
    url: 'https://www.csis.org',
    rss_feed: 'https://www.csis.org/analysis/feed',
    category: 'think_tank',
    tier: 2,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'Strategic and international affairs research'
  },
  {
    id: 'brookings',
    name: 'Brookings Institution',
    url: 'https://www.brookings.edu',
    rss_feed: 'https://www.brookings.edu/feed/',
    category: 'think_tank',
    tier: 2,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'Public policy research'
  },
  {
    id: 'cfr',
    name: 'Council on Foreign Relations',
    url: 'https://www.cfr.org',
    rss_feed: 'https://www.cfr.org/rss-feeds',
    category: 'think_tank',
    tier: 2,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'Foreign policy analysis'
  },
  {
    id: 'chatham_house',
    name: 'Chatham House',
    url: 'https://www.chathamhouse.org',
    category: 'think_tank',
    tier: 2,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'International affairs research'
  },
  {
    id: 'rand',
    name: 'RAND Corporation',
    url: 'https://www.rand.org',
    rss_feed: 'https://www.rand.org/pubs.xml',
    category: 'think_tank',
    tier: 2,
    update_frequency_minutes: 1440,
    confidence_boost: 85,
    regions: ['Global'],
    description: 'Policy research and analysis'
  }
];

/**
 * Get all data sources (55 total)
 */
export function getAllExpandedSources(): DataSource[] {
  return [
    ...TIER1_SOURCES,
    ...TIER2_SOURCES,
    ...TIER3_SOURCES,
    ...THINK_TANK_SOURCES
  ];
}

/**
 * Get sources by category
 */
export function getSourcesByCategory(category: DataSource['category']): DataSource[] {
  return getAllExpandedSources().filter(source => source.category === category);
}

/**
 * Get sources by tier
 */
export function getSourcesByTier(tier: 1 | 2 | 3): DataSource[] {
  return getAllExpandedSources().filter(source => source.tier === tier);
}

/**
 * Get sources by region
 */
export function getSourcesByRegion(region: string): DataSource[] {
  return getAllExpandedSources().filter(source => 
    source.regions?.includes(region) || source.regions?.includes('Global')
  );
}

/**
 * Get sources by sector
 */
export function getSourcesBySector(sector: string): DataSource[] {
  return getAllExpandedSources().filter(source => 
    source.sectors?.includes(sector)
  );
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): DataSource | undefined {
  return getAllExpandedSources().find(source => source.id === id);
}