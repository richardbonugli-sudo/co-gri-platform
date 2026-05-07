/**
 * Dynamic CSI Calculator with High-Frequency Data Integration
 * 
 * This service provides a framework for calculating Country Shock Index (CSI) scores
 * by integrating real-time high-frequency data sources across all 7 vectors.
 * 
 * Current Implementation: Uses baseline static scores with adjustment factors
 * Future Enhancement: Direct API integration with real-time data sources
 */

import { getCountryShockIndex } from '@/data/globalCountries';

// Type definition for high-frequency data sources
export interface HighFrequencySource {
  name: string;
  url: string;
  rss?: string;
  api?: string;
}

// High-frequency data source configuration with URLs
export const HIGH_FREQUENCY_SOURCES = {
  // Vector 1: Conflict & Security (SC1) - Weight: 0.22
  conflict: {
    weight: 0.22,
    baseline: [
      'GDELT', 'ACLED', 'UCDP', 'SIPRI', 'CSIS', 'IISS', 'Embassy Advisories'
    ],
    realtime: [
      { name: 'Reuters World News', url: 'https://www.reuters.com/world/' },
      { name: 'AP News', url: 'https://apnews.com/', rss: 'https://apnews.com/hub/ap-top-news' },
      { name: 'Bloomberg Geopolitical & Markets', url: 'https://www.bloomberg.com/markets' },
      { name: 'ISW (Institute for the Study of War)', url: 'https://www.understandingwar.org/', rss: 'https://www.understandingwar.org/rss.xml' },
      { name: 'Oryx - Verified Equipment Loss Tracking', url: 'https://www.oryxspioenkop.com/' },
      { name: 'MarineTraffic - Real-time Ship Tracking', url: 'https://www.marinetraffic.com/' },
      { name: 'FlightRadar24', url: 'https://www.flightradar24.com/' },
      { name: 'Liveuamap', url: 'https://liveuamap.com/' },
      { name: 'Crisis24', url: 'https://crisis24.garda.com/insights-intelligence' },
      { name: 'Janes Defense Intelligence', url: 'https://www.janes.com/' },
      { name: 'Breaking Defense', url: 'https://breakingdefense.com/', rss: 'https://breakingdefense.com/feed/' }
    ] as HighFrequencySource[],
    updateFrequency: 'real-time' // sub-hourly
  },
  
  // Vector 2: Sanctions & Regulatory (SC2) - Weight: 0.18
  sanctions: {
    weight: 0.18,
    baseline: [
      'OFAC', 'EU CFSP', 'BIS Entity List', 'UN Sanctions'
    ],
    realtime: [
      { name: 'OFAC Sanctions Feed', url: 'https://ofac.treasury.gov/', rss: 'https://sanctionssearch.ofac.treas.gov/News/News.xml' },
      { name: 'USTR Press Releases', url: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases' },
      { name: 'EU Commission Trade Actions', url: 'https://policy.trade.ec.europa.eu/news_en' },
      { name: 'U.S. Commerce Dept (BIS Export Controls)', url: 'https://www.bis.gov/newsroom' },
      { name: 'UN Security Council Updates', url: 'https://press.un.org/en' },
      { name: 'NATO Newsroom', url: 'https://www.nato.int/cps/en/natohq/news.htm' },
      { name: 'Indo-Pacific Command Updates', url: 'https://www.pacom.mil/Media/News/' },
      { name: 'U.S. Treasury Press Releases', url: 'https://home.treasury.gov/news/press-releases' },
      { name: 'Bank of International Settlements Bulletins', url: 'https://www.bis.org/list/bulletins.htm' },
      { name: 'IMF Country Announcements', url: 'https://www.imf.org/en/News' },
      { name: 'UK Foreign Office Sanctions', url: 'https://www.gov.uk/government/collections/financial-sanctions-latest-updates', rss: 'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office.atom' },
      { name: 'Australia DFAT Sanctions', url: 'https://www.dfat.gov.au/international-relations/security/sanctions' },
      { name: 'Japan METI Export Controls', url: 'https://www.meti.go.jp/english/policy/external_economy/trade_control/index.html' }
    ] as HighFrequencySource[],
    updateFrequency: 'real-time' // same-day
  },
  
  // Vector 3: Trade & Logistics (SC3) - Weight: 0.16
  trade: {
    weight: 0.16,
    baseline: [
      'WTO', 'USTR', 'OECD', 'Maritime Chokepoints', 'Export Controls'
    ],
    realtime: [
      { name: 'Lloyd\'s List Intelligence', url: 'https://www.lloydslistintelligence.com/' },
      { name: 'Splash247 - Maritime News', url: 'https://splash247.com/', rss: 'https://splash247.com/feed/' },
      { name: 'Baltic Dry Index & Freightos', url: 'https://fbx.freightos.com/' },
      { name: 'Global Fishing Watch', url: 'https://globalfishingwatch.org/' },
      { name: 'IHS Markit PMI Live Updates', url: 'https://www.spglobal.com/marketintelligence/en/news-insights' },
      { name: 'MarineTraffic - Vessel Tracking', url: 'https://www.marinetraffic.com/' },
      { name: 'Reuters World News', url: 'https://www.reuters.com/world/' },
      { name: 'AP News', url: 'https://apnews.com/', rss: 'https://apnews.com/hub/ap-top-news' },
      { name: 'Bloomberg Markets', url: 'https://www.bloomberg.com/markets' },
      { name: 'Financial Times', url: 'https://www.ft.com/world', rss: 'https://www.ft.com/rss' },
      { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/' }
    ] as HighFrequencySource[],
    updateFrequency: 'daily'
  },
  
  // Vector 4: Governance (SC4) - Weight: 0.14
  governance: {
    weight: 0.14,
    baseline: [
      'World Bank WGI', 'Freedom House', 'Transparency International'
    ],
    realtime: [
      { name: 'Al Jazeera - World News', url: 'https://www.aljazeera.com/news/', rss: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { name: 'BBC Global Breaking News', url: 'https://www.bbc.com/news/world', rss: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'DW (Deutsche Welle)', url: 'https://www.dw.com/en/top-stories/world/s-1429', rss: 'https://rss.dw.com/rdf/rss-en-world' },
      { name: 'South China Morning Post (SCMP)', url: 'https://www.scmp.com/' },
      { name: 'Reuters World News', url: 'https://www.reuters.com/world/' },
      { name: 'AP News', url: 'https://apnews.com/', rss: 'https://apnews.com/hub/ap-top-news' },
      { name: 'Financial Times', url: 'https://www.ft.com/world' }
    ] as HighFrequencySource[],
    updateFrequency: 'daily'
  },
  
  // Vector 5: Cyber & Data Sovereignty (SC5) - Weight: 0.12
  cyber: {
    weight: 0.12,
    baseline: [
      'CISA', 'ENISA', 'NetBlocks', 'National ICT Trackers'
    ],
    realtime: [
      { name: 'US-CERT Alerts', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories', rss: 'https://www.cisa.gov/cybersecurity-advisories/all.xml' },
      { name: 'ENISA Threat Bulletins', url: 'https://www.enisa.europa.eu/news', rss: 'https://www.enisa.europa.eu/news/RSS' },
      { name: 'Recorded Future Threat Intelligence', url: 'https://www.recordedfuture.com/' },
      { name: 'Cloudflare Radar', url: 'https://radar.cloudflare.com/', api: 'https://api.cloudflare.com/' },
      { name: 'NetBlocks - Connectivity Alerts', url: 'https://netblocks.org/' },
      { name: 'Mandiant Incident Updates', url: 'https://www.mandiant.com/' },
      { name: 'CISA Advisories', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories' }
    ] as HighFrequencySource[],
    updateFrequency: 'real-time'
  },
  
  // Vector 6: Public Unrest (SC6) - Weight: 0.10
  unrest: {
    weight: 0.10,
    baseline: [
      'OSINT', 'ACLED', 'ILO', 'Labor Ministries'
    ],
    realtime: [
      { name: 'GDELT Live - Global Event Tracking', url: 'https://www.gdeltproject.org/' },
      { name: 'ACLED Live Feed', url: 'https://acleddata.com/' },
      { name: 'Global Protest Tracker (Carnegie)', url: 'https://carnegieendowment.org/publications/interactive/protest-tracker' },
      { name: 'ILO Labour Disruption Bulletins', url: 'https://www.ilo.org/global/about-the-ilo/newsroom/news/lang--en/index.htm' },
      { name: 'Waze Traffic Anomaly Data', url: 'https://www.waze.com/live-map/' },
      { name: 'Verified Telegram Channels', url: 'https://telegram.org/' },
      { name: 'City-level Police Press Releases', url: 'https://www.prefecturedepolice.interieur.gouv.fr/Actualites' },
      { name: 'Reuters World News', url: 'https://www.reuters.com/world/' },
      { name: 'AP News', url: 'https://apnews.com/', rss: 'https://apnews.com/hub/ap-top-news' }
    ] as HighFrequencySource[],
    updateFrequency: 'real-time'
  },
  
  // Vector 7: Currency & Capital Controls (SC7) - Weight: 0.08
  currency: {
    weight: 0.08,
    baseline: [
      'IMF AREAER', 'BIS', 'FX Volatility Indices', 'Export Controls'
    ],
    realtime: [
      { name: 'CNH Offshore Spot Volatility', url: 'https://www.bloomberg.com/markets' },
      { name: 'EM Sovereign CDS Spreads', url: 'https://www.bloomberg.com/markets' },
      { name: 'EM Hard-Currency Bond Spreads (JPM EMBI)', url: 'https://www.jpmorgan.com/' },
      { name: 'BIS FX Liquidity Indicators', url: 'https://www.bis.org/statistics/index.htm' },
      { name: 'IIF Capital Flow Trackers', url: 'https://www.iif.com/Publications/Capital-Flows' },
      { name: 'Crypto Premium Differentials', url: 'https://www.coinbase.com/' },
      { name: 'IMF Country Announcements', url: 'https://www.imf.org/en/News' },
      { name: 'U.S. Treasury Press Releases', url: 'https://home.treasury.gov/news/press-releases' },
      { name: 'Bank of International Settlements Bulletins', url: 'https://www.bis.org/list/bulletins.htm' }
    ] as HighFrequencySource[],
    updateFrequency: 'real-time'
  }
};

/**
 * Risk adjustment factors based on recent high-frequency events
 * These would be updated by monitoring real-time data feeds
 */
interface RiskAdjustment {
  country: string;
  vector: keyof typeof HIGH_FREQUENCY_SOURCES;
  adjustment: number; // -10 to +10 points
  source: string;
  timestamp: Date;
  description: string;
}

// In-memory cache for risk adjustments (in production, this would be a database)
let riskAdjustments: RiskAdjustment[] = [];

/**
 * Calculate dynamic CSI score incorporating high-frequency data
 * 
 * Formula: CSI_dynamic = CSI_baseline + Σ(adjustments)
 * 
 * @param country - Country name
 * @returns Dynamic CSI score (0-100)
 */
export const calculateDynamicCSI = (country: string): number => {
  // Get baseline CSI from static database
  const baselineCSI = getCountryShockIndex(country);
  
  // Get recent risk adjustments for this country (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentAdjustments = riskAdjustments.filter(
    adj => adj.country === country && adj.timestamp >= thirtyDaysAgo
  );
  
  // Calculate total adjustment
  const totalAdjustment = recentAdjustments.reduce(
    (sum, adj) => sum + adj.adjustment, 
    0
  );
  
  // Apply adjustment with bounds checking
  const dynamicCSI = Math.max(0, Math.min(100, baselineCSI + totalAdjustment));
  
  return dynamicCSI;
};

/**
 * Add a risk adjustment based on high-frequency data event
 * 
 * @param adjustment - Risk adjustment details
 */
export const addRiskAdjustment = (adjustment: RiskAdjustment): void => {
  riskAdjustments.push(adjustment);
  
  // Keep only last 90 days of adjustments
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  riskAdjustments = riskAdjustments.filter(adj => adj.timestamp >= ninetyDaysAgo);
};

/**
 * Get recent risk adjustments for a country
 * 
 * @param country - Country name
 * @param days - Number of days to look back (default: 30)
 * @returns Array of risk adjustments
 */
export const getRecentAdjustments = (country: string, days: number = 30): RiskAdjustment[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return riskAdjustments.filter(
    adj => adj.country === country && adj.timestamp >= cutoffDate
  );
};

/**
 * Example: Simulate high-frequency data integration
 * In production, this would be replaced with actual API calls to data sources
 */
export const simulateHighFrequencyUpdate = (country: string): void => {
  // Example: Detect conflict escalation from ISW/Oryx data
  if (country === 'Ukraine') {
    addRiskAdjustment({
      country: 'Ukraine',
      vector: 'conflict',
      adjustment: 5,
      source: 'ISW Conflict Maps + Oryx Equipment Loss Tracking',
      timestamp: new Date(),
      description: 'Increased military activity detected in eastern regions'
    });
  }
  
  // Example: Detect new sanctions from OFAC feed
  if (country === 'Russia') {
    addRiskAdjustment({
      country: 'Russia',
      vector: 'sanctions',
      adjustment: 3,
      source: 'OFAC Sanctions Feed',
      timestamp: new Date(),
      description: 'New financial sector sanctions announced'
    });
  }
  
  // Example: Detect shipping disruption from Lloyd's List
  if (country === 'Yemen') {
    addRiskAdjustment({
      country: 'Yemen',
      vector: 'trade',
      adjustment: 4,
      source: 'Lloyd\'s List Intelligence + MarineTraffic',
      timestamp: new Date(),
      description: 'Red Sea shipping route disruptions affecting trade'
    });
  }
  
  // Example: Detect cyber attack from US-CERT
  if (country === 'Iran') {
    addRiskAdjustment({
      country: 'Iran',
      vector: 'cyber',
      adjustment: 2,
      source: 'US-CERT Alerts + Recorded Future',
      timestamp: new Date(),
      description: 'Increased APT activity targeting critical infrastructure'
    });
  }
  
  // Example: Detect protest activity from GDELT Live
  if (country === 'France') {
    addRiskAdjustment({
      country: 'France',
      vector: 'unrest',
      adjustment: 2,
      source: 'GDELT Live + Waze Traffic Anomalies',
      timestamp: new Date(),
      description: 'Labor strikes affecting transportation networks'
    });
  }
  
  // Example: Detect currency volatility from Bloomberg
  if (country === 'Turkey') {
    addRiskAdjustment({
      country: 'Turkey',
      vector: 'currency',
      adjustment: 3,
      source: 'Bloomberg FX Volatility + EM CDS Spreads',
      timestamp: new Date(),
      description: 'Lira volatility spike, capital control concerns'
    });
  }
};

/**
 * Get breakdown of CSI by vector with high-frequency adjustments
 * 
 * @param country - Country name
 * @returns Vector breakdown with baseline and adjusted scores
 */
export const getCSIVectorBreakdown = (country: string): {
  baseline: number;
  dynamic: number;
  vectors: Array<{
    name: string;
    weight: number;
    baselineScore: number;
    adjustments: number;
    dynamicScore: number;
    recentEvents: string[];
  }>;
} => {
  const baselineCSI = getCountryShockIndex(country);
  const dynamicCSI = calculateDynamicCSI(country);
  
  const recentAdjustments = getRecentAdjustments(country, 30);
  
  // Calculate per-vector breakdown
  const vectors = Object.entries(HIGH_FREQUENCY_SOURCES).map(([key, config]) => {
    const vectorAdjustments = recentAdjustments.filter(adj => adj.vector === key);
    const totalAdjustment = vectorAdjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
    
    // Estimate baseline vector score (proportional to weight)
    const baselineScore = baselineCSI * config.weight;
    const dynamicScore = baselineScore + totalAdjustment;
    
    return {
      name: config.baseline[0], // Use first baseline source as name
      weight: config.weight,
      baselineScore,
      adjustments: totalAdjustment,
      dynamicScore,
      recentEvents: vectorAdjustments.map(adj => 
        `${adj.source}: ${adj.description} (${adj.adjustment > 0 ? '+' : ''}${adj.adjustment})`
      )
    };
  });
  
  return {
    baseline: baselineCSI,
    dynamic: dynamicCSI,
    vectors
  };
};

/**
 * Get data source information for transparency
 */
export const getDataSourceInfo = () => HIGH_FREQUENCY_SOURCES;

/**
 * Initialize with example adjustments for demonstration
 * In production, this would be replaced with actual data ingestion
 */
export const initializeExampleData = (): void => {
  // Clear existing adjustments
  riskAdjustments = [];
  
  // Add example adjustments for demonstration
  const exampleCountries = ['Ukraine', 'Russia', 'Yemen', 'Iran', 'France', 'Turkey', 'China', 'Israel'];
  exampleCountries.forEach(country => simulateHighFrequencyUpdate(country));
};